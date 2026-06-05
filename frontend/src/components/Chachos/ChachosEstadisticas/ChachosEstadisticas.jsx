import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChachosMenu from "../ChachosMenu";
import fetchAllTournaments from "../../../reactquery/chachos/fetchAllTournaments";
import fetchStatsSummary from "../../../reactquery/chachos/fetchStatsSummary";
import fetchVoteRecords from "../../../reactquery/chachos/fetchVoteRecords";
import "./ChachosEstadisticasStyles.css";

const MOBILE_STAT_OPTIONS = [
  { key: "matches",      label: "PJ"  },
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

const AlterAvatar = ({ name, picture }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return picture ? (
    <img src={picture} alt={name} className="ce-alter-avatar ce-alter-avatar--img" />
  ) : (
    <div className="ce-alter-avatar ce-alter-avatar--initial">{initial}</div>
  );
};

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

  const { data: voteRecords } = useQuery({
    queryKey: ["vote-records"],
    queryFn:  fetchVoteRecords,
    staleTime: 60 * 60 * 1000,
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
    const totalMatches = teamSummary?.matches ?? 0;
    return [...individualRaw].sort((a, b) => {
      const getVal = (item) => {
        if (rankSort.key === "pj_pct")
          return totalMatches > 0 ? item.matches / totalMatches : 0;
        return item[rankSort.key] ?? -Infinity;
      };
      return rankSort.dir === "desc" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
    });
  }, [individualRaw, rankSort, teamSummary]);

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
                  ? (() => { const t = tournamentsSorted.find((t) => t._id === selectedTournament); return t ? t.name : "Todos los torneos"; })()
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
                  {t.name}
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

            {/* ── 2. Head-to-head vs rivales ── */}
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

            {/* ── 3. Ranking individual ── */}
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
                      {mobileStat === "matches" ? (
                        <>
                          <colgroup>
                            <col style={{ width: "auto" }} />
                            <col style={{ width: "44px" }} />
                            <col style={{ width: "52px" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="ce-th ce-th--name">Jugador</th>
                              <th className="ce-th ce-th--stat ce-th--active">PJ</th>
                              <th className="ce-th ce-th--stat">% PJ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...sortedRankings]
                              .sort((a, b) => (b.matches ?? 0) - (a.matches ?? 0))
                              .map((p, i) => {
                                const pjPct = teamSummary?.matches > 0
                                  ? Math.round(p.matches / teamSummary.matches * 100)
                                  : null;
                                return (
                                  <tr key={p.player._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                                    <td className="ce-td ce-td--name">
                                      <div className="ce-td-name-inner">
                                        <span className="ce-st-pos">{i + 1}</span>
                                        <span className="ce-st-name">{p.player.first_name} {p.player.last_name}</span>
                                      </div>
                                    </td>
                                    <td className="ce-td ce-td--stat ce-td--active ce-val--matches">{p.matches}</td>
                                    <td className="ce-td ce-td--stat ce-td--pj-pct">{pjPct != null ? `${pjPct}%` : "—"}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </>
                      ) : (
                        <>
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
                                      {val != null ? (mobileStat === "avg_points" ? Number(val).toFixed(2) : val) : "—"}
                                    </td>
                                    {mobileStat !== "avg_points" && (
                                      <td className="ce-td ce-td--stat ce-td--mstat-avg">{avg ?? "—"}</td>
                                    )}
                                  </tr>
                                );
                              })}
                          </tbody>
                        </>
                      )}
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
                      <col className="ce-col--name" />
                      <col className="ce-col--stat" />
                      <col className="ce-col--stat" />
                      {RANKING_COLS.slice(1).map((col) => <col key={col.key} className="ce-col--stat" />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="ce-th ce-th--name">Jugador</th>
                        <th
                          className={`ce-th ce-th--stat${rankSort.key === "matches" ? " ce-th--active" : ""}`}
                          onClick={() => toggleRankSort("matches")}
                        >
                          <span className="ce-label-full">PJ</span>
                          <span className="ce-label-short">PJ</span>
                          <SortIcon active={rankSort.key === "matches"} dir={rankSort.dir} />
                        </th>
                        <th
                          className={`ce-th ce-th--stat${rankSort.key === "pj_pct" ? " ce-th--active" : ""}`}
                          onClick={() => toggleRankSort("pj_pct")}
                        >
                          <span className="ce-label-full">% PJ</span>
                          <span className="ce-label-short">% PJ</span>
                          <SortIcon active={rankSort.key === "pj_pct"} dir={rankSort.dir} />
                        </th>
                        {RANKING_COLS.slice(1).map((col) => (
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
                      {sortedRankings.map((p, i) => {
                        const pjPct = teamSummary?.matches > 0
                          ? Math.round(p.matches / teamSummary.matches * 100)
                          : null;
                        return (
                          <tr key={p.player._id} className={`ce-tr${i === 0 ? " ce-tr--first" : ""}`}>
                            <td className="ce-td ce-td--name">
                              <div className="ce-td-name-inner">
                                <span className="ce-st-pos">{i + 1}</span>
                                <span className="ce-st-name">{p.player.first_name} {p.player.last_name}</span>
                              </div>
                            </td>
                            <td className={`ce-td ce-td--stat ${semanticClass("matches", p.matches)}${rankSort.key === "matches" ? " ce-td--active" : ""}`}>{p.matches}</td>
                            <td className={`ce-td ce-td--stat ce-td--pj-pct${rankSort.key === "pj_pct" ? " ce-td--active" : ""}`}>
                              {pjPct != null ? `${pjPct}%` : "—"}
                            </td>
                            <td className={`ce-td ce-td--stat ${semanticClass("goals", p.goals)}${rankSort.key === "goals" ? " ce-td--active" : ""}`}>{p.goals}</td>
                            <td className={`ce-td ce-td--stat ${semanticClass("assists", p.assists)}${rankSort.key === "assists" ? " ce-td--active" : ""}`}>{p.assists}</td>
                            <td className={`ce-td ce-td--stat ${semanticClass("yellow_cards", p.yellow_cards)}${rankSort.key === "yellow_cards" ? " ce-td--active" : ""}`}>{p.yellow_cards}</td>
                            <td className={`ce-td ce-td--stat ${semanticClass("red_cards", p.red_cards)}${rankSort.key === "red_cards" ? " ce-td--active" : ""}`}>{p.red_cards}</td>
                            <td className={`ce-td ce-td--stat ${semanticClass("avg_points", p.avg_points)}${rankSort.key === "avg_points" ? " ce-td--active" : ""}`}>
                              {p.avg_points != null ? Number(p.avg_points).toFixed(2) : "—"}
                            </td>
                          </tr>
                        );
                      })}
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
                      <col className="ce-col--name" />
                      {PEARL_COLS.map((col) => <col key={col.key} className="ce-col--stat-lg" />)}
                    </colgroup>
                    <thead>
                      <tr>
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
                          <td className="ce-td ce-td--name">
                            <div className="ce-td-name-inner">
                              <span className="ce-st-pos">{i + 1}</span>
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

            {/* ── 5. Alter egos ── */}
            {voteRecords && (
              <>
                <h2 className="ce-section-heading">Alter egos</h2>
                <div className="ce-alter-grid">
                  {[
                    {
                      num: "01", title: "Rendimiento extremo", showCtx: true,
                      left:  { label: "Fecha perfecta",    items: voteRecords.maxScores    ?? [], getValue: (r) => Number(r.avg).toFixed(2),                                                                                   getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: (r) => { const d = new Date(r.round.match_date); const mon = d.toLocaleDateString("es-AR",{month:"short"}).replace(".",""); const yr = String(d.getFullYear()).slice(-2); return `vs ${r.rival.name} · ${mon} ${yr}`; }, getPic: (r) => r.profile_picture },
                      right: { label: "Fecha negra",       items: voteRecords.minScores    ?? [], getValue: (r) => Number(r.avg).toFixed(2),                                                                                   getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: (r) => { const d = new Date(r.round.match_date); const mon = d.toLocaleDateString("es-AR",{month:"short"}).replace(".",""); const yr = String(d.getFullYear()).slice(-2); return `vs ${r.rival.name} · ${mon} ${yr}`; }, getPic: (r) => r.profile_picture },
                    },
                    {
                      num: "02", title: "Evaluando a sus compañeros",
                      left:  { label: "El más generoso",    items: voteRecords.mostGenerousList ?? [], getValue: (r) => Number(r.avg).toFixed(2),                                                                              getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "promedio a sus compañeros",                                                                                                 getPic: (r) => r.profile_picture },
                      right: { label: "El más ácido",       items: voteRecords.mostAcidList     ?? [], getValue: (r) => Number(r.avg).toFixed(2),                                                                              getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "promedio a sus compañeros",                                                                                                 getPic: (r) => r.profile_picture },
                    },
                    {
                      num: "03", title: "Evaluándose respecto del promedio",
                      left:  { label: "El más autocrítico", items: voteRecords.underratedList   ?? [], getValue: (r) => Number(r.diff).toFixed(2),                                                                             getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "se pone menos que el grupo",                                                                                                getPic: (r) => r.profile_picture },
                      right: { label: "El más optimista",   items: voteRecords.overratedList    ?? [], getValue: (r) => r.diff >= 0 ? `+${Number(r.diff).toFixed(2)}` : Number(r.diff).toFixed(2),                            getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "se pone más que el grupo",                                                                                                  getPic: (r) => r.profile_picture },
                    },
                    {
                      num: "04", title: "Cantidad de votos",
                      left:  { label: "Votante más activo",   items: voteRecords.mostActiveList  ?? [], getValue: (r) => r.voteCount,                                                                                          getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "votos emitidos",                                                                                                            getPic: (r) => r.profile_picture },
                      right: { label: "Votante menos activo", items: voteRecords.leastActiveList ?? [], getValue: (r) => r.voteCount,                                                                                          getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "votos emitidos",                                                                                                            getPic: (r) => r.profile_picture },
                    },
                    {
                      num: "05", title: "La perla propia",
                      left:  { label: "⚪ Se autovota blanca", items: voteRecords.selfWhiteList ?? [], getValue: (r) => `${r.count}x`,                                                                                         getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "autoperlas blancas",                                                                                                        getPic: (r) => r.profile_picture },
                      right: { label: "⚫ Se autovota negra",  items: voteRecords.selfBlackList ?? [], getValue: (r) => `${r.count}x`,                                                                                         getName: (r) => `${r.player.first_name} ${r.player.last_name}`, getCtx: ()  => "autoperlas negras",                                                                                                         getPic: (r) => r.profile_picture },
                    },
                  ].map((pair, idx) => {
                    const renderSide = (side, polarity) => (
                      <div className={`ce-alter-side ce-alter-side--${polarity}`}>
                        <span className="ce-alter-side-label">{side.label}</span>
                        {side.items.length > 0 ? (
                          <>
                            <div className="ce-alter-hero-row">
                              <AlterAvatar name={side.getName(side.items[0])} picture={side.getPic(side.items[0])} />
                              <div className="ce-alter-player-info">
                                <span className="ce-alter-side-name">{side.getName(side.items[0])}</span>
                                {pair.showCtx && <span className="ce-alter-side-ctx">{side.getCtx(side.items[0])}</span>}
                              </div>
                              <span className={`ce-alter-side-value ce-alter-side-value--${polarity}`}>{side.getValue(side.items[0])}</span>
                            </div>
                            <div className="ce-alter-runners">
                              {side.items.slice(1).map((item, i) => (
                                <div key={i} className="ce-alter-runner">
                                  <span className="ce-alter-runner-pos">{i + 2}</span>
                                  <span className="ce-alter-runner-name">{side.getName(item)}</span>
                                  <span className="ce-alter-runner-value">{side.getValue(item)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : <span className="ce-alter-empty">Sin datos</span>}
                      </div>
                    );
                    return (
                      <div key={idx} className={`ce-alter-card${pair.showCtx ? " ce-alter-card--has-ctx" : ""}`}>
                        <div className="ce-alter-card-title">
                          <span className="ce-alter-title-text">{pair.title}</span>
                          <span className="ce-alter-watermark">{pair.num}</span>
                        </div>
                        <div className="ce-alter-body">
                          {renderSide(pair.left, "pos")}
                          <div className="ce-alter-sep" />
                          {renderSide(pair.right, "neg")}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </>
            )}

          </>
        )}
      </div>
    </>
  );
};

export default ChachosEstadisticas;
