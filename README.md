# AI-ToDoList


Aplicação de listas de tarefas inteligente.  
A *AI To-Do List* vai além do tradicional CRUD e conta com um módulo de **IA** capaz de:

- Criar tarefas acionáveis via linguagem natural
- Concluir tarefas específicas a pedido do usuário
- Alternar tarefas como **concluidas** ou **não concluídas**
- Excluir tarefas diretamente via prompt
- Informar a quantidade de tarefas em determinado estado (ex.: pendentes)

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/c1bbdc9d-f038-4300-85c9-27e29df7301a" />



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

Exemplo de requisição
```json
{
"prompt": "Lista de itens para uma viagem para maceió e conclua as tarefas sobre pesquisa de roteiro de férias",
"provider": "openrouter",
"apiKey": "OPCIONAL_SEM_ENV",
"model": "openrouter/auto"
}
```

Exemplo de resposta
```json
{
  "message": "Criei 6 nova(s) tarefa(s) para você. Marquei 2 tarefa(s) como concluída(s). ",
  "executed": [...],
  "tasks": [...],
  "raw": "{...resposta original do provider...}"
}
```

## Observações
- O banco é um arquivo `backend/database.sqlite`.
- Em dev, `synchronize: true` atualiza tabelas automaticamente.
- Para produção, use migrações (typeorm migration:generate / run).
- Se atingir o limite de requisições do OpenRouter, a IA retorna uma mensagem amigável com a data/hora de reset.
