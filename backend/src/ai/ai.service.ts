import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { AiProvider, AiResponseShape, PromptDto, AiAction } from './dto/prompt.dto';


@Injectable()
export class AiService {
    constructor(private readonly tasksService: TasksService) { }


    async handlePrompt(dto: PromptDto) {
        const provider: AiProvider = dto.provider ?? 'openrouter';
        const key = dto.apiKey || process.env.OPENROUTER_API_KEY;
        if (!key) {
            throw new HttpException(
                'Missing API key. Send `apiKey` in the body or configure env var.',
                HttpStatus.UNAUTHORIZED,
            );
        }


        const tasks = await this.tasksService.findAll();


        const system = `You are an assistant for a Smart To-Do app.
        Return ONLY a compact JSON matching this TypeScript type:
        {
            "actions": (
            | { "type": "LIST_PENDING" }
            | { "type": "CREATE_TASKS", "tasks": string[] }
            | { "type": "COMPLETE_TASKS", "ids": number[] }
            | { "type": "UNCOMPLETE_TASKS", "ids": number[] }
            | { "type": "DELETE_TASKS", "ids": number[] }
            )[];
            "message"?: string;
        }
        Rules:
        - Keep JSON minimal, no text outside it.
        - IDs are integers corresponding to tasks.`;


        const user = `Current tasks (id, title, isCompleted):\n${tasks
            .map((t) => `- ${t.id}\t${t.title}\t${t.isCompleted}`)
            .join('\n')}\n\nUser request: ${dto.prompt}`;


        const rawText = await this.callProvider(provider, key, dto.model, system, user);
        const parsed = this.safeParseAiJson(rawText);

        // Executa ações
        const executed: { action: string; result: any }[] = [];
        let humanMessage: string | undefined = parsed?.message;

        if (parsed?.actions?.length) {
            humanMessage = '';
            for (const action of parsed.actions) {
                if (action.type === 'LIST_PENDING') {
                    const pending = await this.tasksService.findPending();
                    executed.push({ action: 'LIST_PENDING', result: pending });
                    humanMessage +=
                        pending.length === 0
                            ? ' Você não tem nenhuma tarefa pendente 🎉'
                            : ` Você tem ${pending.length} tarefa(s) pendente(s).`;
                }
                if (action.type === 'CREATE_TASKS') {
                    const titles = Array.isArray(action.tasks) ? action.tasks : [];
                    const created = await this.tasksService.createMany(titles);
                    executed.push({ action: 'CREATE_TASKS', result: created });
                    humanMessage += ` Criei ${created.length} nova(s) tarefa(s) para você.`;
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
                    humanMessage += ` Marquei ${completed.length} tarefa(s) como concluída(s).`;
                }
                if (action.type === 'UNCOMPLETE_TASKS') {
                    const ids = Array.isArray(action.ids) ? action.ids : [];
                    const uncompleted: any[] = [];
                    for (const id of ids) {
                        try {
                            const t = await this.tasksService.markAsUncompleted(Number(id));
                            uncompleted.push(t);
                        } catch {
                            uncompleted.push({ id, error: 'Task not found' });
                        }
                    }
                    executed.push({ action: 'UNCOMPLETE_TASKS', result: uncompleted });
                    humanMessage += ` ${uncompleted.length} tarefa(s) marcadas como não concluída(s).`;
                }
                if (action.type === 'DELETE_TASKS') {
                    const ids = Array.isArray(action.ids) ? action.ids : [];
                    const deleted: any[] = [];
                    for (const id of ids) {
                        try {
                            await this.tasksService.remove(Number(id));
                            deleted.push({ id, status: 'deleted' });
                        } catch {
                            deleted.push({ id, error: 'Task not found' });
                        }
                    }
                    executed.push({ action: 'DELETE_TASKS', result: deleted });
                    humanMessage += ` Excluí ${deleted.length} tarefa(s).`;
                }
            }

        }


        const updated = await this.tasksService.findAll();

        return {
            message: humanMessage ? `${humanMessage}` : 'Ok!',
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
        const m = model || 'meta-llama/llama-4-maverick:free';
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

        if (data?.error) {
            const code = data.error.code;
            const message = data.error.message || 'Erro desconhecido no provider';

            // Se for RATE LIMIT
            if (code === 429) {
                const resetTimestamp = data?.error?.metadata?.headers?.['X-RateLimit-Reset'];
                let resetInfo = '';
                if (resetTimestamp) {
                    const resetDate = new Date(Number(resetTimestamp));
                    resetInfo = ` Seu limite será resetado em: ${resetDate.toLocaleString()}.`;
                }

                throw new HttpException(
                    `⚠️ Limite de uso diário atingido: ${message}.${resetInfo}`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            // Outros erros genéricos
            throw new HttpException(
                `⚠️ Erro do provider: ${message}`,
                HttpStatus.BAD_GATEWAY,
            );
        }

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