'use client'

import TaskForm from './tasks/TaskForm'
import TaskList from './tasks/TaskList'
import AiPromptForm from './ai/AiPromptForm'
import Link from 'next/link'

export default function HomePage() {
   return (
      <main className="mt-5 p-10">
         <div className="fixed mb-10 flex flex-col top-0 left-0 right-0 bg-blue-500 z-10 p-4 border-b border-gray-300">
            <h1 className="text-2xl font-bold text-center">
               IA To-Do List - by{' '}
               <Link href={'https://github.com/oigorholanda'} target="blank_">
                  Igor Holanda
               </Link>
            </h1>
         </div>
         <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white shadow-md rounded-xl p-6">
               <h2 className="text-xl font-semibold mb-4">Gerenciar Tarefas</h2>
               <TaskForm />
               <TaskList />
            </div>

            <div className="bg-white shadow-md rounded-xl p-6">
               <h2 className="text-xl font-semibold mb-4">Gerar Tarefas com IA</h2>
               <AiPromptForm />
            </div>
         </div>
      </main>
   )
}
