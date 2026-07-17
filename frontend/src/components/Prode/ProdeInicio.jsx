// Import React dependencies
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeInicioStyles.css";
import { getUserId } from "../../reactquery/getUserInformation";

//Import components
import ProdeMenu from "./ProdeMenu";
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchAllProdeTournaments from "../../reactquery/prode/fetchAllProdeTournaments";
import fetchMyProdePlayer from "../../reactquery/prode/fetchMyProdePlayer";
import fetchProdeMatchdaysByTournament from "../../reactquery/prode/fetchProdeMatchdaysByTournament";
import fetchGdtUniversesByTournament from "../../reactquery/prode/fetchGdtUniversesByTournament";
import fetchProdeTournamentStandings from "../../reactquery/prode/fetchProdeTournamentStandings";
import fetchProdeAllTimeStandings from "../../reactquery/prode/fetchProdeAllTimeStandings";
import fetchMyProdePrediction from "../../reactquery/prode/fetchMyProdePrediction";
import fetchProdeMatchdayPartials from "../../reactquery/prode/fetchProdeMatchdayPartials";

const toId = (value) => String(value?._id ?? value);

const formatDeadline = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const weekday = date.toLocaleDateString("es-AR", { weekday: "short" });
  const dayMonth = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${weekday} ${dayMonth} · ${time}`;
};

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

/* Pestaña Inicio del Prode (3.7): el vestíbulo de la sección. Recortes con
   CTA, nunca el dato completo — pendientes de acción, la fecha en curso,
   accesos GDT (puertas adentro) y el recorte de la tabla. */
const ProdeInicio = () => {
  const userId = getUserId();

  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const { data: myPlayer, isLoading: myPlayerLoading } = useQuery({
    queryKey: ["prode-my-player", userId],
    queryFn: fetchMyProdePlayer,
  });

  const activeTournament = useMemo(
    () => (tournamentsData ?? []).find((t) => t.status === "active") ?? null,
    [tournamentsData],
  );

  const isParticipant = useMemo(() => {
    if (!myPlayer || !activeTournament) return false;
    return (activeTournament.participants ?? []).some(
      (p) => toId(p) === String(myPlayer._id),
    );
  }, [myPlayer, activeTournament]);

  /* La lista de fechas es visible para todo logueado: el espectador también
     ve qué fecha está en curso (sin picks, regla canónica) */
  const { data: matchdaysData, isLoading: matchdaysLoading } = useQuery({
    queryKey: ["prode-matchdays", activeTournament?._id],
    queryFn: () => fetchProdeMatchdaysByTournament(activeTournament._id),
    enabled: Boolean(activeTournament),
  });

  const { data: gdtUniversesData, isLoading: gdtUniversesLoading } = useQuery({
    queryKey: ["gdt-universes", activeTournament?._id],
    queryFn: () => fetchGdtUniversesByTournament(activeTournament._id),
    enabled: Boolean(activeTournament) && isParticipant,
  });

  /* Recorte de tabla: la del torneo activo, o el histórico total si no hay
     torneo en juego (la sección nunca queda muerta) */
  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: activeTournament
      ? ["prode-tournament-standings", activeTournament._id, null]
      : ["prode-tournament-standings", "all", null],
    queryFn: () =>
      activeTournament
        ? fetchProdeTournamentStandings(activeTournament._id, null)
        : fetchProdeAllTimeStandings(),
    enabled: !tournamentsLoading,
  });

  /* ── Selección de fechas ── */
  const matchdays = useMemo(() => matchdaysData ?? [], [matchdaysData]);

  const inPlayMatchday = useMemo(
    () =>
      matchdays
        .filter((m) => m.phase === "in_play")
        .sort((a, b) => b.roundNumber - a.roundNumber)[0] ?? null,
    [matchdays],
  );

  const openMatchday = useMemo(
    () =>
      matchdays
        .filter((m) => m.phase === "open")
        .sort(
          (a, b) =>
            new Date(a.predictionsDeadline) - new Date(b.predictionsDeadline),
        )[0] ?? null,
    [matchdays],
  );

  const lastConsolidated = useMemo(
    () =>
      matchdays
        .filter((m) => m.phase === "consolidated" && (m.items?.length ?? 0) > 0)
        .sort((a, b) => b.roundNumber - a.roundNumber)[0] ?? null,
    [matchdays],
  );

  /* La fecha protagonista: en juego > abierta > última consolidada */
  const currentMatchday = inPlayMatchday ?? openMatchday ?? lastConsolidated;

  /* Mi pronóstico de la fecha abierta (completitud) */
  const { data: myPrediction, isLoading: myPredictionLoading } = useQuery({
    queryKey: ["prode-my-prediction", openMatchday?._id, userId],
    queryFn: () => fetchMyProdePrediction(openMatchday._id),
    enabled: Boolean(openMatchday) && isParticipant,
  });

  /* Parciales de la fecha en juego (mi duelo en vivo) */
  const { data: partials, isLoading: partialsLoading } = useQuery({
    queryKey: ["prode-matchday-partials", inPlayMatchday?._id],
    queryFn: () => fetchProdeMatchdayPartials(inPlayMatchday._id),
    enabled: Boolean(inPlayMatchday) && isParticipant,
  });

  /* ── Nombres de participantes (tabla + torneo activo) ── */
  const nameById = useMemo(() => {
    const map = new Map();
    for (const p of activeTournament?.participants ?? []) {
      if (p?._id && p?.name) map.set(String(p._id), p.name);
    }
    for (const row of standingsData?.standings ?? []) {
      map.set(String(row.player._id), row.player.name);
    }
    return map;
  }, [activeTournament, standingsData]);

  /* ── Pendientes de acción (participante) ── */
  const totalItems = openMatchday?.items?.length ?? 0;
  const doneItems = myPrediction?.picks?.length ?? 0;
  const missingItems = Math.max(0, totalItems - doneItems);

  const reopenedForMe = useMemo(
    () =>
      matchdays.filter(
        (m) =>
          m.phase === "in_play" &&
          Boolean(myPlayer) &&
          (m.reopenedFor ?? []).map(toId).includes(String(myPlayer._id)),
      ),
    [matchdays, myPlayer],
  );

  const activeDrafts = useMemo(
    () =>
      (gdtUniversesData ?? []).filter((universe) =>
        ["open", "revealed", "resolving"].includes(universe.draftStatus),
      ),
    [gdtUniversesData],
  );

  const activeWindows = useMemo(
    () =>
      (gdtUniversesData ?? [])
        .map((universe) => ({
          universe,
          window:
            (universe.changeWindows ?? []).find(
              (item) => item.status !== "final",
            ) ?? null,
        }))
        .filter((item) => item.window),
    [gdtUniversesData],
  );

  const pendings = useMemo(() => {
    const list = [];
    for (const matchday of reopenedForMe) {
      list.push({
        key: `reopened-${matchday._id}`,
        to: `/prode/fecha/${matchday._id}`,
        title: `Fecha ${matchday.roundNumber} · te reabrieron la carga`,
        caption: "El admin te está esperando: cargá y cerrá tu pronóstico",
        cta: "Cargar pronósticos",
        highlight: true,
      });
    }
    if (openMatchday && !myPredictionLoading && missingItems > 0) {
      list.push({
        key: `open-${openMatchday._id}`,
        to: `/prode/fecha/${openMatchday._id}`,
        title: `Fecha ${openMatchday.roundNumber} · ${
          doneItems === 0
            ? "todavía no cargaste nada"
            : `te falta${missingItems === 1 ? "" : "n"} ${missingItems} ítem${
                missingItems === 1 ? "" : "s"
              }`
        }`,
        caption: `Cierra el ${formatDeadline(openMatchday.predictionsDeadline)}`,
        cta: doneItems === 0 ? "Cargar pronósticos" : "Completar",
        highlight: false,
      });
    }
    for (const universe of activeDrafts) {
      list.push({
        key: `draft-${universe._id}`,
        to: `/prode/gdt/${universe._id}`,
        title: `Draft del Gran DT · ${universe.label}`,
        caption:
          universe.draftStatus === "open"
            ? `Armá tu equipo antes del ${formatDeadline(universe.draftDeadline)}`
            : "Planteles revelados · mirá las quemas",
        cta: universe.draftStatus === "open" ? "Armar mi equipo" : "Ver planteles",
        highlight: false,
      });
    }
    for (const { universe, window: win } of activeWindows) {
      list.push({
        key: `window-${universe._id}`,
        to: `/prode/gdt/${universe._id}`,
        title: `Ventana de cambios de ${win.month} · ${universe.label}`,
        caption:
          win.status === "open"
            ? `Hasta 2 cambios antes del ${formatDeadline(win.deadline)} (o confirmá sin cambios)`
            : "Ronda de la ventana en curso · re-elecciones por quemas",
        cta: win.status === "open" ? "Hacer mis cambios" : "Ver la ronda",
        highlight: false,
      });
    }
    return list;
  }, [
    reopenedForMe,
    openMatchday,
    myPredictionLoading,
    missingItems,
    doneItems,
    activeDrafts,
    activeWindows,
  ]);

  /* ── Mi duelo en vivo (fecha en juego) ── */
  const myDuelPartial = useMemo(() => {
    if (!partials || !myPlayer) return null;
    return (
      (partials.duels ?? []).find(
        (duel) =>
          duel.playerA === String(myPlayer._id) ||
          duel.playerB === String(myPlayer._id),
      ) ?? null
    );
  }, [partials, myPlayer]);
  const iAmSideA = myDuelPartial?.playerA === String(myPlayer?._id);

  const myGdtDuel = useMemo(() => {
    if (!partials || !myPlayer) return null;
    return (
      (partials.gdt?.duels ?? []).find(
        (duel) =>
          duel.playerA === String(myPlayer._id) ||
          duel.playerB === String(myPlayer._id),
      ) ?? null
    );
  }, [partials, myPlayer]);
  const iAmGdtA = myGdtDuel?.playerA === String(myPlayer?._id);

  const rivalId = myDuelPartial
    ? iAmSideA
      ? myDuelPartial.playerB
      : myDuelPartial.playerA
    : null;

  /* ── Mi resultado en la última consolidada ── */
  const consolidatedDuels = useMemo(() => {
    if (!currentMatchday || currentMatchday.phase !== "consolidated")
      return null;
    return (
      (standingsData?.matchdays ?? []).find(
        (md) => String(md._id) === String(currentMatchday._id),
      )?.duels ?? null
    );
  }, [currentMatchday, standingsData]);

  const myConsolidatedDuel = useMemo(() => {
    if (!consolidatedDuels || !myPlayer) return null;
    return (
      consolidatedDuels.find(
        (duel) =>
          toId(duel.playerA) === String(myPlayer._id) ||
          toId(duel.playerB) === String(myPlayer._id),
      ) ?? null
    );
  }, [consolidatedDuels, myPlayer]);

  /* ── Recorte de tabla: top 3 + mi fila si estoy afuera ── */
  const standingsRows = standingsData?.standings ?? [];
  const topRows = standingsRows.slice(0, 3);
  const myRow =
    isParticipant && myPlayer
      ? (standingsRows.find(
          (row) => String(row.player._id) === String(myPlayer._id),
        ) ?? null)
      : null;
  const myRowOutsideTop = myRow && myRow.position > 3 ? myRow : null;

  const isLoading =
    tournamentsLoading ||
    myPlayerLoading ||
    (Boolean(activeTournament) && matchdaysLoading) ||
    standingsLoading ||
    (Boolean(activeTournament) && isParticipant && gdtUniversesLoading) ||
    (Boolean(openMatchday) && isParticipant && myPredictionLoading) ||
    (Boolean(inPlayMatchday) && isParticipant && partialsLoading);

  /* ── Render de la fecha en curso según fase y usuario ── */
  const renderCurrentMatchday = () => {
    if (!currentMatchday) {
      return (
        <div className="pin-card pin-card--empty">
          <p className="pin-empty-text">
            El torneo arranca pronto: cuando el admin abra la primera fecha te
            va a llegar un mail.
          </p>
        </div>
      );
    }

    const phase = currentMatchday.phase;

    if (phase === "open") {
      if (!isParticipant) {
        return (
          <div className="pin-card">
            <div className="pin-card-head">
              <span className="pin-card-title">
                Fecha {currentMatchday.roundNumber} · abierta
              </span>
              <span className="pin-status-dot pin-status-dot--open" />
            </div>
            <p className="pin-card-caption">
              Los participantes cargan sus pronósticos hasta el{" "}
              {formatDeadline(currentMatchday.predictionsDeadline)}.
            </p>
          </div>
        );
      }
      const progressPct =
        totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
      return (
        <div className="pin-card">
          <div className="pin-card-head">
            <span className="pin-card-title">
              Fecha {currentMatchday.roundNumber} · abierta
            </span>
            <span className="pin-card-meta">
              Cierra el {formatDeadline(currentMatchday.predictionsDeadline)}
            </span>
          </div>
          <div className="pin-progress">
            <div className="pin-progress-track">
              <div
                className="pin-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="pin-progress-label">
              Pronosticaste {doneItems} de {totalItems} ítems
            </span>
          </div>
          <Link className="pin-cta" to={`/prode/fecha/${currentMatchday._id}`}>
            {missingItems > 0 ? "Cargar pronósticos" : "Editar pronósticos"}
            <ArrowIcon />
          </Link>
        </div>
      );
    }

    if (phase === "in_play") {
      if (!isParticipant) {
        return (
          <div className="pin-card">
            <div className="pin-card-head">
              <span className="pin-card-title">
                Fecha {currentMatchday.roundNumber} · en juego
              </span>
              <span className="pin-status-dot pin-status-dot--live" />
            </div>
            <p className="pin-card-caption">
              El deadline ya venció: los duelos se están definiendo. Los
              resultados aparecen acá y en la pestaña Torneo al consolidarse la
              fecha.
            </p>
          </div>
        );
      }
      const myArg = myDuelPartial?.challenges?.ARG;
      const myMisc = myDuelPartial?.challenges?.MISC;
      return (
        <div className="pin-card">
          <div className="pin-card-head">
            <span className="pin-card-title">
              Fecha {currentMatchday.roundNumber} · en juego
            </span>
            <span className="pin-status-dot pin-status-dot--live" />
          </div>
          {myDuelPartial ? (
            <>
              <div className="pin-duel-hero">
                <span className="pin-duel-name pin-duel-name--me">Vos</span>
                <span className="pin-duel-vs">vs</span>
                <span className="pin-duel-name">
                  {nameById.get(String(rivalId)) ?? "Rival"}
                </span>
              </div>
              <div className="pin-duel-chips">
                {myArg && (
                  <span className="pin-duel-chip">
                    <span className="pin-duel-chip-label">ARG</span>
                    {iAmSideA ? myArg.a : myArg.b}–{iAmSideA ? myArg.b : myArg.a}
                  </span>
                )}
                {myMisc && (
                  <span className="pin-duel-chip">
                    <span className="pin-duel-chip-label">RESTO</span>
                    {iAmSideA ? myMisc.a : myMisc.b}–
                    {iAmSideA ? myMisc.b : myMisc.a}
                  </span>
                )}
                {myGdtDuel && (
                  <span className="pin-duel-chip">
                    <span className="pin-duel-chip-label">GDT</span>
                    {iAmGdtA ? myGdtDuel.score.a : myGdtDuel.score.b}–
                    {iAmGdtA ? myGdtDuel.score.b : myGdtDuel.score.a}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="pin-card-caption">
              La fecha está en juego: entrá al tablero para seguir tu duelo.
            </p>
          )}
          <Link className="pin-cta" to={`/prode/fecha/${currentMatchday._id}`}>
            Ver tablero completo
            <ArrowIcon />
          </Link>
        </div>
      );
    }

    /* Consolidada: la última fecha jugada */
    if (isParticipant && myConsolidatedDuel) {
      const iAmA = toId(myConsolidatedDuel.playerA) === String(myPlayer._id);
      const rivalName =
        (iAmA
          ? myConsolidatedDuel.playerB?.name
          : myConsolidatedDuel.playerA?.name) ?? "tu rival";
      const myPoints = iAmA
        ? (myConsolidatedDuel.points?.playerA ?? 0) +
          (myConsolidatedDuel.points?.bonusA ?? 0)
        : (myConsolidatedDuel.points?.playerB ?? 0) +
          (myConsolidatedDuel.points?.bonusB ?? 0);
      const myBonus = iAmA
        ? (myConsolidatedDuel.points?.bonusA ?? 0)
        : (myConsolidatedDuel.points?.bonusB ?? 0);
      const outcome =
        myConsolidatedDuel.duelResult === "draw"
          ? "empate"
          : (myConsolidatedDuel.duelResult === "A") === iAmA
            ? "win"
            : "loss";
      return (
        <div className="pin-card">
          <div className="pin-card-head">
            <span className="pin-card-title">
              Fecha {currentMatchday.roundNumber} · consolidada
            </span>
            <span className="pin-card-meta">Última fecha jugada</span>
          </div>
          <p
            className={`pin-result pin-result--${
              outcome === "win"
                ? "win"
                : outcome === "empate"
                  ? "draw"
                  : "loss"
            }`}
          >
            {outcome === "win"
              ? `Ganaste tu duelo contra ${rivalName}`
              : outcome === "empate"
                ? `Empataste tu duelo contra ${rivalName}`
                : `Perdiste tu duelo contra ${rivalName}`}
            <span className="pin-result-points">
              +{myPoints} pt{myPoints === 1 ? "" : "s"}
              {myBonus > 0 ? " · incluye bonus" : ""}
            </span>
          </p>
          <Link className="pin-cta" to={`/prode/fecha/${currentMatchday._id}`}>
            Ver resultados
            <ArrowIcon />
          </Link>
        </div>
      );
    }

    return (
      <div className="pin-card">
        <div className="pin-card-head">
          <span className="pin-card-title">
            Fecha {currentMatchday.roundNumber} · consolidada
          </span>
          <span className="pin-card-meta">Última fecha jugada</span>
        </div>
        {consolidatedDuels && consolidatedDuels.length > 0 && (
          <div className="pin-mini-duels">
            {consolidatedDuels.map((duel, index) => {
              const pointsA =
                (duel.points?.playerA ?? 0) + (duel.points?.bonusA ?? 0);
              const pointsB =
                (duel.points?.playerB ?? 0) + (duel.points?.bonusB ?? 0);
              return (
                <div key={index} className="pin-mini-duel">
                  <span
                    className={`pin-mini-duel-name pin-mini-duel-name--a${
                      duel.duelResult === "A" ? " pin-mini-duel-name--win" : ""
                    }`}
                  >
                    {duel.playerA?.name}
                  </span>
                  <span className="pin-mini-duel-score">
                    {pointsA} – {pointsB}
                  </span>
                  <span
                    className={`pin-mini-duel-name${
                      duel.duelResult === "B" ? " pin-mini-duel-name--win" : ""
                    }`}
                  >
                    {duel.playerB?.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ProdeMenu />
      <div className="pin-root">
        <div className="pin-content">
        <header className="pin-header">
          <span className="pin-eyebrow">
            <span className="pin-eyebrow-dot" />
            Prode
          </span>
          <h1 className="pin-title">
            {activeTournament
              ? `${activeTournament.name} ${activeTournament.year}`
              : "El Prode"}
          </h1>
        </header>

        {isLoading && <SpinnerOverlay />}

        {!isLoading && (
          <>
            {/* ── Pendientes de acción (solo participante) ── */}
            {isParticipant && (
              <section className="pin-section">
                <h2 className="pin-section-title">Pendientes</h2>
                {pendings.length > 0 ? (
                  <div className="pin-pending-list">
                    {pendings.map((pending) => (
                      <Link
                        key={pending.key}
                        to={pending.to}
                        className={`pin-pending-card${
                          pending.highlight ? " pin-pending-card--highlight" : ""
                        }`}
                      >
                        <div className="pin-pending-info">
                          <span className="pin-pending-title">
                            {pending.title}
                          </span>
                          <span className="pin-pending-caption">
                            {pending.caption}
                          </span>
                        </div>
                        <span className="pin-pending-cta">
                          {pending.cta}
                          <ArrowIcon />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="pin-uptodate">
                    Estás al día — nada pendiente por ahora.
                  </p>
                )}
              </section>
            )}

            {/* ── La fecha en curso ── */}
            {activeTournament && (
              <section className="pin-section">
                <h2 className="pin-section-title">La fecha</h2>
                {renderCurrentMatchday()}
              </section>
            )}

            {/* ── Gran DT: acceso a los universos (puertas adentro) ── */}
            {isParticipant && (gdtUniversesData ?? []).length > 0 && (
              <section className="pin-section">
                <h2 className="pin-section-title">Gran DT</h2>
                <div className="pin-pending-list">
                  {(gdtUniversesData ?? []).map((universe) => (
                    <Link
                      key={universe._id}
                      to={`/prode/gdt/${universe._id}`}
                      className="pin-pending-card"
                    >
                      <div className="pin-pending-info">
                        <span className="pin-pending-title">
                          {universe.label}
                        </span>
                        <span className="pin-pending-caption">
                          {universe.draftStatus === "final"
                            ? "Planteles vigentes del universo"
                            : "Draft en curso"}
                        </span>
                      </div>
                      <span className="pin-pending-cta">
                        Ver planteles
                        <ArrowIcon />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Recorte de la tabla ── */}
            <section className="pin-section">
              <h2 className="pin-section-title">
                {activeTournament ? "Tabla del torneo" : "Histórico total"}
              </h2>
              {standingsRows.length > 0 && standingsData?.matchdayCount > 0 ? (
                <div className="pin-card pin-card--table">
                  <div className="pin-mini-table">
                    {topRows.map((row) => (
                      <div
                        key={row.player._id}
                        className={`pin-mini-row${
                          myRow &&
                          String(row.player._id) === String(myPlayer?._id)
                            ? " pin-mini-row--me"
                            : ""
                        }`}
                      >
                        <span className="pin-mini-pos">{row.position}</span>
                        <span className="pin-mini-name">{row.player.name}</span>
                        <span className="pin-mini-pts">{row.points} pts</span>
                      </div>
                    ))}
                    {myRowOutsideTop && (
                      <>
                        <div className="pin-mini-gap">···</div>
                        <div className="pin-mini-row pin-mini-row--me">
                          <span className="pin-mini-pos">
                            {myRowOutsideTop.position}
                          </span>
                          <span className="pin-mini-name">
                            {myRowOutsideTop.player.name}
                          </span>
                          <span className="pin-mini-pts">
                            {myRowOutsideTop.points} pts
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Link className="pin-cta" to="/prode/torneo">
                    Ver tabla completa
                    <ArrowIcon />
                  </Link>
                </div>
              ) : (
                <div className="pin-card pin-card--empty">
                  <p className="pin-empty-text">
                    {activeTournament
                      ? "Todavía no hay fechas consolidadas: la tabla aparece acá con la primera."
                      : "Todavía no hay datos históricos para mostrar."}
                  </p>
                </div>
              )}
            </section>

            {/* ── Pie ── */}
            <footer className="pin-footer">
              <Link className="pin-footer-link" to="/prode/reglas">
                Reglas del Prode →
              </Link>
            </footer>
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default ProdeInicio;
