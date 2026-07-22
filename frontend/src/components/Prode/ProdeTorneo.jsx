// Import React dependencies
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeTorneoStyles.css";
import { getUserId } from "../../reactquery/getUserInformation";

//Import components
import ProdeMenu from "./ProdeMenu";
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchAllProdeTournaments from "../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeTournamentStandings from "../../reactquery/prode/fetchProdeTournamentStandings";
import fetchProdeAllTimeStandings from "../../reactquery/prode/fetchProdeAllTimeStandings";
import fetchMyProdePlayer from "../../reactquery/prode/fetchMyProdePlayer";

const monthPill = (month) => month.slice(0, 3).toUpperCase();

/* Valor especial del selector: todos los torneos sumados */
const ALL_TIME = "all";

/* Columnas del desglose "Puntos por desafío" — GDT son mini-duelos
   ganados, ARG/RES son puntos de ítems, EF% = pts (con bonus) ÷ (PJ × 3) */
const BREAKDOWN_COLUMNS = [
  {
    key: "arg",
    label: "ARG",
    title: "Puntos sumados en el Prode Argentina",
    getValue: (row) => row.challenges.arg,
  },
  {
    key: "misc",
    label: "RESTO",
    title: "Puntos sumados en el Prode Resto del Mundo",
    getValue: (row) => row.challenges.misc,
  },
  {
    key: "gdt",
    label: "GDT",
    title: "Mini-duelos del Gran DT ganados",
    getValue: (row) => row.challenges.gdt,
  },
  {
    key: "efficiency",
    label: "EF%",
    title:
      "Eficiencia: puntos obtenidos (con bonus) sobre el máximo sin bonus (PJ × 3) — puede superar 100%",
    getValue: (row) => row.efficiency ?? -1,
  },
];

const CHALLENGE_LABELS = { ARG: "ARG", MISC: "RESTO", GDT: "GDT" };

const formatEfficiency = (efficiency) =>
  efficiency === null || efficiency === undefined
    ? "—"
    : `${(efficiency * 100).toFixed(1)}%`;

/* Pestaña Torneo: tabla de posiciones acumulada o por mes (3.3) + desglose
   por desafío y duelos del período (3.4). Honores llega en 3.5 */
