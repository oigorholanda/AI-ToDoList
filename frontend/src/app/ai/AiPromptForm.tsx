'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function AiPromptForm() {
   const queryClient = useQueryClient()
   const [prompt, setPrompt] = useState('')
   const [apiKey, setApiKey] = useState('')
   const [model, setModel] = useState('meta-llama/llama-4-maverick:free')
   const [result, setResult] = useState<any>(null)

   const mutation = useMutation({
      mutationFn: async () => {
         if (!prompt.trim()) {
            alert('Digite um prompt antes de enviar!')
            return
         }

         const res = await fetch('http://localhost:3000/ai/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               prompt,
               provider: 'openrouter',
               apiKey: apiKey || undefined,
               model: model || undefined,
            }),
         })

         if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.message || 'Erro desconhecido')
         }

         return res.json()
      },
      onSuccess: (data) => {
         setResult(data)
         setPrompt('')
         queryClient.invalidateQueries({ queryKey: ['tasks'] }) // refetch tasks
      },
   })

   return (
      <div className="bg-white rounded-2xl shadow">
         <p className="text-sm text-gray-500 mb-3">
            Exemplos de uso:
            <br />
            <i>"Crie uma lista de tarefas para organizar uma festa"</i>
            <br />
            <i>"Marque as 10 primeiras como concluída"</i>
            <br />
            <i>"Reabra a tarefa 'estudar RAG'"</i>
            <br />
            <i>"Exclua a tarefa 'levar o lixo para fora'"</i>
            <br />
            <i>"Quantas tarefas eu tenho ainda não concluídas?"</i>
         </p>

         <textarea
            placeholder="Converse com a T.IA sobre suas tarefas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border p-2 my-3 rounded"
         />

         <input
            type="text"
            placeholder="API Key OpenRouter (opcional quando cadastrada no .env)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
         />

         <div>
            <label className="block text-sm font-medium">Modelo</label>
            <select
               value={model}
               onChange={(e) => setModel(e.target.value)}
               className="w-full p-2 border rounded-md mb-6"
            >
               <option value="meta-llama/llama-4-maverick:free">LLaMa-4-Maverick</option>
               <option value="moonshotai/kimi-k2:free">Kimi-K2</option>
               <option value="qwen/qwen3-4b:free">Qwen3 (4B)</option>
               <option value="openai/gpt-oss-20b:free">gpt-oss-20b</option>
               <option value="google/gemini-2.0-flash-exp:free">Gemini-2.0-Flash</option>
            </select>
         </div>

         <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
         >
            {mutation.isPending ? 'Processando...' : 'Perguntar'}
         </button>

         {mutation.isError && <p className="text-red-600 mt-3">Erro: {(mutation.error as Error).message}</p>}

         {result && (
            <div className="mt-6 bg-gray-50 p-4 rounded-xl space-y-3">
               {result.message && (
                  <p className="text-gray-800">
                     <strong>T.IA das tarefas:</strong> "{result.message}"
                  </p>
               )}
            </div>
         )}
      </div>
   )
}
