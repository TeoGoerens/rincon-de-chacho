import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import fetchLastPodridaMatch from "../../../reactquery/podrida/fetchLastPodridaMatch";
import fetchPodridaRanking from "../../../reactquery/podrida/fetchPodridaRanking";
import PodridaMenu from "../PodridaMenu";
import "./PodridaHomePanelStyles.css";

/* ── Constantes ── */
const CURRENT_YEAR = String(new Date().getFullYear());

const MOBILE_STAT_OPTS = [
  { key: "firsts",     label: "1°",  pts: "+3", neg: false },
  { key: "seconds",    label: "2°",  pts: "+2", neg: false },
  { key: "thirds",     label: "3°",  pts: "+1", neg: false },
  { key: "highlights", label: "HL",  pts: "+1", neg: false },
  { key: "lasts",      label: "ÚLT", pts: "−1", neg: true  },
];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const getInitial = (name) => name?.[0]?.toUpperCase() ?? "?";

const hasValidPhoto = (url) =>
  !!url && !url.includes("pixabay") && !url.includes("avatar-1577909");

const topChamp  = (ranking) =>
  ranking.length === 0
    ? null
    : [...ranking].sort((a, b) => b.firsts - a.firsts)[0];

const topChumbo = (ranking) =>
  ranking.length === 0
    ? null
    : [...ranking].sort((a, b) => b.lasts - a.lasts)[0];

