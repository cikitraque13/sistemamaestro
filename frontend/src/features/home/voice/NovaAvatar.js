import React from 'react';

// Avatar híbrido de Nova: orbe brillante con los colores de la portada girando
// dentro (la cabeza), ojos ovalados, sonrisa y unos cascos con micrófono.
// SVG en línea + CSS (novaDemo.css): sin imágenes rasterizadas. El estado
// visual lo da `data-phase` del contenedor `.nova-demo` y el volumen real de
// la llamada llega por la variable CSS `--nova-level`.
const NovaAvatar = ({ rippleClass = '' }) => (
  <div className="nova-avatar" aria-hidden="true">
    <div className="nova-avatar__body">
      <span className="nova-avatar__halo" />
      <span className={`nova-avatar__ripple ${rippleClass}`} />
      <span className={`nova-avatar__ripple ${rippleClass}`} style={{ animationDelay: '1.2s' }} />

      <svg viewBox="0 0 140 140" className="nova-avatar__svg" role="presentation" focusable="false">
        <defs>
          <clipPath id="nova-h-orb-clip">
            <circle cx="70" cy="70" r="48" />
          </clipPath>
          <radialGradient id="nova-h-orb-base" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="45%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </radialGradient>
          <radialGradient id="nova-h-gloss" cx="35%" cy="25%" r="45%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nova-h-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#A78BFA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="nova-h-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nova-h-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="nova-h-cup" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3730A3" />
            <stop offset="100%" stopColor="#111033" />
          </linearGradient>
          <filter id="nova-h-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Cabeza: orbe con remolino de color */}
        <g className="nova-avatar__head">
          <circle cx="70" cy="70" r="48" fill="url(#nova-h-orb-base)" />
          <g clipPath="url(#nova-h-orb-clip)">
            <g className="nova-avatar__swirl" filter="url(#nova-h-blur)">
              <ellipse cx="48" cy="56" rx="26" ry="14" fill="#38BDF8" opacity="0.75" />
              <ellipse cx="92" cy="60" rx="22" ry="12" fill="#EC4899" opacity="0.6" />
              <ellipse cx="78" cy="98" rx="28" ry="12" fill="#FBBF24" opacity="0.7" />
              <ellipse cx="54" cy="96" rx="16" ry="10" fill="#F97316" opacity="0.45" />
            </g>
            <g className="nova-avatar__swirl nova-avatar__swirl--counter" filter="url(#nova-h-blur)">
              <ellipse cx="70" cy="36" rx="24" ry="10" fill="#A78BFA" opacity="0.8" />
              <ellipse cx="100" cy="86" rx="14" ry="18" fill="#22D3EE" opacity="0.45" />
              <ellipse cx="38" cy="80" rx="12" ry="18" fill="#C084FC" opacity="0.55" />
            </g>
            <g className="nova-avatar__sparkles" fill="#FFFFFF">
              <circle cx="88" cy="44" r="1.1" opacity="0.9" />
              <circle cx="46" cy="40" r="0.8" opacity="0.7" />
              <circle cx="98" cy="74" r="0.9" opacity="0.8" />
              <circle cx="58" cy="104" r="0.8" opacity="0.6" />
              <circle cx="36" cy="66" r="0.7" opacity="0.6" />
            </g>
            <rect className="nova-avatar__shimmer" x="-40" y="10" width="40" height="120" fill="url(#nova-h-shimmer)" />
          </g>
          <circle cx="70" cy="70" r="48" fill="url(#nova-h-gloss)" />
          <circle cx="70" cy="70" r="47.2" fill="none" stroke="url(#nova-h-rim)" strokeWidth="1.6" />
          <ellipse cx="54" cy="44" rx="12" ry="6" fill="#FFFFFF" opacity="0.35" transform="rotate(-28 54 44)" />

          {/* Cara */}
          <g className="nova-avatar__face">
            <g className="nova-avatar__eyes">
              <g className="nova-avatar__eye">
                <ellipse cx="56" cy="68" rx="5.4" ry="7.8" fill="#0F0A2A" />
                <circle cx="57.8" cy="65" r="1.8" fill="#FFFFFF" />
              </g>
              <g className="nova-avatar__wink">
                <g className="nova-avatar__eye">
                  <ellipse cx="84" cy="68" rx="5.4" ry="7.8" fill="#0F0A2A" />
                  <circle cx="85.8" cy="65" r="1.8" fill="#FFFFFF" />
                </g>
              </g>
            </g>
            <ellipse cx="47" cy="80" rx="5" ry="2.6" fill="#F472B6" opacity="0.45" />
            <ellipse cx="93" cy="80" rx="5" ry="2.6" fill="#F472B6" opacity="0.45" />
            <path className="nova-avatar__smile" d="M62 82 Q70 89 78 82" fill="none" stroke="#0F0A2A" strokeWidth="2.8" strokeLinecap="round" />
            <ellipse className="nova-avatar__mouth" cx="70" cy="85" rx="6" ry="4.6" fill="#0F0A2A" />
          </g>
        </g>

        {/* Cascos con micrófono */}
        <g className="nova-avatar__headset">
          <path d="M36 44 Q62 4 112 46" fill="none" stroke="url(#nova-h-band)" strokeWidth="7" strokeLinecap="round" />
          <path d="M40 40 Q63 9 108 44" fill="none" stroke="#818CF8" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="108" y="52" width="18" height="32" rx="9" fill="url(#nova-h-cup)" stroke="#6366F1" strokeOpacity="0.7" strokeWidth="1.2" />
          <rect x="113" y="58" width="8" height="20" rx="4" fill="#4F46E5" opacity="0.55" />
          <path d="M116 82 Q114 110 90 113" fill="none" stroke="#1E1B4B" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M116 82 Q114 110 90 113" fill="none" stroke="#818CF8" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
          <rect x="80" y="108.5" width="13" height="9" rx="4.5" fill="#1E1B4B" stroke="#6366F1" strokeOpacity="0.8" strokeWidth="1" />
          <circle className="nova-avatar__mic-led" cx="84.5" cy="113" r="2.2" />
        </g>
      </svg>
    </div>
  </div>
);

export default NovaAvatar;
