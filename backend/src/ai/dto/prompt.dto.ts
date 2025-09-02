export type AiProvider = 'openrouter';

export class PromptDto {
  prompt: string;
  apiKey?: string;
  provider?: AiProvider; // default: 'openrouter'
  model?: string; // opcional para escolher o modelo
}

export type AiAction =
  | { type: 'LIST_PENDING' }
  | { type: 'CREATE_TASKS'; tasks: string[] }
  | { type: 'COMPLETE_TASKS'; ids: number[] }
  | { type: 'UNCOMPLETE_TASKS'; ids: number[] }
  | { type: 'DELETE_TASKS'; ids: number[] };

export interface AiResponseShape {
  actions: AiAction[];
  message?: string;
}
