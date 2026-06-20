import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import "./PodridaJugadoresStyles.css";
import PodridaMenu from "../PodridaMenu";
import fetchAllPodridaPlayers from "../../../reactquery/podrida/fetchAllPodridaPlayers";
import fetchPodridaPlayerProfile from "../../../reactquery/podrida/fetchPodridaPlayerProfile";

/* ── helpers ── */
const getInitial = (name) => name?.[0]?.toUpperCase() ?? "?";

const fmtDays = (days) => {
  if (days === null || days === undefined) return null;
  if (days === 0) return "hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
};

const MONTH_ABBR = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const fmtPeriod = (s) => {
  if (!s.startDate) return null;
  const start = new Date(s.startDate);
  const startMonth = MONTH_ABBR[start.getMonth()];
  const startYear = start.getFullYear();

  if (s.active) return `desde ${startMonth} ${startYear}`;
  if (!s.endDate) return `${startMonth} ${startYear}`;

  const end = new Date(s.endDate);
  const endMonth = MONTH_ABBR[end.getMonth()];
  const endYear = end.getFullYear();

  if (startYear === endYear && startMonth === endMonth) return `${startMonth} ${startYear}`;
  if (startYear === endYear) return `${startMonth}–${endMonth} ${startYear}`;
  return `${startMonth} ${startYear}–${endMonth} ${endYear}`;
};

