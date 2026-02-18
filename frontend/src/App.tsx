import { useEffect, useState } from "react";
import type { Task } from "./types";
import { RandomUseStade, PersonInfo, initialPeople } from "./PersonalInfo.tsx";
import { Formularz } from "./Form.tsx";

function App() {
  const [people, setPeople] = useState(initialPeople);
  const handleAddPerson = ({
    name,
    tel,
    city,
  }: {
    name: string;
    tel: string;
    city: string;
  }) =>
    setPeople((prev) => [...prev, { firstName: name, tel: tel, city: city }]);

  const handleDelete = (telToRemove: string): void => {
    setPeople((prev) => prev.filter((p) => p.tel !== telToRemove));
  };
  const handleEdit = (telToEdit: string, newName: string, newCity: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.tel === telToEdit ? { ...p, firstName: newName, city: newCity } : p,
      ),
    );
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState({
    class_level: "all",
    topic: "all",
    difficulty: "all",
    date_created: "all",
    task_type: "all",
    scope: "all",
    points: "all",
    source: "all",
  });
  const [serverUrl, setServerUrl] = useState("http://127.0.0.1:8000/tasks/");

  // Pobieranie danych z API
  useEffect(() => {
    fetch(serverUrl)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Błąd połączenia z API:", err));
  }, []);

  return (
    <>
      <Formularz onAddPerson={handleAddPerson} />
      <div>
        <RandomUseStade />
      </div>
      <div className="w-full p-4 bg-white shadow-md mb-6">
        <PersonInfo
          people={people}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
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
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: rewriteImageUrls(task.content_html),
                  }}
                />
                <div className="flex justify-between text-xs font-bold text-blue-600 mb-2">
                  <span>Klasa {task.class_level}</span>
                  <span>{task.difficulty}</span>
                </div>
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
    </>
  );
}

// FUNKCJA NAPRAWIAJĄCA OBRAZKI
function rewriteImageUrls(html: string) {
  // Zamieniamy image://2647.svg na http://127.0.0.1:8000/images/2647.svg
  return html.replace(/image:\/\//g, "http://127.0.0.1:8000/images/");
}

export default App;
