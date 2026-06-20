import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import "./ChachosSquadStyles.css";
import ChachosMenu from "../ChachosMenu";
import fetchSquad from "../../../reactquery/chachos/fetchSquad";
import fetchPlayerProfile from "../../../reactquery/chachos/fetchPlayerProfile";

const POSITION_LABEL = {
  goalkeeper: "Portero",
  defender:   "Defensor",
  midfielder: "Mediocampista",
  forward:    "Delantero",
};

const PEARLS = [
  { key: "white_pearl",   emoji: "⚪", label: "Blanca"   },
  { key: "vanilla_pearl", emoji: "🟡", label: "Vainilla" },
  { key: "ocher_pearl",   emoji: "🟠", label: "Ocre"     },
  { key: "black_pearl",   emoji: "⚫", label: "Negra"    },
];

const SOCIAL_ITEMS = [
  { key: "mayor_fan",     emoji: "📈", label: "Tu mayor fan",     sub: "Quien te puntúa más alto",           nameFrom: "voter_player", showAvg: true, tileColor: "var(--third-color)" },
  { key: "mayor_critico", emoji: "📉", label: "Tu mayor crítico", sub: "Quien te puntúa más bajo",           nameFrom: "voter_player", showAvg: true, tileColor: "var(--fourth-color)" },
  { key: "mayor_aliado",  emoji: "🤝", label: "Tu aliado",        sub: "Quien más perlas blancas te dio",    nameFrom: "voter_player",               tileColor: "var(--third-color)" },
  { key: "te_persigue",   emoji: "😈", label: "Tu némesis",       sub: "Quien más perlas negras te dio",     nameFrom: "voter_player",               tileColor: "var(--fourth-color)" },
  { key: "tu_preferido",  emoji: "❤️", label: "Tu preferido",     sub: "A quien más perlas blancas le das",  nameFrom: "player",                     tileColor: "var(--third-color)" },
  { key: "tu_victima",    emoji: "🗡️", label: "Tu víctima",       sub: "A quien más perlas negras le das",   nameFrom: "player",                     tileColor: "var(--fourth-color)" },
];