/* ── StreakCard ── */
const StreakCard = ({ title, data, negative }) => {
  const { active, top3 } = data;

  return (
    <div className={`pj-streak-card ${negative ? "pj-streak-card--neg" : "pj-streak-card--pos"}`}>
      <p className="pj-streak-title">{title}</p>

      {active ? (
        <div className="pj-streak-active">
          <span className="pj-streak-active-badge" title="Racha vigente">🔥 Vigente</span>
          <span className={`pj-streak-active-value ${negative ? "pj-streak-active-value--neg" : ""}`}>
            {active.value}
          </span>
          <span className="pj-streak-active-meta">
            {fmtPeriod(active)}{active.days !== null && ` · ${fmtDays(active.days)}`}
          </span>
        </div>
      ) : (
        <p className="pj-streak-none">Sin racha vigente</p>
      )}

      <div className="pj-streak-top3">
        <p className="pj-streak-top3-label">Top histórico</p>
        {top3.length === 0 && <p className="pj-streak-none">Sin datos suficientes</p>}
        {top3.map((s, idx) => (
          <div key={idx} className={`pj-streak-row${s.active ? " pj-streak-row--active" : ""}`}>
            <span className="pj-streak-row-pos">{idx + 1}°</span>
            <span className="pj-streak-row-period-group">
              {fmtPeriod(s) && <span className="pj-streak-row-period">{fmtPeriod(s)}</span>}
              {s.days !== null && (
                <span className="pj-streak-row-days">{fmtDays(s.days)}</span>
              )}
            </span>
            {s.active && <span className="pj-streak-row-fire" title="Racha vigente">🔥</span>}
            <span className={`pj-streak-row-value ${negative ? "pj-streak-row-value--neg" : ""}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const PodridaJugadores = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: playersData, isLoading: loadingPlayers } = useQuery({
    queryKey: ["podridaPlayers"],
    queryFn: fetchAllPodridaPlayers,
    staleTime: 5 * 60 * 1000,
  });

  const { data: profileData, isLoading: loadingProfile, isError } = useQuery({
    queryKey: ["podridaPlayerProfile", selectedId],
    queryFn: () => fetchPodridaPlayerProfile(selectedId),
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  const players = playersData ?? [];
  const selected = players.find((p) => p._id === selectedId) ?? null;

  const player = profileData?.player ?? null;
  const profile = profileData?.profile ?? null;
  const rank = profileData?.rank ?? null;
  const totalPlayers = profileData?.totalPlayers ?? null;
  const droughts = profileData?.droughts ?? null;
  const byYear = profileData?.byYear ?? [];

  const maxPoints = byYear.length ? Math.max(1, ...byYear.map((y) => y.points)) : 1;

  return (
    <>
      <PodridaMenu />
      <div className="pj-root">

        <div className="pj-header">
          <div className="pj-eyebrow">
            <span className="pj-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pj-title">Jugadores</h1>
        </div>

        {/* ── Dropdown selector ── */}
        <div className="pj-dd" ref={ddRef}>
          <button
            type="button"
            className={`pj-dd-trigger${dropdownOpen ? " pj-dd-trigger--open" : ""}`}
            onClick={() => setDropdownOpen((o) => !o)}
            disabled={loadingPlayers}
          >
            <div className="pj-dd-trigger-inner">
              <div className="pj-dd-label">Jugador</div>
              <div className="pj-dd-value">
                {loadingPlayers ? "Cargando…" : selected ? selected.name : "Seleccioná un jugador"}
              </div>
            </div>
            <svg className={`pj-dd-chevron${dropdownOpen ? " pj-dd-chevron--open" : ""}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <ul className="pj-dd-list" role="listbox">
              {players.map((p) => (
                <li
                  key={p._id}
                  role="option"
                  aria-selected={selectedId === p._id}
                  className={`pj-dd-item${selectedId === p._id ? " pj-dd-item--active" : ""}`}
                  onClick={() => { setSelectedId(p._id); setDropdownOpen(false); }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!selectedId && <p className="pj-empty">Seleccioná un jugador para ver su perfil.</p>}
        {selectedId && loadingProfile && <p className="pj-loading">Cargando perfil…</p>}
        {selectedId && isError && <p className="pj-error">No se pudo cargar el perfil de este jugador.</p>}

        {selectedId && !loadingProfile && profile && (
          <div className="pj-profile">

            {/* ── Hero card ── */}
            <div className="pj-hero">
              <div className="pj-hero-glow" />
              <div className="pj-hero-vline" />

              <div className="pj-hero-top">
                <div className="pj-hero-identity">
                  <div className={`pj-hero-avatar${player?.photo ? " pj-hero-avatar--photo" : ""}`}>
                    {player?.photo
                      ? <img src={player.photo} alt={player.name} className="pj-hero-avatar-img" />
                      : getInitial(player?.name)
                    }
                  </div>
                  <div className="pj-hero-id-text">
                    <span className="pj-hero-points-pill">{profile.points} puntos en ranking</span>
                    <h2 className="pj-hero-name">{player?.name}</h2>
                  </div>
                </div>

                {/* Rating badge — anillo SVG con la posición como protagonista */}
                <div className="pj-rating-badge">
                  <svg className="pj-rating-ring" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="44" stroke="rgba(246,201,14,0.12)" strokeWidth="4" />
                    <circle
                      cx="50" cy="50" r="44"
                      stroke="url(#pjRatingGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${totalPlayers ? Math.round(((totalPlayers - rank + 1) / totalPlayers) * 276) : 0} 276`}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="pjRatingGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f6c90e" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#f6c90e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="pj-rating-inner">
                    <span className="pj-rating-num">{rank}°</span>
                    <span className="pj-rating-label">posición</span>
                  </div>
                </div>
              </div>

              <div className="pj-hero-stats">
                {/* Grupo primario: lo que más importa, números grandes */}
                <div className="pj-pstat-group pj-pstat-group--primary">
                  <div className="pj-pstat">
                    <span className="pj-pstat-num">{profile.played}</span>
                    <span className="pj-pstat-lbl">Jugadas</span>
                  </div>
                  <div className="pj-pstat-sep" />
                  <div className="pj-pstat pj-pstat--win">
                    <span className="pj-pstat-num">{profile.firsts}</span>
                    <span className="pj-pstat-lbl">Ganadas</span>
                    <span className="pj-pstat-sub">{profile.winRatio}%</span>
                  </div>
                  <div className="pj-pstat-sep" />
                  <div className="pj-pstat pj-pstat--last">
                    <span className="pj-pstat-num">{profile.lasts}</span>
                    <span className="pj-pstat-lbl">Últimos</span>
                    <span className="pj-pstat-sub">{profile.lastRatio}%</span>
                  </div>
                </div>

                {/* Grupo contexto: discreto, a la derecha */}
                <div className="pj-pstat-group pj-pstat-group--context">
                  <div className="pj-pstat-ctx">
                    <span className="pj-pstat-ctx-num pj-pstat-ctx-num--highlight">{profile.highlights}</span>
                    <span className="pj-pstat-ctx-lbl">Highlights</span>
                  </div>
                  <div className="pj-pstat-ctx">
                    <span className="pj-pstat-ctx-num">{profile.totalScore.toLocaleString("es-AR")}</span>
                    <span className="pj-pstat-ctx-lbl">Puntos totales</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Rachas personales ── */}
            {droughts && (
              <>
                <h3 className="pj-section-heading">Rachas personales</h3>
                <div className="pj-streaks-grid">
                  <StreakCard title="Más partidas sin salir último" data={droughts.sinSalirUltimo} />
                  <StreakCard title="Más partidas sin ganar" data={droughts.sinGanar} negative />
                </div>
              </>
            )}

            {/* ── Progresión por año ── */}
            {byYear.length > 1 && (
              <>
                <h3 className="pj-section-heading">Progresión por año</h3>
                <div className="pj-chart-card">
                  <p className="pj-chart-subtitle">Puntos de tabla</p>
                  <div className="pj-chart-rows">
                    {byYear.map((y) => {
                      const pct = Math.max(0, Math.round((y.points / maxPoints) * 100));
                      return (
                        <div key={y.year} className="pj-chart-row">
                          <span className="pj-chart-left">{y.year}</span>
                          <div className="pj-chart-track">
                            <div className="pj-chart-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="pj-chart-val">{y.points}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
};

export default PodridaJugadores;
