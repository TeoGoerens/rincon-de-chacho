// Import React dependencies
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeH2HStyles.css";
import { getUserId } from "../../reactquery/getUserInformation";

//Import components
import ProdeMenu from "./ProdeMenu";
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeAllTimeStandings from "../../reactquery/prode/fetchProdeAllTimeStandings";
import fetchProdeH2H from "../../reactquery/prode/fetchProdeH2H";
import fetchMyProdePlayer from "../../reactquery/prode/fetchMyProdePlayer";

const CHALLENGE_ROWS = [
  { key: "arg", label: "Prode Argentina", short: "ARG", unit: "pts" },
  { key: "misc", label: "Prode Resto del Mundo", short: "RESTO", unit: "pts" },
  { key: "gdt", label: "Gran DT", short: "GDT", unit: "mini-duelos" },
];

/* Cantidad de cruces visibles antes del "Ver más" */
const VISIBLE_CROSSES = 10;

const streakLength = (length) =>
  length === 1 ? "1 cruce" : `${length} cruces`;

/* Misma regla que el resto del sitio: foto de perfil propia si hay una
   cargada (las default de pixabay no cuentan), inicial si no */
const hasCustomPhoto = (pic) => pic && !pic.includes("pixabay.com");
const initialOf = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const renderAvatar = (player) => {
  const withPhoto = hasCustomPhoto(player?.avatar);
  return (
    <span className={`prh-avatar${withPhoto ? " prh-avatar--photo" : ""}`}>
      {withPhoto ? (
        <img src={player.avatar} alt={player.name} />
      ) : (
        initialOf(player?.name)
      )}
    </span>
  );
};

/* Palmarés individual (no es head-to-head): en las filas "negativas" el
   número más alto se pinta en rojo en vez de naranja */
const PALMARES_ROWS = [
  { key: "championships", label: "Campeonatos", negative: false },
  { key: "tournamentLastPlaces", label: "Últimos de torneo", negative: true },
  { key: "meals", label: "Comidas ganadas", negative: false },
  { key: "organized", label: "Comidas organizadas", negative: true },
];

/* Pestaña H2H: historial directo entre dos participantes (3.11). Todo el
   contenido se expresa desde la perspectiva del participante A elegido */
