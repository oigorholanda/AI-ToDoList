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
         if (!res.ok) throw new Error('Erro na requisição')
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
            Use prompts como: <br />
            <i>"Crie uma lista de tarefas para organizar uma festa de aniversário"</i>
            <br />
            <i>"Marque 'comprar o bolo' como concluida"</i>
            <br />
            <i>"Exclua as tarefas não relacionadas ao aniversário"</i>
            <br />
         </p>

         <textarea
            placeholder="Descreva suas tarefas aqui..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border p-2 my-3 rounded"
         />

         <input
            type="text"
            placeholder="API Key OpenRouter (opcional se cadastrada no .env)"
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
               {/* <option value="openai/gpt-oss-20b:free">GPT-oss (20B)</option> */}
               <option value="google/gemini-2.0-flash-exp:free">Gemini-2.0-Flash</option>
            </select>
         </div>

         <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
         >
            {mutation.isPending ? 'Gerando...' : 'Enviar para a T.IA'}
         </button>

         {mutation.isError && <p className="text-red-600 mt-3">Erro: {(mutation.error as Error).message}</p>}

         {result && (
            <div className="mt-6 bg-gray-50 p-4 rounded-xl">
               <h3 className="font-semibold">Resultado:</h3>
               <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result.message, null, 2)}</pre>
            </div>
         )}
      </div>
   )
}
