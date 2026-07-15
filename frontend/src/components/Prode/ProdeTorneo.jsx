// Import React dependencies
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeTorneoStyles.css";

//Import components
import ProdeMenu from "./ProdeMenu";
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchAllProdeTournaments from "../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeTournamentStandings from "../../reactquery/prode/fetchProdeTournamentStandings";
import fetchProdeAllTimeStandings from "../../reactquery/prode/fetchProdeAllTimeStandings";

const monthPill = (month) => month.slice(0, 3).toUpperCase();

/* Valor especial del selector: todos los torneos sumados */
const ALL_TIME = "all";

/* Pestaña Torneo: tabla de posiciones acumulada o por mes (Etapa 3.3).
   Los módulos de desglose por desafío, honores y duelos llegan en 3.4/3.5 */
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

  const handleTournamentChange = (event) => {
    setTouchedTournamentId(event.target.value);
    setMonth(null);
  };

  const rows = standings?.standings ?? [];
  const availableMonths = standings?.availableMonths ?? [];
  const tournamentMonths = standings?.tournament?.months ?? [];
  const matchdayCount = standings?.matchdayCount ?? 0;

  /* Zona de comida: solo en vista mensual y con tabla real (>4 filas) */
  const showMealZone = Boolean(month) && rows.length > 4;

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
                <option disabled>────────────────────────────</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                    {t.status === "active" ? " · En juego" : ""}
                  </option>
                ))}
              </select>

              {!isAllTime && (
                <div className="prt-pills" role="tablist" aria-label="Período">
                  <button
                    type="button"
                    className={`prt-pill${month === null ? " prt-pill--active" : ""}`}
                    onClick={() => setMonth(null)}
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
                        onClick={() => setMonth(m)}
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
                  : `${standings.tournament.name} · ${
                      matchdayCount === 1
                        ? "1 fecha consolidada"
                        : `${matchdayCount} fechas consolidadas`
                    }`}
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
                                {isOrganizer && (
                                  <span className="prt-org-tag">organiza</span>
                                )}
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
          </>
        )}
      </div>
    </>
  );
};

export default ProdeTorneo;
