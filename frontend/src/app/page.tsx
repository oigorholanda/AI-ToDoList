import Link from "next/link";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";


export default function Home() {
  return (
    <main className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">AI To-Do List - by <Link href={"https://github.com/oigorholanda"} target="blank_">Oigorholanda</Link></h1>
      <TaskForm />
      <TaskList />
    </main>
  );
}
