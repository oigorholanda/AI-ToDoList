# AI-ToDoList


Aplicação de listas de tarefas inteligente a *AI To-Do List* vai além do tradicional e conta com um módulo de **IA** capaz de:


- Listar tarefas pendentes via linguagem natural
- Criar subtarefas acionáveis a partir de um objetivo
- Concluir tarefas específicas pelo ID


## Tecnologias Utilizadas
- **Backend:** NestJS, TypeScript, TypeORM, SQLite
- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, React Query


## Rodando localmente
```bash
# 1) Backend
cd backend
cp .env.example .env # (opcional) adicione OPENROUTER_API_KEY ou HF_API_KEY
npm install
npm run start:dev


# 2) Frontend
cd ../frontend
npm install
npm run dev
```


- Backend: http://localhost:3000
- Frontend: http://localhost:3001 (ou 3000)


## Endpoint de IA
`POST /ai/prompt`
```json
{
"prompt": "planejar uma viagem e concluir tarefa 2",
"provider": "openrouter",
"apiKey": "OPCIONAL_SEM_ENV",
"model": "openrouter/auto"
}
```
Retorna JSON com ações executadas e lista atualizada de tarefas.


## Observações
- O banco é um arquivo `backend/database.sqlite`.
- Em dev, `synchronize: true` atualiza tabelas automaticamente.
- Para produção, use migrações.