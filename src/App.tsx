import { NavLink, Route, Routes } from 'react-router-dom';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import RunPage from './pages/RunPage';
import Backdrop from './components/Backdrop';
import GarminAutoSync from './components/GarminAutoSync';
import { CalendarIcon, DumbbellIcon, RunIcon } from './components/icons';

const tabs = [
  { to: '/', label: 'Séance', Icon: DumbbellIcon },
  { to: '/course', label: 'Course', Icon: RunIcon },
  { to: '/historique', label: 'Historique', Icon: CalendarIcon },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Backdrop />

      <header className="sticky top-0 z-20 bg-ink/60 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-2.5">
          <span className="relative w-8 h-8 rounded-xl grid place-items-center border border-white/10 bg-white/[0.04]">
            <DumbbellIcon className="w-[18px] h-[18px] text-accent" />
            <span className="absolute inset-0 rounded-xl bg-accent/10 blur-md -z-10" />
          </span>
          <h1 className="text-base font-bold tracking-tight">
            Fitness<span className="text-gradient">Tracker</span>
          </h1>
        </div>
        {/* Filet lumineux en bas d'en-tête, plus fin qu'une bordure pleine. */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-5 pb-32">
        <GarminAutoSync />
        <Routes>
          <Route path="/" element={<WorkoutPage />} />
          <Route path="/course" element={<RunPage />} />
          <Route path="/historique" element={<HistoryPage />} />
        </Routes>
      </main>

      {/* Barre flottante, détachée du bord : plus aérien qu'un bandeau collé. */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="max-w-md mx-auto flex justify-around gap-1 rounded-2xl border border-white/[0.08] bg-ink/80 backdrop-blur-xl p-1.5 shadow-nav pointer-events-auto">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${
                  isActive ? 'text-accent' : 'text-slate-500 active:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-accent/[0.08] border border-accent/20 animate-scale-in" />
                      {/* Trait lumineux au sommet de l'onglet actif. */}
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                    </>
                  )}
                  <Icon className="w-[22px] h-[22px] relative" />
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
