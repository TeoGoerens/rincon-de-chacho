import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChachosMenu from "../ChachosMenu";
import fetchAllTournaments from "../../../reactquery/chachos/fetchAllTournaments";
import fetchStatsSummary from "../../../reactquery/chachos/fetchStatsSummary";
import "./ChachosEstadisticasStyles.css";

const MOBILE_STAT_OPTIONS = [
  { key: "goals",        label: "GOL" },
  { key: "assists",      label: "AST" },
  { key: "yellow_cards", label: "AMA" },
  { key: "red_cards",    label: "ROJ" },
  { key: "avg_points",   label: "PTS" },
];

const RANKING_COLS = [
  { key: "matches",      label: "PJ",          short: "PJ"  },
  { key: "goals",        label: "Goles",        short: "GOL" },
  { key: "assists",      label: "Asistencias",  short: "AST" },
  { key: "yellow_cards", label: "Amarillas",    short: "AMA" },
  { key: "red_cards",    label: "Rojas",        short: "ROJ" },
  { key: "avg_points",   label: "Puntaje",      short: "PTS" },
];

const PEARL_COLS = [
  { key: "white",   label: "⚪" },
  { key: "vanilla", label: "🟡" },
  { key: "ocher",   label: "🟠" },
  { key: "black",   label: "⚫" },
  { key: "total",   label: "PTS" },
];

const semanticClass = (key, val) => {
  if (val === 0 || val == null) return "ce-val--zero";
  return `ce-val--${key}`;
};

const SortIcon = ({ active, dir }) => (
  <span className="ce-sort-icon">{active ? (dir === "desc" ? "↓" : "↑") : "↕"}</span>
);

