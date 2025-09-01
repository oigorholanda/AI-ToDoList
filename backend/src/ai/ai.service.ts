import { Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { AiProvider, AiResponseShape, PromptDto, AiAction } from './dto/prompt.dto';


@Injectable()
export class AiService {
    constructor(private readonly tasksService: TasksService) { }


    async handlePrompt(dto: PromptDto) {
        const provider: AiProvider = dto.provider ?? 'openrouter';
        const key = dto.apiKey || (provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.HF_API_KEY);
        if (!key) {
            throw new Error('Missing API key. Send `apiKey` in the body or configure env var.');
        }


        const tasks = await this.tasksService.findAll();


        const system = `You are an assistant for a Smart To-Do app.
        Return ONLY a compact JSON matching this TypeScript type:
        {
            "actions": (
            | { "type": "LIST_PENDING" }
            | { "type": "CREATE_TASKS", "tasks": string[] }
            | { "type": "COMPLETE_TASKS", "ids": number[] }
            )[];
            "message"?: string;
        }
        Rules:
        - If user asks which tasks are pending, include LIST_PENDING.
        - If user asks to create tasks, include CREATE_TASKS with short actionable titles.
        - If user asks to complete tasks, include COMPLETE_TASKS with integer ids.
        - Do not include text outside the JSON.`;


        const user = `Current tasks (id, title, isCompleted):\n${tasks
            .map((t) => `- ${t.id}\t${t.title}\t${t.isCompleted}`)
            .join('\n')}\n\nUser request: ${dto.prompt}`;


        const rawText = await this.callProvider(provider, key, dto.model, system, user);
        const parsed = this.safeParseAiJson(rawText);

        // Executa ações
        const executed: { action: string; result: any }[] = [];


        if (parsed?.actions?.length) {
            for (const action of parsed.actions) {
                if (action.type === 'LIST_PENDING') {
                    const pending = await this.tasksService.findPending();
                    executed.push({ action: 'LIST_PENDING', result: pending });
                }
                if (action.type === 'CREATE_TASKS') {
                    const titles = Array.isArray(action.tasks) ? action.tasks : [];
                    const created = await this.tasksService.createMany(titles);
                    executed.push({ action: 'CREATE_TASKS', result: created });
                }
                if (action.type === 'COMPLETE_TASKS') {
                    const ids = Array.isArray(action.ids) ? action.ids : [];
                    const completed = [] as any[];
                    for (const id of ids) {
                        try {
                            const t = await this.tasksService.completeById(Number(id));
                            completed.push(t);
                        } catch (e) {
                            completed.push({ id, error: 'Task not found' });
                        }
                    }
                    executed.push({ action: 'COMPLETE_TASKS', result: completed });
                }
            }
        }


        const updated = await this.tasksService.findAll();


        return {
            message: parsed?.message ?? 'ok',
            executed,
            tasks: updated,
            raw: rawText, 
        };
    }


    private async callProvider(
        provider: AiProvider,
        key: string,
        model: string | undefined,
        system: string,
        user: string,
    ): Promise<string> {
        if (provider === 'huggingface') {
            const m = model || 'mistralai/Mistral-7B-Instruct-v0.3';
            const resp = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(m)}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: `${system}\n\n${user}` }),
            });
            const data = await resp.json();
            // HF pode retornar array/obj; tentar extrair texto
            const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || JSON.stringify(data);
            return String(text ?? '');
        }


        // OpenRouter (padrão)
        const m = model || 'openrouter/auto';
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
                'X-Title': 'AI-ToDoList Dev',
            },
            body: JSON.stringify({
                model: m,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0.2,
            }),
        });
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
        return String(text ?? '');
    }


    private safeParseAiJson(text: string): AiResponseShape | null {
        // tenta pegar bloco ```json ... ```
        const fence = /```json\s*([\s\S]*?)\s*```/i.exec(text);
        const raw = fence ? fence[1] : text;
        try {
            const parsed = JSON.parse(raw);
            // valida forma básica
            if (parsed && Array.isArray(parsed.actions)) return parsed as AiResponseShape;
            return null;
        } catch (_) {
            return null;
        }
    }
}