const ProdeH2H = () => {
  /* Lista de participantes históricos (los que jugaron al menos una fecha) —
     misma queryKey que usa la pestaña Torneo para el histórico total */
  const { data: allTime, isLoading: allTimeLoading } = useQuery({
    queryKey: ["prode-tournament-standings", "all", null],
    queryFn: fetchProdeAllTimeStandings,
  });

  /* Solo para pre-cargar el selector A y mostrar los links "Ver fecha" */
  const { data: myPlayer } = useQuery({
    queryKey: ["prode-my-player", getUserId()],
    queryFn: fetchMyProdePlayer,
  });

  const players = useMemo(
    () => (allTime?.standings ?? []).map((row) => row.player),
    [allTime],
  );

  /* Patrón touched: el default sigue a los datos hasta elección explícita */
  const [touchedA, setTouchedA] = useState(null);
  const [touchedB, setTouchedB] = useState(null);
  const [showAllCrosses, setShowAllCrosses] = useState(false);

  const myPlayerInList = Boolean(
    myPlayer && players.some((p) => String(p._id) === String(myPlayer._id)),
  );
  const defaultA = myPlayerInList
    ? String(myPlayer._id)
    : players[0]
      ? String(players[0]._id)
      : null;
  const playerAId = touchedA ?? defaultA;
  const defaultB =
    players.find((p) => String(p._id) !== String(playerAId)) ?? null;
  const playerBId = touchedB ?? (defaultB ? String(defaultB._id) : null);

  const bothChosen = Boolean(
    playerAId && playerBId && playerAId !== playerBId,
  );

  const {
    data: h2h,
    isLoading: h2hLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-h2h", playerAId, playerBId],
    queryFn: () => fetchProdeH2H(playerAId, playerBId),
    enabled: bothChosen,
  });

  const handleChangeA = (event) => {
    setTouchedA(event.target.value);
    setShowAllCrosses(false);
  };
  const handleChangeB = (event) => {
    setTouchedB(event.target.value);
    setShowAllCrosses(false);
  };

  const summary = h2h?.summary ?? null;
  const nameA = h2h?.playerA?.name ?? "";
  const nameB = h2h?.playerB?.name ?? "";
  const nameOf = (side) => (side === "A" ? nameA : nameB);

  /* El que mira es parte del cruce → puede abrir el tablero de la fecha */
  const viewerInPair = Boolean(
    myPlayer &&
      [playerAId, playerBId].includes(String(myPlayer._id)),
  );

  const crosses = h2h?.crosses ?? [];
  const visibleCrosses = showAllCrosses
    ? crosses
    : crosses.slice(0, VISIBLE_CROSSES);

  const verdict =
    summary && summary.crosses > 0
      ? summary.winsA > summary.winsB
        ? { text: `Domina ${nameA}`, side: "A" }
        : summary.winsB > summary.winsA
          ? { text: `Domina ${nameB}`, side: "B" }
          : { text: "Historial parejo", side: null }
      : null;

  const isLoading = allTimeLoading || (bothChosen && h2hLoading);

  return (
    <>
      <ProdeMenu />
      <div className="prh-root">
        <header className="prh-header">
          <span className="prh-eyebrow">
            <span className="prh-eyebrow-dot" />
            Prode
          </span>
          <h1 className="prh-title">H2H</h1>
        </header>

        {isLoading && <SpinnerOverlay />}

        {!isLoading && players.length < 2 && (
          <div className="prh-state">
            <p className="prh-state-text">
              Todavía no hay suficientes participantes con fechas jugadas para
              armar un head to head.
            </p>
          </div>
        )}

        {!isLoading && players.length >= 2 && (
          <>
            <div className="prh-controls">
              <select
                className="prh-select"
                value={playerAId ?? ""}
                onChange={handleChangeA}
                aria-label="Elegir participante A"
              >
                {players
                  .filter((p) => String(p._id) !== String(playerBId))
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <span className="prh-vs">vs</span>
              <select
                className="prh-select"
                value={playerBId ?? ""}
                onChange={handleChangeB}
                aria-label="Elegir participante B"
              >
                {players
                  .filter((p) => String(p._id) !== String(playerAId))
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {isError && (
              <div className="prh-state">
                <p className="prh-state-text">{error?.message}</p>
              </div>
            )}

            {!isError && h2h && summary?.crosses === 0 && (
              <div className="prh-state">
                <p className="prh-state-text">
                  {nameA} y {nameB} todavía no se enfrentaron en ningún duelo.
                </p>
              </div>
            )}

            {!isError && h2h && summary?.crosses > 0 && (
              <>
                {/* ── Hero cara a cara ── */}
                <section className="prh-hero">
                  <span className="prh-hero-vs" aria-hidden="true">
                    VS
                  </span>
                  <div className="prh-hero-main">
                    <div className="prh-hero-side">
                      {renderAvatar(h2h.playerA)}
                      <span className="prh-hero-name">{nameA}</span>
                    </div>
                    <div className="prh-hero-center">
                      <span className="prh-hero-score">
                        {summary.winsA}
                        <span className="prh-hero-sep">–</span>
                        {summary.draws}
                        <span className="prh-hero-sep">–</span>
                        {summary.winsB}
                      </span>
                      <span className="prh-hero-caption">
                        victorias · empates · victorias
                      </span>
                    </div>
                    <div className="prh-hero-side">
                      {renderAvatar(h2h.playerB)}
                      <span className="prh-hero-name">{nameB}</span>
                    </div>
                  </div>
                  <div className="prh-hero-chips">
                    <span className="prh-hero-chip">
                      <strong>{summary.crosses}</strong>{" "}
                      {summary.crosses === 1 ? "cruce" : "cruces"}
                    </span>
                    {summary.since && (
                      <span className="prh-hero-chip">
                        desde <strong>{summary.since}</strong>
                      </span>
                    )}
                    <span className="prh-hero-chip">
                      puntos de duelo{" "}
                      <strong>
                        {summary.pointsA}–{summary.pointsB}
                      </strong>
                    </span>
                  </div>
                  {verdict && (
                    <span
                      className={`prh-verdict${
                        verdict.side ? " prh-verdict--dominant" : ""
                      }`}
                    >
                      {verdict.text}
                    </span>
                  )}
                </section>

                {/* ── Bento: balance / palmarés / rachas / momentos ── */}
                <div className="prh-duo">
                  <section className="prh-section">
                    <div className="prh-section-head">
                      <h2 className="prh-section-title">
                        Balance por desafío
                      </h2>
                    </div>
                    <div className="prh-card">
                      {CHALLENGE_ROWS.map((row) => {
                        const balance = h2h.challenges?.[row.key];
                        const hasData = balance && balance.played > 0;
                        return (
                          <div key={row.key} className="prh-ch-row">
                            <span className="prh-ch-label">{row.label}</span>
                            {hasData ? (
                              <span className="prh-ch-values">
                                <span className="prh-ch-record">
                                  <span
                                    className={`prh-ch-num${
                                      balance.winsA > balance.winsB
                                        ? " prh-ch-num--lead"
                                        : ""
                                    }`}
                                  >
                                    {balance.winsA}
                                  </span>
                                  <span className="prh-ch-sep">–</span>
                                  <span className="prh-ch-num">
                                    {balance.draws}
                                  </span>
                                  <span className="prh-ch-sep">–</span>
                                  <span
                                    className={`prh-ch-num${
                                      balance.winsB > balance.winsA
                                        ? " prh-ch-num--lead"
                                        : ""
                                    }`}
                                  >
                                    {balance.winsB}
                                  </span>
                                </span>
                                <span className="prh-ch-points">
                                  {balance.pointsA}–{balance.pointsB}{" "}
                                  {row.unit}
                                </span>
                              </span>
                            ) : (
                              <span className="prh-ch-empty">Sin datos</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="prh-section">
                    <div className="prh-section-head">
                      <h2 className="prh-section-title">Palmarés</h2>
                    </div>
                    <div className="prh-card">
                      {PALMARES_ROWS.map((row) => {
                        const valueA = h2h.honors?.a?.[row.key] ?? 0;
                        const valueB = h2h.honors?.b?.[row.key] ?? 0;
                        const highlight = (mine, other) =>
                          mine > other
                            ? row.negative
                              ? " prh-pal-value--worse"
                              : " prh-pal-value--better"
                            : "";
                        return (
                          <div key={row.key} className="prh-pal-row">
                            <span
                              className={`prh-pal-value prh-pal-value--a${highlight(
                                valueA,
                                valueB,
                              )}`}
                            >
                              {valueA}
                            </span>
                            <span className="prh-pal-label">{row.label}</span>
                            <span
                              className={`prh-pal-value prh-pal-value--b${highlight(
                                valueB,
                                valueA,
                              )}`}
                            >
                              {valueB}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="prh-section">
                    <div className="prh-section-head">
                      <h2 className="prh-section-title">Rachas del cruce</h2>
                    </div>
                    <div className="prh-card">
                      <div className="prh-forma-strip">
                        <span className="prh-forma-label">
                          Últimos cruces
                        </span>
                        <div
                          className="prh-forma-pills"
                          title={`Resultados de ${nameA}: el más reciente a la izquierda`}
                        >
                          {crosses.slice(0, 5).map((cross, index) => {
                            const type =
                              cross.outcome === "W"
                                ? "win"
                                : cross.outcome === "D"
                                  ? "draw"
                                  : "defeat";
                            return (
                              <span
                                key={index}
                                className={`prh-forma-pill prh-forma-pill--${type}${
                                  index === 0
                                    ? " prh-forma-pill--latest"
                                    : ""
                                }`}
                              >
                                {cross.outcome === "W"
                                  ? "G"
                                  : cross.outcome === "D"
                                    ? "E"
                                    : "P"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="prh-best-grid">
                        {[
                          { best: h2h.streaks?.bestA, name: nameA },
                          { best: h2h.streaks?.bestB, name: nameB },
                        ].map(({ best, name }) => (
                          <div key={name} className="prh-best-cell">
                            <span className="prh-best-label">
                              Mejor racha de {name}
                            </span>
                            {best ? (
                              <>
                                <span className="prh-best-value">
                                  {streakLength(best.length)}
                                </span>
                                <span className="prh-best-context">
                                  {best.context}
                                </span>
                              </>
                            ) : (
                              <span className="prh-best-empty">
                                Nunca le ganó
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="prh-section">
                    <div className="prh-section-head">
                      <h2 className="prh-section-title">
                        Momentos del cruce
                      </h2>
                    </div>
                    <div className="prh-card">
                      {[
                        {
                          label: "Mayor paliza en la suma de prodes",
                          moment: h2h.moments?.biggestProdeMargin,
                        },
                        {
                          label: "Mayor paliza en el Gran DT",
                          moment: h2h.moments?.biggestGdtMargin,
                        },
                      ].map(({ label, moment }) => (
                        <div key={label} className="prh-kv-row">
                          <span className="prh-kv-label">{label}</span>
                          {moment ? (
                            <span className="prh-kv-value">
                              <span className="prh-kv-name">
                                {nameOf(moment.winner)}
                              </span>
                              <span className="prh-kv-score">
                                {moment.winnerScore}–{moment.loserScore}
                              </span>
                              <span className="prh-kv-context">
                                {moment.context}
                              </span>
                            </span>
                          ) : (
                            <span className="prh-kv-empty">Sin datos</span>
                          )}
                        </div>
                      ))}
                      <div className="prh-kv-row">
                        <span className="prh-kv-label">
                          Duelos ganados con bonus
                        </span>
                        <span className="prh-kv-value">
                          <span className="prh-kv-name">{nameA}</span>
                          <span className="prh-kv-score">
                            {h2h.moments?.bonusWinsA ?? 0}
                          </span>
                          <span className="prh-kv-name">{nameB}</span>
                          <span className="prh-kv-score">
                            {h2h.moments?.bonusWinsB ?? 0}
                          </span>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* ── Historial de cruces ── */}
                <section className="prh-section prh-section--history">
                  <div className="prh-section-head">
                    <h2 className="prh-section-title">Historial de cruces</h2>
                    <span className="prh-section-hint">
                      Más reciente primero
                    </span>
                  </div>
                  <div className="prh-cross-list">
                    {visibleCrosses.map((cross, index) => (
                      <article
                        key={`${cross.matchdayId}-${index}`}
                        className="prh-cross"
                      >
                        <span className="prh-cross-meta">
                          Fecha {cross.roundNumber} · {cross.tournamentName}
                        </span>
                        <div className="prh-cross-main">
                          <span
                            className={`prh-cross-name prh-cross-name--a${
                              cross.outcome === "W"
                                ? " prh-cross-name--win"
                                : ""
                            }`}
                          >
                            {nameA}
                          </span>
                          <span className="prh-cross-score">
                            {cross.pointsA} – {cross.pointsB}
                          </span>
                          <span
                            className={`prh-cross-name prh-cross-name--b${
                              cross.outcome === "L"
                                ? " prh-cross-name--win"
                                : ""
                            }`}
                          >
                            {nameB}
                          </span>
                        </div>
                        {/* Slots fijos: si el concepto no aplica, el
                            espacio queda vacío y la fila no cambia */}
                        <span className="prh-cross-bonus">
                          {cross.bonusA || cross.bonusB ? "bonus" : ""}
                        </span>
                        <div className="prh-cross-challenges">
                          {CHALLENGE_ROWS.map((row) => {
                            const scores = cross.challenges?.[row.key];
                            return (
                              <span
                                key={row.key}
                                className="prh-cross-challenge"
                              >
                                {scores ? (
                                  <>
                                    <span className="prh-cross-challenge-label">
                                      {row.short}
                                    </span>{" "}
                                    {scores.a}–{scores.b}
                                  </>
                                ) : (
                                  ""
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <span className="prh-cross-action">
                          {viewerInPair && cross.hasItems ? (
                            <Link
                              to={`/prode/fecha/${cross.matchdayId}`}
                              className="prh-cross-link"
                            >
                              Ver fecha →
                            </Link>
                          ) : (
                            ""
                          )}
                        </span>
                      </article>
                    ))}
                  </div>
                  {!showAllCrosses && crosses.length > VISIBLE_CROSSES && (
                    <button
                      type="button"
                      className="prh-more-btn"
                      onClick={() => setShowAllCrosses(true)}
                    >
                      Ver los {crosses.length} cruces
                    </button>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ProdeH2H;
