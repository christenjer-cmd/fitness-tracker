// Illustrations des écrans vides. Dessinées en SVG plutôt qu'en images :
// elles restent nettes à toute taille, pèsent quelques lignes et se colorent
// avec le thème. Chaque dégradé porte un identifiant unique pour éviter les
// collisions quand plusieurs illustrations coexistent.

interface Props {
  className?: string;
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {/* userSpaceOnUse est indispensable : un trait horizontal ou vertical a une
          boîte englobante plate, et un dégradé calculé sur cette boîte dégénère,
          ce qui fait disparaître le trait. */}
      <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="180" y2="120">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="55%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
      <radialGradient id={`${id}-halo`} gradientUnits="userSpaceOnUse" cx="100" cy="70" r="62">
        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Anneaux d'énergie autour d'une barre chargée. Écran « pas de séance ». */
export function LiftIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" aria-hidden="true">
      <Defs id="lift" />
      <circle cx="100" cy="70" r="62" fill="url(#lift-halo)" />

      <circle
        cx="100"
        cy="70"
        r="52"
        stroke="url(#lift-stroke)"
        strokeWidth="1"
        strokeOpacity="0.35"
        strokeDasharray="4 7"
      />
      <circle
        cx="100"
        cy="70"
        r="40"
        stroke="url(#lift-stroke)"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        strokeDasharray="150 210"
        strokeLinecap="round"
      />

      {/* Barre et disques, en rectangles pleins : un trait horizontal a une boîte
          englobante plate, source d'ennuis au moindre remaniement du dégradé. */}
      <g fill="url(#lift-stroke)">
        <rect x="66" y="67.5" width="68" height="5" rx="2.5" />
        <rect x="69" y="52" width="7" height="36" rx="3.5" />
        <rect x="124" y="52" width="7" height="36" rx="3.5" />
        <rect x="57" y="60" width="5.5" height="20" rx="2.75" />
        <rect x="137.5" y="60" width="5.5" height="20" rx="2.75" />
      </g>

      {/* Éclats de vitesse */}
      <g stroke="#22D3EE" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round">
        <path d="M26 42h16M18 56h10M30 98h14" />
      </g>
    </svg>
  );
}

/** Foulée sur un tracé, avec relief en arrière-plan. Écran « aucune course ». */
export function RunIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" aria-hidden="true">
      <Defs id="run" />
      <circle cx="100" cy="72" r="60" fill="url(#run-halo)" />

      {/* Relief */}
      <path
        d="M20 104l30-34 20 22 26-40 30 34 24-18 30 36"
        stroke="url(#run-stroke)"
        strokeWidth="1.5"
        strokeOpacity="0.35"
        strokeLinejoin="round"
      />

      {/* Tracé du parcours */}
      <path
        d="M34 112c26 6 34-16 56-16s26 22 50 14 26-26 26-26"
        stroke="url(#run-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="7 8"
      />

      {/* Départ et arrivée */}
      <circle cx="34" cy="112" r="5" stroke="url(#run-stroke)" strokeWidth="2.5" />
      <circle cx="166" cy="84" r="5" fill="#22D3EE" fillOpacity="0.85" />

      <g stroke="#22D3EE" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round">
        <path d="M150 40h18M158 30h14" />
      </g>
    </svg>
  );
}

/** Courbe ascendante sur une grille. Écran « aucune séance terminée ». */
export function ProgressIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" aria-hidden="true">
      <Defs id="prog" />
      <circle cx="110" cy="70" r="58" fill="url(#prog-halo)" />

      {/* Grille */}
      <g stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1">
        <path d="M30 30v84M70 30v84M110 30v84M150 30v84" />
        <path d="M30 42h140M30 70h140M30 98h140" />
      </g>

      {/* Colonnes */}
      <g fill="url(#prog-stroke)" fillOpacity="0.22">
        <rect x="42" y="84" width="18" height="30" rx="4" />
        <rect x="82" y="68" width="18" height="46" rx="4" />
        <rect x="122" y="52" width="18" height="62" rx="4" />
      </g>

      {/* Tendance */}
      <path
        d="M40 96l38-18 40-14 44-22"
        stroke="url(#prog-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="162" cy="42" r="4.5" fill="#22D3EE" />
    </svg>
  );
}
