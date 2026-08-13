import { NavLink, Route, Routes } from 'react-router-dom';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import RunPage from './pages/RunPage';
import { CalendarIcon, DumbbellIcon, RunIcon } from './components/icons';

const tabs = [
  { to: '/', label: 'Séance', Icon: DumbbellIcon },
  { to: '/course', label: 'Course', Icon: RunIcon },
  { to: '/historique', label: 'Historique', Icon: CalendarIcon },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 grid place-items-center">
            <DumbbellIcon className="w-[18px] h-[18px] text-accent" />
          </span>
          <h1 className="text-base font-bold tracking-tight">
            Fitness<span className="text-accent">Tracker</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-28">
        <Routes>
          <Route path="/" element={<WorkoutPage />} />
          <Route path="/course" element={<RunPage />} />
          <Route path="/historique" element={<HistoryPage />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-line bg-ink/90 backdrop-blur-xl shadow-nav pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto flex justify-around px-2 py-1.5">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition ${
                  isActive ? 'text-accent' : 'text-slate-500 active:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-accent/10 animate-scale-in" />
                  )}
                  <Icon className="w-6 h-6 relative" />
                  <span className={`text-[10px] relative ${isActive ? 'font-semibold' : ''}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