const ChachosEstadisticas = () => {
  const [selectedTournament, setSelectedTournament] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [mobileStat, setMobileStat] = useState("goals");

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [rankSort,  setRankSort]  = useState({ key: "avg_points", dir: "desc" });
  const [pearlSort, setPearlSort] = useState({ key: "total",      dir: "desc" });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn:  fetchAllTournaments,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["stats-summary", selectedTournament || null],
    queryFn:  () => fetchStatsSummary({ tournament: selectedTournament || null }),
    staleTime: 5 * 60 * 1000,
  });

  const teamSummary   = data?.teamSummary       ?? null;
  const individualRaw = data?.individualRankings ?? [];
  const h2h           = data?.h2h               ?? [];

  const tournamentsSorted = useMemo(
    () => [...tournaments].sort((a, b) => b.year - a.year),
    [tournaments]
  );

  const efectividad = teamSummary && teamSummary.matches > 0
    ? ((teamSummary.wins * 3 + teamSummary.draws) / (teamSummary.matches * 3) * 100).toFixed(1)
    : "—";

  const sortedRankings = useMemo(() => {
    return [...individualRaw].sort((a, b) => {
      const va = a[rankSort.key] ?? -Infinity;
      const vb = b[rankSort.key] ?? -Infinity;
      return rankSort.dir === "desc" ? vb - va : va - vb;
    });
  }, [individualRaw, rankSort]);

  const pearlRows = useMemo(() => {
    const arr = individualRaw
      .map((p) => ({
        player:  p.player,
        white:   p.white_pearl,
        vanilla: p.vanilla_pearl,
        ocher:   p.ocher_pearl,
        black:   p.black_pearl,
        total:   p.white_pearl * 5 + p.vanilla_pearl * 1 + p.ocher_pearl * -1 + p.black_pearl * -5,
      }))
      .filter((p) => p.white + p.vanilla + p.ocher + p.black > 0);
    return arr.sort((a, b) => {
      const va = a[pearlSort.key] ?? -Infinity;
      const vb = b[pearlSort.key] ?? -Infinity;
      return pearlSort.dir === "desc" ? vb - va : va - vb;
    });
  }, [individualRaw, pearlSort]);

  const toggleRankSort = (key) =>
    setRankSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );

  const togglePearlSort = (key) =>
    setPearlSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );

  return (
    <>
      <ChachosMenu />
      <div className="ce">

        {/* ── Header ── */}
        <div className="ce-header">
          <div className="ce-eyebrow"><span className="ce-eyebrow-dot" />Chachos</div>
          <h1 className="ce-title">Estadísticas</h1>
        </div>

        {/* ── Selector de torneo ── */}
        <div className="ce-dd" ref={dropdownRef}>
          <button
            type="button"
            className={`ce-dd-trigger${dropdownOpen ? " ce-dd-trigger--open" : ""}`}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <div className="ce-dd-trigger-inner">
              <div className="ce-dd-label">Torneo</div>
              <div className="ce-dd-value">
                {selectedTournament
                  ? (() => { const t = tournamentsSorted.find((t) => t._id === selectedTournament); return t ? `${t.name} ${t.year}` : "Todos los torneos"; })()
                  : "Todos los torneos"}
              </div>
            </div>
            <svg className={`ce-dd-chevron${dropdownOpen ? " ce-dd-chevron--open" : ""}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {dropdownOpen && (
            <ul className="ce-dd-list" role="listbox">
              {[{ _id: "", name: "Todos los torneos", year: "" }, ...tournamentsSorted].map((t) => (
                <li
                  key={t._id}
                  role="option"
                  aria-selected={selectedTournament === t._id}
                  className={`ce-dd-item${selectedTournament === t._id ? " ce-dd-item--active" : ""}`}
                  onClick={() => { setSelectedTournament(t._id); setDropdownOpen(false); }}
                >
                  {t.name}{t.year ? <span className="ce-dd-item-year"> {t.year}</span> : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isLoading ? (
          <p className="ce-loading">Cargando estadísticas…</p>
        ) : (
          <>
            {/* ── 1. Resumen del equipo ── */}
            {teamSummary && (() => {
              const dg = teamSummary.goals_for - teamSummary.goals_against;
              const winPct   = teamSummary.matches > 0 ? teamSummary.wins    / teamSummary.matches * 100 : 0;
              const drawPct  = teamSummary.matches > 0 ? teamSummary.draws   / teamSummary.matches * 100 : 0;
              const lostPct  = teamSummary.matches > 0 ? teamSummary.defeats / teamSummary.matches * 100 : 0;
              return (
                <>
                  <h2 className="ce-section-heading">Resumen del equipo</h2>
                  <div className="ce-hero-card">

                    {/* Zona izquierda — PJ */}
                    <div className="ce-hero-zone ce-hero-zone--pj">
                      <span className="ce-hero-zone-label">Partidos</span>
                      <span className="ce-hero-big">{teamSummary.matches}</span>
                      <span className="ce-hero-zone-sub">jugados</span>
                    </div>

                    <div className="ce-hero-divider" />

                    {/* Zona central — W/D/L + bar + goles */}
                    <div className="ce-hero-zone ce-hero-zone--results">
                      <span className="ce-hero-zone-label">Resultados</span>
                      <div className="ce-hero-wdl">
                        <div className="ce-hero-wdl-item">
                          <span className="ce-hero-wdl-val ce-hero-wdl-val--w">{teamSummary.wins}</span>
                          <span className="ce-hero-wdl-lbl">V</span>
                        </div>
                        <span className="ce-hero-wdl-sep">·</span>
                        <div className="ce-hero-wdl-item">
                          <span className="ce-hero-wdl-val ce-hero-wdl-val--d">{teamSummary.draws}</span>
                          <span className="ce-hero-wdl-lbl">E</span>
                        </div>
                        <span className="ce-hero-wdl-sep">·</span>
                        <div className="ce-hero-wdl-item">
                          <span className="ce-hero-wdl-val ce-hero-wdl-val--l">{teamSummary.defeats}</span>
                          <span className="ce-hero-wdl-lbl">D</span>
                        </div>
                      </div>
                      <div className="ce-hero-bar">
                        <div className="ce-hero-bar-seg ce-hero-bar-seg--w" style={{ width: `${winPct}%` }} />
                        <div className="ce-hero-bar-seg ce-hero-bar-seg--d" style={{ width: `${drawPct}%` }} />
                        <div className="ce-hero-bar-seg ce-hero-bar-seg--l" style={{ width: `${lostPct}%` }} />
                      </div>
                      <div className="ce-hero-goals">
                        <span className="ce-hero-goals-item">
                          <span className="ce-hero-goals-val">{teamSummary.goals_for}</span> GF
                        </span>
                        <span className="ce-hero-goals-sep">·</span>
                        <span className="ce-hero-goals-item">
                          <span className="ce-hero-goals-val">{teamSummary.goals_against}</span> GC
                        </span>
                        <span className="ce-hero-goals-sep">·</span>
                        <span className="ce-hero-goals-item">
                          <span className={`ce-hero-goals-val${dg > 0 ? " ce-hero-goals-val--pos" : dg < 0 ? " ce-hero-goals-val--neg" : ""}`}>
                            {dg > 0 ? "+" : ""}{dg}
                          </span> DG
                        </span>
                      </div>
                    </div>

                    <div className="ce-hero-divider" />

                    {/* Zona derecha — Efectividad */}
                    <div className="ce-hero-zone ce-hero-zone--eff">
                      <span className="ce-hero-zone-label">Efectividad</span>
                      <span className="ce-hero-big ce-hero-big--teal">{efectividad}%</span>
                      <span className="ce-hero-zone-sub">de los puntos</span>
                    </div>

                  </div>
                </>
              );
            })()}

            {/* ── 2. Ranking individual ── */}
            <h2 className="ce-section-heading">Ranking individual</h2>

            {/* Mobile: pills + tabla simplificada */}
            {sortedRankings.length > 0 && (
              <div className="ce-mobile-stats">
                <div className="ce-mstat-pills">
                  {MOBILE_STAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`ce-mstat-pill${mobileStat === opt.key ? " ce-mstat-pill--active" : ""}`}
                      onClick={() => setMobileStat(opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="ce-card ce-table-card">
                  <div className="ce-table-wrapper">
                    <table className="ce-table">
                      <colgroup>
                        <col style={{ width: "auto" }} />
                        <col style={{ width: "44px" }} />
                        <col style={{ width: "44px" }} />
                        {mobileStat !== "avg_points" && <col style={{ width: "44px" }} />}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="ce-th ce-th--name">Jugador</th>
                          <th className="ce-th ce-th--stat">PJ</th>
                          <th className="ce-th ce-th--stat ce-th--active">
                            {MOBILE_STAT_OPTIONS.find((o) => o.key === mobileStat)?.label}
                          </th>
                          {mobileStat !== "avg_points" && (
                            <th className="ce-th ce-th--stat">AVG</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[...sortedRankings]
                          .sort((a, b) => (b[mobileStat] ?? 0) - (a[mobileStat] ?? 0))
                          .map((p, i) => {
                            const val = p[mobileStat];
                            const avg = mobileStat !== "avg_points" && p.matches > 0
                              ? (val / p.matches).toFixed(2) : null;
                            return (
                              <tr key={p.player._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                                <td className="ce-td ce-td--name">
                                  <div className="ce-td-name-inner">
                                    <span className="ce-st-pos">{i + 1}</span>
                                    <span className="ce-st-name">{p.player.first_name} {p.player.last_name}</span>
                                  </div>
                                </td>
                                <td className="ce-td ce-td--stat">{p.matches}</td>
                                <td className={`ce-td ce-td--stat ce-td--active${val === 0 ? " ce-val--zero" : ` ce-val--${mobileStat}`}`}>
                                  {val != null ? (mobileStat === "avg_points" ? val : val) : "—"}
                                </td>
                                {mobileStat !== "avg_points" && (
                                  <td className="ce-td ce-td--stat ce-td--mstat-avg">{avg ?? "—"}</td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: tabla completa sorteable */}
            <p className="ce-table-hint">↕ Tocá un encabezado para ordenar</p>
            <div className="ce-card ce-table-card ce-ranking-desktop">
              {sortedRankings.length === 0 ? (
                <p className="ce-empty" style={{ padding: "1rem 1.5rem" }}>Sin datos para este torneo.</p>
              ) : (
                <div className="ce-table-wrapper">
                  <table className="ce-table">
                    <colgroup>
                      <col className="ce-col--num" />
                      <col className="ce-col--name" />
                      {RANKING_COLS.map((col) => <col key={col.key} className="ce-col--stat" />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="ce-th ce-th--num">#</th>
                        <th className="ce-th ce-th--name">Jugador</th>
                        {RANKING_COLS.map((col) => (
                          <th
                            key={col.key}
                            className={`ce-th ce-th--stat${rankSort.key === col.key ? " ce-th--active" : ""}`}
                            onClick={() => toggleRankSort(col.key)}
                          >
                            <span className="ce-label-full">{col.label}</span>
                            <span className="ce-label-short">{col.short}</span>
                            <SortIcon active={rankSort.key === col.key} dir={rankSort.dir} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRankings.map((p, i) => (
                        <tr key={p.player._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                          <td className="ce-td ce-td--num">{i + 1}</td>
                          <td className="ce-td ce-td--name">
                            <div className="ce-td-name-inner">
                              <span className="ce-st-pos">{i + 1}</span>
                              <span className="ce-st-name">{p.player.first_name} {p.player.last_name}</span>
                            </div>
                          </td>
                          <td className={`ce-td ce-td--stat ${semanticClass("matches", p.matches)}${rankSort.key === "matches" ? " ce-td--active" : ""}`}>{p.matches}</td>
                          <td className={`ce-td ce-td--stat ${semanticClass("goals", p.goals)}${rankSort.key === "goals" ? " ce-td--active" : ""}`}>{p.goals}</td>
                          <td className={`ce-td ce-td--stat ${semanticClass("assists", p.assists)}${rankSort.key === "assists" ? " ce-td--active" : ""}`}>{p.assists}</td>
                          <td className={`ce-td ce-td--stat ${semanticClass("yellow_cards", p.yellow_cards)}${rankSort.key === "yellow_cards" ? " ce-td--active" : ""}`}>{p.yellow_cards}</td>
                          <td className={`ce-td ce-td--stat ${semanticClass("red_cards", p.red_cards)}${rankSort.key === "red_cards" ? " ce-td--active" : ""}`}>{p.red_cards}</td>
                          <td className={`ce-td ce-td--stat ${semanticClass("avg_points", p.avg_points)}${rankSort.key === "avg_points" ? " ce-td--active" : ""}`}>
                            {p.avg_points != null ? p.avg_points : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── 3. Perlas acumuladas ── */}
            <h2 className="ce-section-heading">Perlas acumuladas</h2>
            <p className="ce-table-hint ce-table-hint--pearls">↕ Tocá un encabezado para ordenar</p>
            <div className="ce-card ce-table-card">
              {pearlRows.length === 0 ? (
                <p className="ce-empty" style={{ padding: "1rem 1.5rem" }}>Sin perlas registradas para este torneo.</p>
              ) : (
                <div className="ce-table-wrapper">
                  <table className="ce-table">
                    <colgroup>
                      <col className="ce-col--num" />
                      <col className="ce-col--name" />
                      {PEARL_COLS.map((col) => <col key={col.key} className="ce-col--stat-lg" />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="ce-th ce-th--num">#</th>
                        <th className="ce-th ce-th--name">Jugador</th>
                        {PEARL_COLS.map((col) => (
                          <th
                            key={col.key}
                            className={`ce-th ce-th--stat${pearlSort.key === col.key ? " ce-th--active" : ""}`}
                            onClick={() => togglePearlSort(col.key)}
                          >
                            <span>{col.label}</span>
                            <SortIcon active={pearlSort.key === col.key} dir={pearlSort.dir} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pearlRows.map((p, i) => (
                        <tr key={p.player._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                          <td className="ce-td ce-td--num">{i + 1}</td>
                          <td className="ce-td ce-td--name">
                            <div className="ce-td-name-inner">
                              <span className="ce-st-name">{p.player.first_name} {p.player.last_name}</span>
                            </div>
                          </td>
                          <td className={`ce-td ce-td--stat${p.white   === 0 ? " ce-val--zero" : ""}${pearlSort.key === "white"   ? " ce-td--active" : ""}`}>{p.white}</td>
                          <td className={`ce-td ce-td--stat${p.vanilla === 0 ? " ce-val--zero" : ""}${pearlSort.key === "vanilla" ? " ce-td--active" : ""}`}>{p.vanilla}</td>
                          <td className={`ce-td ce-td--stat${p.ocher   === 0 ? " ce-val--zero" : ""}${pearlSort.key === "ocher"   ? " ce-td--active" : ""}`}>{p.ocher}</td>
                          <td className={`ce-td ce-td--stat${p.black   === 0 ? " ce-val--zero" : ""}${pearlSort.key === "black"   ? " ce-td--active" : ""}`}>{p.black}</td>
                          <td className={`ce-td ce-td--stat${pearlSort.key === "total"   ? " ce-td--active" : ""}`}>{p.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── 4. Head-to-head vs rivales ── */}
            <h2 className="ce-section-heading">Head-to-head vs rivales</h2>
            <div className="ce-card ce-table-card">
              {h2h.length === 0 ? (
                <p className="ce-empty" style={{ padding: "1rem 1.5rem" }}>Sin partidos registrados.</p>
              ) : (
                <div className="ce-table-wrapper">
                  <table className="ce-table">
                    <colgroup>
                      <col className="ce-col--name" />
                      {["pj","v","e","d","gf","gc","dg"].map((c) => <col key={c} className="ce-col--stat" />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="ce-th ce-th--name">Rival</th>
                        <th className="ce-th ce-th--stat">PJ</th>
                        <th className="ce-th ce-th--stat ce-th--win">V</th>
                        <th className="ce-th ce-th--stat ce-th--draw">E</th>
                        <th className="ce-th ce-th--stat ce-th--defeat">D</th>
                        <th className="ce-th ce-th--stat">GF</th>
                        <th className="ce-th ce-th--stat">GC</th>
                        <th className="ce-th ce-th--stat">DG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h2h.map((r, i) => (
                        <tr key={r.rival._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                          <td className="ce-td ce-td--name"><div className="ce-td-name-inner"><span className="ce-st-name">{r.rival.name}</span></div></td>
                          <td className="ce-td ce-td--stat">{r.matches}</td>
                          <td className="ce-td ce-td--stat ce-td--win">{r.wins}</td>
                          <td className="ce-td ce-td--stat ce-td--draw">{r.draws}</td>
                          <td className="ce-td ce-td--stat ce-td--defeat">{r.defeats}</td>
                          <td className="ce-td ce-td--stat">{r.goals_for}</td>
                          <td className="ce-td ce-td--stat">{r.goals_against}</td>
                          <td className="ce-td ce-td--stat">
                            {r.goals_for - r.goals_against > 0 ? "+" : ""}
                            {r.goals_for - r.goals_against}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChachosEstadisticas;