const ProdeTorneo = () => {
  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  /* Los borradores no se muestran al público: todavía no se juegan */
  const tournaments = useMemo(
    () =>
      (tournamentsData ?? [])
        .filter((t) => t.status !== "draft")
        .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "es")),
    [tournamentsData],
  );

  /* El default (activo más reciente, si no el último año) sigue a los datos
     hasta que el usuario elige un torneo explícitamente */
  const [touchedTournamentId, setTouchedTournamentId] = useState(null);
  /* null = acumulada (pill TOT) */
  const [month, setMonth] = useState(null);
  /* Columna activa del desglose por desafío */
  const [breakdownSort, setBreakdownSort] = useState("efficiency");
  /* null = default (solo la fecha más reciente desplegada); un Set cuando
     el usuario tocó algún encabezado */
  const [expandedMatchdays, setExpandedMatchdays] = useState(null);

  const defaultTournament = useMemo(
    () => tournaments.find((t) => t.status === "active") ?? tournaments[0] ?? null,
    [tournaments],
  );
  const tournamentId = touchedTournamentId ?? defaultTournament?._id ?? null;

  const isAllTime = tournamentId === ALL_TIME;

  const {
    data: standings,
    isLoading: standingsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-tournament-standings", tournamentId, month],
    queryFn: () =>
      isAllTime
        ? fetchProdeAllTimeStandings()
        : fetchProdeTournamentStandings(tournamentId, month),
    enabled: Boolean(tournamentId),
  });

  /* Solo para decidir si se muestran los links "Ver fecha" — el jugador
     de Prode vinculado al usuario, o null */
  const { data: myPlayer } = useQuery({
    queryKey: ["prode-my-player", getUserId()],
    queryFn: fetchMyProdePlayer,
  });

  const handleTournamentChange = (event) => {
    setTouchedTournamentId(event.target.value);
    setMonth(null);
    setExpandedMatchdays(null);
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    setExpandedMatchdays(null);
  };

  const rows = useMemo(() => standings?.standings ?? [], [standings]);
  const availableMonths = standings?.availableMonths ?? [];
  const tournamentMonths = standings?.tournament?.months ?? [];
  const matchdayCount = standings?.matchdayCount ?? 0;
  const matchdays = useMemo(() => standings?.matchdays ?? [], [standings]);

  /* Zona de comida: solo en vista mensual y con tabla real (>4 filas) */
  const showMealZone = Boolean(month) && rows.length > 4;

  /* Desglose ordenado por la columna activa (desc), empate alfabético */
  const breakdownColumn = BREAKDOWN_COLUMNS.find(
    (col) => col.key === breakdownSort,
  );
  const breakdownRows = useMemo(() => {
    if (!breakdownColumn) return rows;
    return [...rows].sort(
      (x, y) =>
        breakdownColumn.getValue(y) - breakdownColumn.getValue(x) ||
        x.player.name.localeCompare(y.player.name, "es"),
    );
  }, [rows, breakdownColumn]);

  /* "Ver fecha" solo para participantes del torneo que se está mirando */
  const isParticipant = Boolean(
    myPlayer &&
      rows.some((row) => String(row.player._id) === String(myPlayer._id)),
  );

  /* Matriz mano a mano del período: balance de cruces de cada par, siempre
     desde la perspectiva del jugador de la FILA */
  const h2hByPair = useMemo(() => {
    const map = new Map();
    const bump = (rowId, colId, field) => {
      const key = `${rowId}|${colId}`;
      const entry = map.get(key) ?? { won: 0, drawn: 0, lost: 0 };
      entry[field] += 1;
      map.set(key, entry);
    };
    for (const md of matchdays) {
      for (const duel of md.duels) {
        const a = String(duel.playerA._id);
        const b = String(duel.playerB._id);
        if (duel.duelResult === "A") {
          bump(a, b, "won");
          bump(b, a, "lost");
        } else if (duel.duelResult === "B") {
          bump(a, b, "lost");
          bump(b, a, "won");
        } else {
          bump(a, b, "drawn");
          bump(b, a, "drawn");
        }
      }
    }
    return map;
  }, [matchdays]);

  /* Ejes de la matriz: los que jugaron, en el orden de la tabla */
  const matrixPlayers = useMemo(
    () => rows.filter((row) => row.played > 0).map((row) => row.player),
    [rows],
  );

  const h2hCellClass = (entry) => {
    if (!entry) return "prt-h2h-cell";
    if (entry.won > entry.lost) return "prt-h2h-cell prt-h2h-cell--win";
    if (entry.won < entry.lost) return "prt-h2h-cell prt-h2h-cell--loss";
    return "prt-h2h-cell prt-h2h-cell--draw";
  };

  /* Default: la fecha más reciente desplegada, el resto contraídas */
  const effectiveExpanded =
    expandedMatchdays ??
    new Set(matchdays.length > 0 ? [matchdays[0]._id] : []);

  const toggleMatchday = (matchdayId) => {
    const next = new Set(effectiveExpanded);
    if (next.has(matchdayId)) {
      next.delete(matchdayId);
    } else {
      next.add(matchdayId);
    }
    setExpandedMatchdays(next);
  };

  const isLoading = tournamentsLoading || (Boolean(tournamentId) && standingsLoading);

  return (
    <>
      <ProdeMenu />
      <div className="prt-root">
        <header className="prt-header">
          <span className="prt-eyebrow">
            <span className="prt-eyebrow-dot" />
            Prode
          </span>
          <h1 className="prt-title">Torneo</h1>
        </header>

        {isLoading && <SpinnerOverlay />}

        {!isLoading && tournaments.length === 0 && (
          <div className="prt-state">
            <p className="prt-state-text">
              Todavía no hay torneos del Prode para mostrar.
            </p>
          </div>
        )}

        {!isLoading && isError && (
          <div className="prt-state">
            <p className="prt-state-text">{error?.message}</p>
          </div>
        )}

        {!isLoading && !isError && tournaments.length > 0 && standings && (
          <>
            <div className="prt-controls">
              <select
                className="prt-select"
                value={tournamentId ?? ""}
                onChange={handleTournamentChange}
                aria-label="Elegir torneo"
              >
                <option value={ALL_TIME}>Histórico total</option>
                <option disabled>────────────</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.year}
                    {t.status === "active" ? " · En juego" : ""}
                  </option>
                ))}
              </select>

              {!isAllTime && (
                <div className="prt-pills" role="tablist" aria-label="Período">
                  <button
                    type="button"
                    className={`prt-pill${month === null ? " prt-pill--active" : ""}`}
                    onClick={() => handleMonthChange(null)}
                    title="Tabla acumulada del torneo"
                  >
                    TOT
                  </button>
                  {tournamentMonths.map((m) => {
                    const hasData = availableMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`prt-pill${month === m ? " prt-pill--active" : ""}`}
                        onClick={() => handleMonthChange(m)}
                        disabled={!hasData}
                        title={hasData ? m : `${m} · sin fechas todavía`}
                      >
                        {monthPill(m)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="prt-context">
              <span className="prt-context-main">
                {isAllTime
                  ? "Tabla histórica"
                  : month
                    ? `Tabla de ${month.toLowerCase()}`
                    : "Tabla acumulada"}
              </span>
              <span className="prt-context-meta">
                {isAllTime
                  ? `${
                      standings.tournamentCount === 1
                        ? "1 torneo"
                        : `${standings.tournamentCount} torneos`
                    } · ${
                      matchdayCount === 1
                        ? "1 fecha consolidada"
                        : `${matchdayCount} fechas consolidadas`
                    }`
                  : matchdayCount === 1
                    ? "1 fecha consolidada"
                    : `${matchdayCount} fechas consolidadas`}
              </span>
            </div>

            {matchdayCount === 0 && (
              <div className="prt-state">
                <p className="prt-state-text">
                  {month
                    ? `Todavía no hay fechas consolidadas en ${month.toLowerCase()}.`
                    : isAllTime
                      ? "Todavía no hay fechas consolidadas."
                      : "Todavía no hay fechas consolidadas en este torneo."}
                </p>
              </div>
            )}

            {matchdayCount > 0 && (
              <div className="prt-table-block">
                <div className="prt-table-wrap">
                  <table className="prt-table">
                    <colgroup>
                      <col className="prt-col--name" />
                      <col className="prt-col--stat" />
                      <col className="prt-col--stat" />
                      <col className="prt-col--stat" />
                      <col className="prt-col--stat" />
                      <col className="prt-col--stat" />
                      <col className="prt-col--stat" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="prt-th prt-th--name">Participante</th>
                        <th className="prt-th">PJ</th>
                        <th className="prt-th">G</th>
                        <th className="prt-th">E</th>
                        <th className="prt-th">P</th>
                        <th
                          className="prt-th"
                          title="Bonus por ganar los tres desafíos del duelo"
                        >
                          <span className="prt-bonus-full">Bonus</span>
                          <span className="prt-bonus-short">B</span>
                        </th>
                        <th className="prt-th">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => {
                        const isOrganizer =
                          showMealZone && index === rows.length - 1;
                        /* Los mejores llevan el mismo naranja: el líder en la
                           acumulada, los 4 de la comida en la mensual */
                        const isBest = showMealZone
                          ? index < 4
                          : index === 0 && row.points > 0;
                        const rowClasses = [
                          "prt-tr",
                          isBest ? "prt-row--best" : "",
                          showMealZone && index === 3 ? "prt-row--cut" : "",
                          isOrganizer ? "prt-row--organizer" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        const statCell = (value, extra = "") =>
                          `prt-td${value === 0 ? " prt-td--zero" : ""}${extra}`;
                        return (
                          <tr key={row.player._id} className={rowClasses}>
                            <td className="prt-td prt-td--name">
                              <div className="prt-td-name-inner">
                                <span className="prt-td-pos">
                                  {row.position}
                                </span>
                                <span className="prt-name-text">
                                  {row.player.name}
                                </span>
                              </div>
                            </td>
                            <td className={statCell(row.played)}>
                              {row.played}
                            </td>
                            <td className={statCell(row.won)}>{row.won}</td>
                            <td className={statCell(row.drawn)}>{row.drawn}</td>
                            <td className={statCell(row.lost)}>{row.lost}</td>
                            <td className={statCell(row.bonus)}>{row.bonus}</td>
                            <td className={statCell(row.points, " prt-td--pts")}>
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {showMealZone && (
                  <p className="prt-legend">
                    Los primeros 4 ganan la comida del mes · el último la
                    organiza
                  </p>
                )}
              </div>
            )}

            {/* ── Honores del período: comida del mes sellado ── */}
            {Boolean(month) && matchdayCount > 0 && standings.honors && (
              <div className="prt-honors-card">
                <span className="prt-honors-eyebrow">
                  Comida de {month.toLowerCase()}
                </span>
                <div className="prt-honors-winners">
                  {standings.honors.winners.map((winner, index) => (
                    <div key={winner?._id ?? index} className="prt-honor-cell">
                      <span className="prt-honor-pos">{index + 1}</span>
                      <span className="prt-honor-name">{winner?.name}</span>
                    </div>
                  ))}
                </div>
                {(standings.honors.organizer || standings.honors.note) && (
                  <div className="prt-honors-footer">
                    {standings.honors.organizer && (
                      <span className="prt-honors-org">
                        Organiza:{" "}
                        <span className="prt-honors-org-name">
                          {standings.honors.organizer.name}
                        </span>
                      </span>
                    )}
                    {standings.honors.note && (
                      <p className="prt-honors-note">{standings.honors.note}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Honores del torneo: campeón y último (torneo finalizado) ── */}
            {!month && !isAllTime && standings.honors && (
              <div className="prt-honors-card">
                {standings.honors.champion && (
                  <div className="prt-honors-champion">
                    <span className="prt-honors-eyebrow">
                      Campeón del torneo
                    </span>
                    <span className="prt-honors-champion-name">
                      {standings.honors.champion.name}
                    </span>
                  </div>
                )}
                {standings.honors.lastPlace && (
                  <span className="prt-honors-org">
                    Último:{" "}
                    <span className="prt-honors-org-name">
                      {standings.honors.lastPlace.name}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* ── Puntos por desafío ── */}
            {matchdayCount > 0 && (
              <section className="prt-section">
                <div className="prt-section-head">
                  <h2 className="prt-section-title">Puntos por desafío</h2>
                  <span className="prt-section-hint">
                    Tocá una columna para ordenar
                  </span>
                </div>
                <div className="prt-table-wrap">
                  <table className="prt-table">
                    <colgroup>
                      <col className="prt-col--name" />
                      {BREAKDOWN_COLUMNS.map((col) => (
                        <col key={col.key} className="prt-col--stat" />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="prt-th prt-th--name">Participante</th>
                        {BREAKDOWN_COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            className={`prt-th prt-th--sortable${
                              breakdownSort === col.key
                                ? " prt-th--active"
                                : ""
                            }`}
                            title={col.title}
                            onClick={() => setBreakdownSort(col.key)}
                          >
                            <span>{col.label}</span>
                            <span className="prt-sort-icon">▼</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownRows.map((row) => (
                        <tr key={row.player._id} className="prt-tr">
                          <td className="prt-td prt-td--name">
                            <div className="prt-td-name-inner">
                              <span className="prt-name-text">
                                {row.player.name}
                              </span>
                            </div>
                          </td>
                          {BREAKDOWN_COLUMNS.map((col) => {
                            const isActive = breakdownSort === col.key;
                            const display =
                              col.key === "efficiency"
                                ? formatEfficiency(row.efficiency)
                                : row.challenges[col.key];
                            const isZero =
                              col.key === "efficiency"
                                ? row.efficiency === null
                                : row.challenges[col.key] === 0;
                            return (
                              <td
                                key={col.key}
                                className={`prt-td${
                                  isActive ? " prt-td--sorted" : ""
                                }${isZero ? " prt-td--zero" : ""}`}
                              >
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── H2H del período: matriz N×N de cruces (no aplica al
                  histórico total — usa los duelos del payload del torneo) ── */}
            {!isAllTime && matchdays.length > 0 && matrixPlayers.length > 1 && (
              <section className="prt-section">
                <div className="prt-section-head">
                  <h2 className="prt-section-title">H2H del período</h2>
                  <span className="prt-section-hint">
                    Cada fila se lee contra cada rival
                  </span>
                </div>
                <div className="prt-h2h-wrap">
                  <table className="prt-h2h-table">
                    <thead>
                      <tr>
                        <th className="prt-h2h-corner" aria-hidden="true" />
                        {matrixPlayers.map((player) => (
                          <th
                            key={player._id}
                            className="prt-h2h-colhead"
                            title={player.name}
                          >
                            {player.name.slice(0, 3).toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixPlayers.map((rowPlayer) => (
                        <tr key={rowPlayer._id}>
                          <th
                            className="prt-h2h-rowhead"
                            title={rowPlayer.name}
                          >
                            {rowPlayer.name}
                          </th>
                          {matrixPlayers.map((colPlayer) => {
                            if (
                              String(rowPlayer._id) === String(colPlayer._id)
                            ) {
                              return (
                                <td
                                  key={colPlayer._id}
                                  className="prt-h2h-cell prt-h2h-cell--self"
                                  aria-hidden="true"
                                />
                              );
                            }
                            const entry = h2hByPair.get(
                              `${rowPlayer._id}|${colPlayer._id}`,
                            );
                            return (
                              <td
                                key={colPlayer._id}
                                className={h2hCellClass(entry)}
                                title={
                                  entry
                                    ? `${rowPlayer.name} ${entry.won}-${entry.drawn}-${entry.lost} vs ${colPlayer.name}`
                                    : `${rowPlayer.name} y ${colPlayer.name} no se cruzaron`
                                }
                              >
                                {entry
                                  ? `${entry.won}-${entry.drawn}-${entry.lost}`
                                  : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Duelos del período (no aplica al histórico total) ── */}
            {!isAllTime && matchdays.length > 0 && (
              <section className="prt-section">
                <div className="prt-section-head">
                  <h2 className="prt-section-title">Duelos del período</h2>
                </div>
                <div className="prt-md-list">
                  {matchdays.map((md) => {
                    const isOpen = effectiveExpanded.has(md._id);
                    return (
                      <div key={md._id} className="prt-md-card">
                        <button
                          type="button"
                          className="prt-md-head"
                          onClick={() => toggleMatchday(md._id)}
                          aria-expanded={isOpen}
                        >
                          <span className="prt-md-title">
                            Fecha {md.roundNumber}
                          </span>
                          <span className="prt-md-meta">{md.month}</span>
                          <span
                            className={`prt-md-chevron${
                              isOpen ? " prt-md-chevron--open" : ""
                            }`}
                          >
                            ▾
                          </span>
                        </button>
                        {isOpen && (
                          <div className="prt-md-body">
                            {md.duels.map((duel, duelIndex) => {
                              const pointsA =
                                (duel.points.playerA ?? 0) +
                                (duel.points.bonusA ?? 0);
                              const pointsB =
                                (duel.points.playerB ?? 0) +
                                (duel.points.bonusB ?? 0);
                              const hasBonus =
                                (duel.points.bonusA ?? 0) +
                                  (duel.points.bonusB ?? 0) >
                                0;
                              return (
                                <div key={duelIndex} className="prt-duel">
                                  <div className="prt-duel-main">
                                    <span
                                      className={`prt-duel-name prt-duel-name--a${
                                        duel.duelResult === "A"
                                          ? " prt-duel-name--win"
                                          : ""
                                      }`}
                                    >
                                      {duel.playerA.name}
                                    </span>
                                    <span className="prt-duel-center">
                                      <span className="prt-duel-score">
                                        {pointsA} – {pointsB}
                                      </span>
                                      {hasBonus && (
                                        <span className="prt-duel-bonus">
                                          bonus
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`prt-duel-name prt-duel-name--b${
                                        duel.duelResult === "B"
                                          ? " prt-duel-name--win"
                                          : ""
                                      }`}
                                    >
                                      {duel.playerB.name}
                                    </span>
                                  </div>
                                  <div className="prt-duel-challenges">
                                    {duel.challenges.map((challenge) => (
                                      <span
                                        key={challenge.type}
                                        className="prt-duel-challenge"
                                      >
                                        <span className="prt-duel-challenge-label">
                                          {CHALLENGE_LABELS[challenge.type] ??
                                            challenge.type}
                                        </span>{" "}
                                        {challenge.scoreA ?? 0}–
                                        {challenge.scoreB ?? 0}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {isParticipant && md.hasItems && (
                              <Link
                                to={`/prode/fecha/${md._id}`}
                                className="prt-md-link"
                              >
                                Ver fecha →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ProdeTorneo;