/* ═══════════════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════════════ */
const PodridaHomePanel = () => {
  const [selectedYear, setSelectedYear] = useState("all");
  const [mobileStat, setMobileStat] = useState("firsts");
  const [sortKey, setSortKey]   = useState("points");
  const [sortDir, setSortDir]   = useState("desc");

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handlePill = (key) => setMobileStat(key);

  /* ── Queries ── */
  const { data: lastMatchData, isLoading: loadingMatch } = useQuery({
    queryKey: ["fetchLastPodridaMatch"],
    queryFn: fetchLastPodridaMatch,
  });

  // All-time: para mini-stats históricos + availableYears
  const { data: allTimeData } = useQuery({
    queryKey: ["fetchPodridaRanking", ""],
    queryFn: () => fetchPodridaRanking(""),
  });

  // Año en curso: para mini-stats del período actual
  const { data: currentYearData } = useQuery({
    queryKey: ["fetchPodridaRanking", CURRENT_YEAR],
    queryFn: () => fetchPodridaRanking(CURRENT_YEAR),
  });

  // Filtrado para la tabla (coincide con all-time o currentYear si el usuario los selecciona)
  const { data: rankingData, isLoading: loadingRanking } = useQuery({
    queryKey: ["fetchPodridaRanking", selectedYear],
    queryFn: () =>
      fetchPodridaRanking(selectedYear === "all" ? "" : selectedYear),
  });

  /* ── Datos derivados ── */
  const allTimeRanking     = allTimeData?.ranking ?? [];
  const currentYearRanking = currentYearData?.ranking ?? [];
  const ranking            = rankingData?.ranking ?? [];

  const sortedRanking = useMemo(() => {
    return [...ranking].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      const diff = sortDir === "desc" ? bVal - aVal : aVal - bVal;
      return diff !== 0 ? diff : a.name.localeCompare(b.name, "es");
    });
  }, [ranking, sortKey, sortDir]);
  const availableYears     = allTimeData?.availableYears ?? [];

  const allTimeChamp   = useMemo(() => topChamp(allTimeRanking),  [allTimeRanking]);
  const yearChamp      = useMemo(() => topChamp(currentYearRanking), [currentYearRanking]);
  const allTimeChumbo  = useMemo(() => topChumbo(allTimeRanking), [allTimeRanking]);
  const yearChumbo     = useMemo(() => topChumbo(currentYearRanking), [currentYearRanking]);

  const totalMatchesHistorical  = allTimeData?.totalMatches ?? 0;
  const totalMatchesCurrentYear = currentYearData?.filteredMatches ?? 0;
  const hasCurrentYearData      = currentYearData !== undefined;
  const totalPlayersHistorical  = allTimeRanking.length;
  const totalPlayersCurrentYear = currentYearRanking.length;

  /* ── Última partida ── */
  const lastMatch      = lastMatchData?.lastMatch ?? null;
  const playerPictures = lastMatchData?.playerPictures ?? {};
  const sortedPlayers = lastMatch
    ? [...lastMatch.players].sort((a, b) => a.position - b.position)
    : [];
  const podium  = sortedPlayers.slice(0, 3);
  const rest    = sortedPlayers.slice(3);
  const lastPos = sortedPlayers.length > 0
    ? sortedPlayers[sortedPlayers.length - 1].position
    : -1;

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <>
      <PodridaMenu />
      <div className="pr">

        {/* ── Header ── */}
        <div className="pr-header">
          <div className="pr-eyebrow">
            <span className="pr-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pr-title">Resumen</h1>
        </div>

        {/* ── Mini stats ── */}
        {totalMatchesHistorical > 0 && (
          <div className="pr-stats-strip">

            <div className="pr-stat-chip">
              <div className="pr-stat-body">
                <span className="pr-stat-eyebrow">
                  <span className="pr-stat-dot" />
                  Partidas jugadas
                </span>
                <span className="pr-stat-num">{totalMatchesHistorical}</span>
              </div>
              {hasCurrentYearData && (
                <div className="pr-stat-foot">
                  <span className="pr-stat-year-tag">{CURRENT_YEAR}</span>
                  <span className={`pr-stat-year-val${totalMatchesCurrentYear === 0 ? " pr-stat-year-val--empty" : ""}`}>
                    {totalMatchesCurrentYear > 0 ? `${totalMatchesCurrentYear} partidas` : "Sin partidas aún"}
                  </span>
                </div>
              )}
            </div>

            <div className="pr-stat-chip">
              <div className="pr-stat-body">
                <span className="pr-stat-eyebrow">
                  <span className="pr-stat-dot" />
                  Más victorias
                </span>
                <span className="pr-stat-num pr-stat-num--name">
                  {allTimeChamp?.name ?? "—"}
                </span>
              </div>
              {hasCurrentYearData && (
                <div className="pr-stat-foot">
                  <span className="pr-stat-year-tag">{CURRENT_YEAR}</span>
                  <span className={`pr-stat-year-val${!yearChamp ? " pr-stat-year-val--empty" : ""}`}>
                    {yearChamp ? yearChamp.name : "Sin partidas aún"}
                  </span>
                </div>
              )}
            </div>

            <div className="pr-stat-chip">
              <div className="pr-stat-body">
                <span className="pr-stat-eyebrow">
                  <span className="pr-stat-dot" />
                  Más últimos puestos
                </span>
                <span className="pr-stat-num pr-stat-num--name">
                  {allTimeChumbo?.name ?? "—"}
                </span>
              </div>
              {hasCurrentYearData && (
                <div className="pr-stat-foot">
                  <span className="pr-stat-year-tag">{CURRENT_YEAR}</span>
                  <span className={`pr-stat-year-val${!yearChumbo ? " pr-stat-year-val--empty" : ""}`}>
                    {yearChumbo ? yearChumbo.name : "Sin partidas aún"}
                  </span>
                </div>
              )}
            </div>

            <div className="pr-stat-chip">
              <div className="pr-stat-body">
                <span className="pr-stat-eyebrow">
                  <span className="pr-stat-dot" />
                  Jugadores totales
                </span>
                <span className="pr-stat-num">{totalPlayersHistorical}</span>
              </div>
              {hasCurrentYearData && (
                <div className="pr-stat-foot">
                  <span className="pr-stat-year-tag">{CURRENT_YEAR}</span>
                  <span className={`pr-stat-year-val${totalPlayersCurrentYear === 0 ? " pr-stat-year-val--empty" : ""}`}>
                    {totalPlayersCurrentYear > 0 ? `${totalPlayersCurrentYear} activos` : "Sin partidas aún"}
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Última partida ── */}
        <h2 className="pr-section-heading">Última partida</h2>

        {loadingMatch ? (
          <div className="pr-card">
            <p className="pr-empty">Cargando...</p>
          </div>
        ) : lastMatch ? (
          <div className="pr-card pr-last-match">

            {/* Fecha + cantidad */}
            <div className="pr-lm-header">
              <span className="pr-lm-date">{fmtDate(lastMatch.date)}</span>
              <span className="pr-lm-count">{lastMatch.players.length} jugadores</span>
            </div>

            {/* Podio */}
            <div className="pr-podium">
              {podium.map((p, i) => {
                const pic = playerPictures[p.player._id?.toString()];
                const showPhoto = hasValidPhoto(pic);
                return (
                  <div key={p.player._id} className={`pr-podium-slot pr-podium-slot--${i + 1}`}>
                    <span className="pr-podium-pos">{i + 1}°</span>
                    <div className="pr-podium-avatar">
                      {showPhoto
                        ? <img src={pic} alt={p.player.name} className="pr-podium-avatar-img" />
                        : getInitial(p.player.name)
                      }
                    </div>
                    <span className="pr-podium-name">{p.player.name}</span>
                    <span className="pr-podium-score">{p.score} pts</span>
                  </div>
                );
              })}
            </div>

            {/* 4° en adelante */}
            {rest.length > 0 && (
              <div className="pr-lm-rest">
                {rest.map((p) => {
                  const isLast = p.position === lastPos;
                  return (
                    <div
                      key={p.player._id}
                      className={`pr-lm-rest-row${isLast ? " pr-lm-rest-row--last" : ""}`}
                    >
                      <span className="pr-lm-rest-pos">{p.position}°</span>
                      <span className="pr-lm-rest-name">{p.player.name}</span>
                      <span className="pr-lm-rest-score">{p.score} pts</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Highlight + rachas */}
            <div className="pr-lm-tiles">
              {lastMatch.highlight?.player && (
                <div className="pr-lm-tile">
                  <span className="pr-lm-tile-icon">✨</span>
                  <span className="pr-lm-tile-label">Highlight</span>
                  <span className="pr-lm-tile-name">{lastMatch.highlight.player.name}</span>
                  <span className="pr-lm-tile-val">{lastMatch.highlight.score} bazas</span>
                </div>
              )}
              {lastMatch.longestStreakOnTime?.player && (
                <div className="pr-lm-tile">
                  <span className="pr-lm-tile-icon">🔥</span>
                  <span className="pr-lm-tile-label">Racha cumpliendo</span>
                  <span className="pr-lm-tile-name">{lastMatch.longestStreakOnTime.player.name}</span>
                  <span className="pr-lm-tile-val">{lastMatch.longestStreakOnTime.count} seguidas</span>
                </div>
              )}
              {lastMatch.longestStreakFailing?.player && (
                <div className="pr-lm-tile">
                  <span className="pr-lm-tile-icon">🧊</span>
                  <span className="pr-lm-tile-label">Racha sin cumplir</span>
                  <span className="pr-lm-tile-name">{lastMatch.longestStreakFailing.player.name}</span>
                  <span className="pr-lm-tile-val">{lastMatch.longestStreakFailing.count} seguidas</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <p className="pr-empty">Sin partidas registradas.</p>
        )}

        {/* ── Ranking ── */}
        <div className="pr-ranking-header">
          <h2 className="pr-section-heading">Ranking</h2>
          {availableYears.length > 0 && (
            <select
              className="pr-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">Histórico</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          )}
        </div>

        <div className="pr-card pr-ranking-card">

          {/* Leyenda — solo desktop */}
          <div className="pr-legend pr-legend--desktop">
            <span className="pr-legend-title">Puntos</span>
            <div className="pr-legend-items">
              {MOBILE_STAT_OPTS.map(({ label, pts, neg }) => (
                <span key={label} className="pr-legend-item">
                  <span className="pr-legend-item-label">{label}</span>
                  <span className={`pr-legend-item-pts${neg ? " pr-legend-item-pts--neg" : ""}`}>{pts}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Tabla desktop */}
          {loadingRanking ? (
            <p className="pr-empty">Cargando ranking...</p>
          ) : ranking.length > 0 ? (
            <>
              {/* Desktop */}
              {(() => {
                const SortTh = ({ col, children, className = "" }) => {
                  const active = sortKey === col;
                  return (
                    <th
                      className={`pr-th pr-th--stat${active ? " pr-th--active" : ""} ${className}`}
                      onClick={() => handleSort(col)}
                    >
                      {children}
                      <span className={`pr-sort-icon${active ? " pr-sort-icon--active" : ""}`}>
                        {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                      </span>
                    </th>
                  );
                };
                return (
                  <div className="pr-table-wrapper pr-table--desktop">
                    <table className="pr-table">
                      <colgroup>
                        <col className="pr-col--name" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                        <col className="pr-col--stat" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="pr-th pr-th--name">Jugador</th>
                          <SortTh col="played">PJ</SortTh>
                          <SortTh col="points" className="pr-th--pts">PTS</SortTh>
                          <SortTh col="average">AVG</SortTh>
                          <SortTh col="firsts">1°</SortTh>
                          <SortTh col="seconds">2°</SortTh>
                          <SortTh col="thirds">3°</SortTh>
                          <SortTh col="highlights">HL</SortTh>
                          <SortTh col="lasts">ÚLT</SortTh>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRanking.map((j, idx) => {
                          const ac = (col) => sortKey === col ? " pr-td--active-col" : "";
                          return (
                            <tr key={j.name} className={`pr-tr${idx === 0 ? " pr-tr--first" : ""}`}>
                              <td className="pr-td pr-td--name">
                                <div className="pr-td-name-inner">
                                  <span className="pr-td-pos">{idx + 1}</span>
                                  {j.name}
                                </div>
                              </td>
                              <td className={`pr-td${ac("played")}${j.played === 0 ? " pr-td--zero" : ""}`}>{j.played}</td>
                              <td className={`pr-td pr-td--pts${ac("points")}`}>{j.points}</td>
                              <td className={`pr-td${ac("average")}${j.average === 0 ? " pr-td--zero" : ""}`}>{j.average?.toFixed(1)}</td>
                              <td className={`pr-td${ac("firsts")}${j.firsts === 0 ? " pr-td--zero" : ""}`}>{j.firsts}</td>
                              <td className={`pr-td${ac("seconds")}${j.seconds === 0 ? " pr-td--zero" : ""}`}>{j.seconds}</td>
                              <td className={`pr-td${ac("thirds")}${j.thirds === 0 ? " pr-td--zero" : ""}`}>{j.thirds}</td>
                              <td className={`pr-td${ac("highlights")}${j.highlights === 0 ? " pr-td--zero" : ""}`}>{j.highlights}</td>
                              <td className={`pr-td pr-td--last${ac("lasts")}${j.lasts === 0 ? " pr-td--zero" : ""}`}>{j.lasts}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Mobile — pills + tabla compacta */}
              {(() => {
                const activeOpt = MOBILE_STAT_OPTS.find((o) => o.key === mobileStat);
                const isNegActive = mobileStat === "lasts";
                return (
                  <div className="pr-mobile-stats">
                    <div className="pr-mstat-pills">
                      {MOBILE_STAT_OPTS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`pr-mstat-pill${mobileStat === opt.key ? " pr-mstat-pill--active" : ""}${opt.neg ? " pr-mstat-pill--neg" : ""}`}
                          onClick={() => handlePill(opt.key)}
                        >
                          {opt.label}
                          <span className="pr-mstat-pill-pts">{opt.pts}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pr-mobile-table-wrapper">
                      <table className="pr-mobile-table">
                        <colgroup>
                          <col />
                          <col style={{ width: "47px" }} />
                          <col style={{ width: "47px" }} />
                          <col style={{ width: "47px" }} />
                          <col style={{ width: "47px" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="pr-mt-th pr-mt-th--name" onClick={() => handleSort("name")}>
                              Jugador
                            </th>
                            <th className={`pr-mt-th${sortKey === "played" ? " pr-mt-th--sorted" : ""}`} onClick={() => handleSort("played")}>
                              PJ{sortKey === "played" && <span className="pr-sort-icon">{sortDir === "desc" ? "↓" : "↑"}</span>}
                            </th>
                            <th className={`pr-mt-th pr-mt-th--pts${sortKey === "points" ? " pr-mt-th--sorted" : ""}`} onClick={() => handleSort("points")}>
                              PTS{sortKey === "points" && <span className="pr-sort-icon">{sortDir === "desc" ? "↓" : "↑"}</span>}
                            </th>
                            <th className={`pr-mt-th${sortKey === "average" ? " pr-mt-th--sorted" : ""}`} onClick={() => handleSort("average")}>
                              AVG{sortKey === "average" && <span className="pr-sort-icon">{sortDir === "desc" ? "↓" : "↑"}</span>}
                            </th>
                            <th className={`pr-mt-th pr-mt-th--active${isNegActive ? " pr-mt-th--active-neg" : ""}${sortKey === mobileStat ? " pr-mt-th--sorted" : ""}`} onClick={() => handleSort(mobileStat)}>
                              {activeOpt?.label}{sortKey === mobileStat && <span className="pr-sort-icon">{sortDir === "desc" ? "↓" : "↑"}</span>}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRanking.map((j, idx) => {
                            const val = j[mobileStat];
                            const isLast = mobileStat === "lasts";
                            return (
                              <tr key={j.name} className={`pr-mt-tr${idx === 0 ? " pr-mt-tr--first" : ""}`}>
                                <td className="pr-mt-td pr-mt-td--name">
                                  <div className="pr-td-name-inner">
                                    <span className="pr-td-pos">{idx + 1}</span>
                                    {j.name}
                                  </div>
                                </td>
                                <td className={`pr-mt-td${j.played === 0 ? " pr-mt-td--zero" : ""}`}>{j.played}</td>
                                <td className="pr-mt-td pr-mt-td--pts">{j.points}</td>
                                <td className={`pr-mt-td${j.average === 0 ? " pr-mt-td--zero" : ""}`}>{j.average?.toFixed(1)}</td>
                                <td className={`pr-mt-td pr-mt-td--active${val === 0 ? " pr-mt-td--zero" : ""}${isLast && val > 0 ? " pr-mt-td--last" : ""}`}>
                                  {val ?? "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <p className="pr-empty">Sin datos para este año.</p>
          )}

        </div>

      </div>
    </>
  );
};

export default PodridaHomePanel;
