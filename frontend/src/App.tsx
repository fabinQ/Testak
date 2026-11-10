import { useEffect, useState } from "react";
import type { Task } from "./types";
import { Path } from "./types";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  //Klucze do fitrowania
  // Settery dojdą razem z UI filtrów w Fazie 1 (noUnusedLocals)
  const [classLevel] = useState<string>("");
  const [difficulty] = useState<string>("");
  const [taskType] = useState<string>("");
  const [scope] = useState<string>("");
  const [topic] = useState<string>("");

  // Pobieranie zadań z API z aktualnymi filtrami
  useEffect(() => {
    const params = new URLSearchParams();

    if (classLevel) params.append("class_level", classLevel);
    if (difficulty) params.append("difficulty", difficulty);
    if (taskType) params.append("task_type", taskType);
    if (scope) params.append("scope", scope);
    if (topic) params.append("topic", topic);

    fetch(`${Path.task}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setTasks(data.items))
      .catch((err) => console.error("Błąd połączenia z API:", err));
  }, [classLevel, difficulty, taskType, scope, topic]);

  return (
    <div className="min-h-screen bg-gray-100 flex p-6 gap-6">
      {/* LEWA STRONA: LISTA ZADAŃ */}
      <div className="w-1/3 bg-white shadow-lg rounded-xl p-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-slate-800">
          Bank Zadań
        </h2>
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
            >
              <div className="flex justify-between text-xs font-bold text-blue-600 mb-2">
                <span>{task.topic || "Ogólne"}</span>
                <span>{task.points} pkt</span>
              </div>
              {/* Tutaj wyświetlimy treść HTML */}
              <div
                className="task-content"
                dangerouslySetInnerHTML={{
                  __html: rewriteImageUrls(task.content_html),
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* PRAWA STRONA: PODGLĄD ARKUSZA */}
      <div className="flex-1 bg-white shadow-2xl rounded-sm p-12 min-h-[29.7cm] w-[21cm] mx-auto overflow-hidden">
        <h1 className="text-center text-2xl font-serif border-b-2 border-black pb-4 mb-8">
          SPRAWDZIAN Z MATEMATYKI
        </h1>
        <p className="text-gray-400 text-center italic">
          Przeciągnij zadania tutaj (funkcja wkrótce)...
        </p>
      </div>
    </div>
  );
}

// FUNKCJA NAPRAWIAJĄCA OBRAZKI
function rewriteImageUrls(html: string) {
  // Zamieniamy image://2647.svg na <VITE_API_URL>/images/2647.svg
  return html.replace(/image:\/\//g, Path.images);
}

export default App;
