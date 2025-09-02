# AI-ToDoList


Aplicação de listas de tarefas inteligente a *AI To-Do List* vai além do tradicional e conta com um módulo de **IA** capaz de:


- Criar tarefas acionáveis via linguagem natural
- Concluir tarefas específicas pelo ID
- Excluir tarefas pedidas via prompt
- Listar a quantidade de tarefas em um determinado estado


## Tecnologias Utilizadas
- **Backend:** NestJS, TypeScript, TypeORM, SQLite
- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, React Query


## Rodando localmente
```bash
# 1) Backend
cd backend
cp .env.example .env # (opcional) adicione OPENROUTER_API_KEY aqui
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
"prompt": "planejar uma viagem para maceió e concluir as tarefas sobre pesquisa de roteiro de férias",
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