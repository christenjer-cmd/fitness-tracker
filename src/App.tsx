import { NavLink, Route, Routes } from 'react-router-dom';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import RunPage from './pages/RunPage';

const tabs = [
  { to: '/', label: 'Séance', icon: '🏋️' },
  { to: '/course', label: 'Course', icon: '🏃' },
  { to: '/historique', label: 'Historique', icon: '📅' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="px-4 py-3 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <h1 className="text-lg font-bold text-accent">Fitness Tracker</h1>
      </header>

      <main className="flex-1 px-3 py-3 max-w-md mx-auto w-full">
        <Routes>
          <Route path="/" element={<WorkoutPage />} />
          <Route path="/course" element={<RunPage />} />
          <Route path="/historique" element={<HistoryPage />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-4 py-1 rounded-lg ${
                isActive ? 'text-accent font-semibold' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
