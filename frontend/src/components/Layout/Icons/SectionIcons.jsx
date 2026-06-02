export const IconUsers = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="1.8"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeOpacity="0.5"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85" stroke={color} strokeWidth="1.8" strokeOpacity="0.5"/>
  </svg>
);

export const IconLayers = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <polyline points="2 12 12 17 22 12" stroke={color} strokeWidth="1.8" strokeOpacity="0.7"/>
    <polyline points="2 17 12 22 22 17" stroke={color} strokeWidth="1.8" strokeOpacity="0.4"/>
  </svg>
);

export const IconBars = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2"  y="10" width="5" height="11" rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15"/>
    <rect x="9"  y="4"  width="5" height="17" rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.25"/>
    <rect x="16" y="13" width="5" height="8"  rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.1"/>
  </svg>
);

export const IconOpenBook = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12"/>
  </svg>
);