const ChachosSquad = () => {
  const [selectedId, setSelectedId]   = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: squadData, isLoading: loadingSquad } = useQuery({
    queryKey: ["squad"],
    queryFn:  fetchSquad,
    staleTime: 5 * 60 * 1000,
  });

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["player-profile", selectedId],
    queryFn:  () => fetchPlayerProfile(selectedId),
    enabled:  !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  const squad   = squadData?.squad ?? [];
  const selected = squad.find((s) => s.player._id === selectedId) ?? null;

  const profile     = profileData?.player     ?? null;
  const career      = profileData?.career     ?? null;
  const byYear      = profileData?.byYear     ?? [];
  const vsRivals    = profileData?.vsRivals   ?? [];
  const social      = profileData?.social     ?? {};
  const totalRounds = profileData?.totalRounds ?? 0;

  const maxGA  = byYear.length ? Math.max(...byYear.flatMap((y) => [y.goals, y.assists]), 1) : 1;
  const maxAvg = 10;

  // La tabla ya viene ordenada por récord (mejor a peor) — primera fila = mejor, última = peor
  const rivRowMod = (i) => i === 0 && vsRivals.length > 1
    ? "csq-rrt-row--best"
    : i === vsRivals.length - 1 && vsRivals.length > 1
      ? "csq-rrt-row--worst"
      : "";
  const rivZ = (v) => `csq-rrt-num${v === 0 ? " csq-rrt-num--zero" : ""}`;

  const initials = profile
    ? (profile.first_name?.[0] ?? "").toUpperCase()
    : (selected?.player.first_name?.[0] ?? "").toUpperCase();

  return (
    <>
      <ChachosMenu />

      <div className="csq">

        {/* ── Header ── */}
        <div className="csq-header">
          <div className="csq-eyebrow"><span className="csq-eyebrow-dot" />Chachos</div>
          <h1 className="csq-title">Jugadores</h1>
        </div>

        {/* ── Dropdown selector ── */}
        <div className="csq-dd" ref={ddRef}>
          <button
            type="button"
            className={`csq-dd-trigger${dropdownOpen ? " csq-dd-trigger--open" : ""}`}
            onClick={() => setDropdownOpen((o) => !o)}
            disabled={loadingSquad}
          >
            <div className="csq-dd-trigger-inner">
              <div className="csq-dd-label">Jugador</div>
              <div className="csq-dd-value">
                {loadingSquad
                  ? "Cargando…"
                  : selected
                    ? `${selected.player.first_name} ${selected.player.last_name}`
                    : "Seleccioná un jugador"
                }
              </div>
            </div>
            <svg className={`csq-dd-chevron${dropdownOpen ? " csq-dd-chevron--open" : ""}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <ul className="csq-dd-list" role="listbox">
              {squad.map(({ player }) => (
                <li
                  key={player._id}
                  role="option"
                  aria-selected={selectedId === player._id}
                  className={`csq-dd-item${selectedId === player._id ? " csq-dd-item--active" : ""}`}
                  onClick={() => { setSelectedId(player._id); setDropdownOpen(false); }}
                >
                  <span className="csq-dd-item-name">
                    <span className="csq-dd-item-firstname">{player.first_name}</span>
                    {" "}
                    <span className="csq-dd-item-lastname">{player.last_name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Perfil del jugador seleccionado ── */}
        {!selectedId && (
          <p className="csq-empty">Seleccioná un jugador para ver su perfil.</p>
        )}

        {selectedId && loadingProfile && (
          <p className="csq-loading">Cargando perfil…</p>
        )}

        {selectedId && !loadingProfile && profile && (
          <div className="csq-profile">

            {/* ── Player card ── */}
            {career && (
              <div className="csq-pcard">

                {/* ── Fila 1: identidad + rating hero ── */}
                <div className="csq-pcard-top">
                  <div className="csq-pcard-identity">
                    <div className="csq-pcard-avatar-wrap">
                      {profile.profile_picture
                        ? <img src={profile.profile_picture} alt={profile.first_name} className="csq-pcard-avatar-img" />
                        : <span className="csq-pcard-avatar-initials">{initials}</span>
                      }
                    </div>
                    <div className="csq-pcard-id-text">
                      {profile.field_position && (
                        <span className="csq-pcard-position">
                          {POSITION_LABEL[profile.field_position] ?? profile.field_position}
                        </span>
                      )}
                      <h2 className="csq-pcard-name">{profile.first_name} {profile.last_name}</h2>
                    </div>
                  </div>

                  {/* Rating badge — el número protagonista */}
                  {career.avg_points != null && (
                    <div className="csq-rating-badge">
                      <svg className="csq-rating-ring" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="44" stroke="rgba(168,218,220,0.12)" strokeWidth="4"/>
                        <circle
                          cx="50" cy="50" r="44"
                          stroke="url(#ratingGrad)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.round((career.avg_points / 10) * 276)} 276`}
                          transform="rotate(-90 50 50)"
                        />
                        <defs>
                          <linearGradient id="ratingGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a8dadc" stopOpacity="0.6"/>
                            <stop offset="100%" stopColor="#a8dadc"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="csq-rating-inner">
                        <span className="csq-rating-num">{career.avg_points.toFixed(2)}</span>
                        <span className="csq-rating-label">puntaje</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Fila 2: stats con jerarquía ── */}
                <div className="csq-pcard-stats">

                  {/* Grupo primario: goles + asistencias + PJ — misma jerarquía */}
                  <div className="csq-pstat-group csq-pstat-group--primary">
                    {[
                      {
                        mod:   "goals",
                        num:   career.goals,
                        lbl:   "Goles",
                        sub:   career.matches > 0 ? `${(career.goals / career.matches).toFixed(2)} / PJ` : null,
                      },
                      {
                        mod:   "assists",
                        num:   career.assists,
                        lbl:   "Asistencias",
                        sub:   career.matches > 0 ? `${(career.assists / career.matches).toFixed(2)} / PJ` : null,
                      },
                      {
                        mod:   "matches",
                        num:   career.matches,
                        lbl:   "Partidos",
                        sub:   totalRounds > 0 ? `${Math.round((career.matches / totalRounds) * 100)}% del historial` : null,
                      },
                    ].map(({ mod, num, lbl, sub }, i, arr) => (
                      <>
                        <div key={mod} className={`csq-pstat csq-pstat--${mod}`}>
                          <span className="csq-pstat-num">{num}</span>
                          <span className="csq-pstat-lbl">{lbl}</span>
                          {sub && <span className="csq-pstat-sub">{sub}</span>}
                        </div>
                        {i < arr.length - 1 && <div key={`sep-${mod}`} className="csq-pstat-sep" />}
                      </>
                    ))}
                  </div>

                  {/* Contexto: tarjetas — discretas */}
                  <div className="csq-pstat-group csq-pstat-group--context">
                    <div className="csq-pstat-ctx">
                      <span className="csq-pstat-ctx-num csq-pstat-ctx-num--yellow">{career.yellow_cards}</span>
                      <span className="csq-pstat-ctx-lbl">Amarillas</span>
                    </div>
                    <div className="csq-pstat-ctx">
                      <span className="csq-pstat-ctx-num csq-pstat-ctx-num--red">{career.red_cards}</span>
                      <span className="csq-pstat-ctx-lbl">Rojas</span>
                    </div>
                  </div>

                </div>

                {/* ── Fila 3: perlas ── */}
                <div className="csq-pcard-pearls">
                  {[
                    { key: "white_pearl",   label: "Blanca",   color: "rgba(168,218,220,0.15)", border: "rgba(168,218,220,0.25)", emoji: "⚪" },
                    { key: "vanilla_pearl", label: "Vainilla", color: "rgba(246,201,14,0.1)",   border: "rgba(246,201,14,0.25)",  emoji: "🟡" },
                    { key: "ocher_pearl",   label: "Ocre",     color: "rgba(249,115,22,0.1)",   border: "rgba(249,115,22,0.25)",  emoji: "🟠" },
                    { key: "black_pearl",   label: "Negra",    color: "rgba(230,57,70,0.1)",    border: "rgba(230,57,70,0.2)",    emoji: "⚫" },
                  ].map(({ key, label, color, border, emoji }) => (
                    <div key={key} className="csq-ppearl" style={{ "--pearl-bg": color, "--pearl-border": border }}>
                      <span className="csq-ppearl-top">
                        <span className="csq-ppearl-emoji">{emoji}</span>
                        <span className="csq-ppearl-count">{career[key] ?? 0}</span>
                      </span>
                      <span className="csq-ppearl-label">{label}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ── Progresión por año ── */}
            {byYear.length > 1 && (
              <>
                <h3 className="csq-section-heading">Progresión por año</h3>
                <div className="csq-chart-card">
                  {/* Línea de promedio de puntos */}
                  <p className="csq-chart-subtitle">Promedio de puntos</p>
                  <div className="csq-avg-bars">
                    {byYear.map((y) => {
                      const pct = y.avg_points != null ? Math.round((y.avg_points / maxAvg) * 100) : 0;
                      return (
                        <div key={y.year} className="csq-chart-row">
                          <span className="csq-chart-left csq-chart-left--year">{y.year}</span>
                          <div className="csq-avg-track">
                            <div className="csq-avg-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="csq-chart-val">{y.avg_points != null ? y.avg_points.toFixed(2) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barras horizontales agrupadas por año */}
                  <p className="csq-chart-subtitle" style={{ marginTop: "1.5rem" }}>Goles y asistencias</p>
                  <div className="csq-ga-groups">
                    {byYear.map((y) => (
                      <div key={y.year} className="csq-ga-group">
                        <div className="csq-chart-row">
                          <span className="csq-chart-left">
                            <span className="csq-ga-year">{y.year}</span>
                            <span className="csq-ga-tag csq-ga-tag--goal">G</span>
                          </span>
                          <div className="csq-ga-track">
                            <div className="csq-ga-fill csq-ga-fill--goal" style={{ width: `${Math.round((y.goals / maxGA) * 100)}%` }} />
                          </div>
                          <span className="csq-chart-val">{y.goals}</span>
                        </div>
                        <div className="csq-chart-row">
                          <span className="csq-chart-left">
                            <span className="csq-ga-tag csq-ga-tag--assist">A</span>
                          </span>
                          <div className="csq-ga-track">
                            <div className="csq-ga-fill csq-ga-fill--assist" style={{ width: `${Math.round((y.assists / maxGA) * 100)}%` }} />
                          </div>
                          <span className="csq-chart-val">{y.assists}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="csq-ga-legend">
                    <span className="csq-ga-legend-item csq-ga-legend-item--goal">Goles</span>
                    <span className="csq-ga-legend-item csq-ga-legend-item--assist">Asistencias</span>
                  </div>
                </div>
              </>
            )}

            {/* ── Performance vs rivales ── */}
            {vsRivals.length > 0 && (
              <>
                <h3 className="csq-section-heading">Performance vs rivales</h3>
                <p className="csq-riv-caption">G y A son los goles y asistencias del jugador frente a cada rival, no del equipo.</p>

                <div className="csq-riv-record-card">
                  {/* Desktop — tabla */}
                  <div className="csq-riv-record-table-wrapper csq-riv-desktop-only">
                    <table className="csq-riv-record-table">
                      <colgroup>
                        <col className="csq-rrt-col--name" />
                        {["pj","pg","pe","pp","g","a"].map((c) => <col key={c} className="csq-rrt-col--stat" />)}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="csq-rrt-name">Rival</th>
                          <th title="Partidos jugados">PJ</th>
                          <th className="csq-rrt-th--win"  title="Partidos ganados">PG</th>
                          <th title="Partidos empatados">PE</th>
                          <th className="csq-rrt-th--loss" title="Partidos perdidos">PP</th>
                          <th className="csq-rrt-th--goal"   title="Goles marcados">G</th>
                          <th className="csq-rrt-th--assist" title="Asistencias">A</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vsRivals.map((r, i) => (
                          <tr key={r.rival._id} className={rivRowMod(i)}>
                            <td className="csq-rrt-name" title={r.rival.name}>{r.rival.name}</td>
                            <td className={rivZ(r.matches)}>{r.matches}</td>
                            <td className={`${rivZ(r.wins)} csq-rrt-num--win`}>{r.wins}</td>
                            <td className={rivZ(r.draws)}>{r.draws}</td>
                            <td className={`${rivZ(r.losses)} csq-rrt-num--loss`}>{r.losses}</td>
                            <td className={`${rivZ(r.goals)} csq-rrt-num--goal`}><span className="csq-rrt-chip">{r.goals}</span></td>
                            <td className={`${rivZ(r.assists)} csq-rrt-num--assist`}><span className="csq-rrt-chip">{r.assists}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile — cards compactas de 2 líneas */}
                  <div className="csq-riv-mobile-only">
                    {vsRivals.map((r, i) => (
                      <div key={r.rival._id} className={`csq-riv-mcard ${rivRowMod(i)}`}>
                        <div className="csq-riv-mcard-row1">
                          <span className="csq-riv-mcard-name" title={r.rival.name}>{r.rival.name}</span>
                          <span className="csq-riv-mcard-pj">{r.matches} PJ</span>
                        </div>
                        <div className="csq-riv-mcard-row2">
                          <span className="csq-riv-mcard-record">
                            <span className={`csq-riv-mcard-rec--win${r.wins === 0 ? " csq-riv-mcard-rec--zero" : ""}`}>{r.wins} PG</span>
                            <span className={`csq-riv-mcard-rec--draw${r.draws === 0 ? " csq-riv-mcard-rec--zero" : ""}`}>{r.draws} PE</span>
                            <span className={`csq-riv-mcard-rec--loss${r.losses === 0 ? " csq-riv-mcard-rec--zero" : ""}`}>{r.losses} PP</span>
                          </span>
                          <span className="csq-riv-mcard-ga">
                            <span className={`csq-rrt-chip csq-rrt-chip--goal${r.goals === 0 ? " csq-rrt-chip--zero" : ""}`}>{r.goals} G</span>
                            <span className={`csq-rrt-chip csq-rrt-chip--assist${r.assists === 0 ? " csq-rrt-chip--zero" : ""}`}>{r.assists} A</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Social insights ── */}
            {Object.values(social).some(Boolean) && (
              <>
                <h3 className="csq-section-heading">Radiografía social</h3>
                <div className="csq-social-grid">
                  {SOCIAL_ITEMS.map(({ key, emoji, label, sub, nameFrom, showAvg, tileColor }) => {
                    const item = social[key];
                    if (!item) return null;
                    const p = item[nameFrom];
                    const firstName = p?.first_name ?? "—";
                    const lastName  = p?.last_name  ?? "";
                    const fullName  = `${firstName} ${lastName}`.trim();
                    const statText  = showAvg && item.avg != null
                      ? item.avg.toFixed(2)
                      : item.count != null ? `${item.count}×` : "—";
                    const statIsAvg = showAvg && item.avg != null;
                    return (
                      <div key={key} className="csq-social-card" style={{ "--tile-color": tileColor }}>
                        {/* Header: label + copete + emoji */}
                        <div className="csq-social-header">
                          <div className="csq-social-header-text">
                            <span className="csq-social-label">{label}</span>
                            <span className="csq-social-sub">{sub}</span>
                          </div>
                          <span className="csq-social-emoji">{emoji}</span>
                        </div>
                        {/* Body: avatar | nombre + apellido | stat */}
                        <div className="csq-social-body">
                          {item.profile_picture ? (
                            <img src={item.profile_picture} alt={fullName} className="csq-social-avatar" />
                          ) : (
                            <span className="csq-social-avatar csq-social-avatar--initials">
                              {firstName[0]?.toUpperCase() ?? "?"}
                            </span>
                          )}
                          <div className="csq-social-name-block">
                            <span className="csq-social-firstname">{firstName}</span>
                            <span className="csq-social-lastname">{lastName}</span>
                          </div>
                          <span className="csq-social-stat">{statText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
};

export default ChachosSquad;
