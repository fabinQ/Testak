import { AppShell } from "./components/AppShell";
import { TaskBankPage } from "./pages/TaskBankPage";

// Na razie jeden ekran (Baza zadań). Trasy z DESIGN.md 5 dojdą razem z kolejnymi ekranami.
function App() {
  return (
    <AppShell>
      <TaskBankPage />
    </AppShell>
  );
}

export default App;
