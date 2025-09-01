"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

type Task = {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: string;
};

export default function TaskList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.get<Task[]>("/tasks");
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task: Task) =>
      api.patch(`/tasks/${task.id}`, { isCompleted: !task.isCompleted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  if (isLoading) return <p>Carregando tarefas...</p>;

  return (
    <ul className="space-y-2">
      {data?.map((task) => (
        <li
          key={task.id}
          className="flex justify-between items-center border p-2 rounded"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={() => toggleMutation.mutate(task)}
            />
            <span className={task.isCompleted ? "line-through" : ""}>
              {task.title}
            </span>
          </div>
          <button
            onClick={() => deleteMutation.mutate(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            Excluir
          </button>
        </li>
      ))}
    </ul>
  );
}
