// Décor de fond : deux halos colorés qui dérivent lentement derrière l'interface.
// Rendu une seule fois dans App, en position fixe, sans interaction possible.
export default function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute -top-40 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-[0.22] animate-aurora"
        style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 68%)' }}
      />
      <div
        className="absolute -top-24 -right-32 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-[0.16] animate-aurora-slow"
        style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 68%)' }}
      />
      <div
        className="absolute bottom-[-14rem] left-1/2 -translate-x-1/2 w-[30rem] h-[22rem] rounded-full blur-3xl opacity-[0.10] animate-aurora-slow"
        style={{ background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)' }}
      />
      {/* Voile sombre en bas pour que la barre de navigation reste lisible. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
