// Import React dependencies
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeLandingStyles.css";

//Import components
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";
import ProdeMenu from "./ProdeMenu";

//Import React Query functions
import fetchAllProdeTournaments from "../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeMatchdaysByTournament from "../../reactquery/prode/fetchProdeMatchdaysByTournament";
import fetchMyProdePlayer from "../../reactquery/prode/fetchMyProdePlayer";
import fetchGdtUniversesByTournament from "../../reactquery/prode/fetchGdtUniversesByTournament";
import { getUserId } from "../../reactquery/getUserInformation";

const formatDeadline = (isoDate) => {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* Landing transitoria del Prode: muestra las fechas abiertas del torneo
   activo para entrar a cargar pronósticos. La home definitiva de la sección
   (tabla, records, H2H) llega con la Etapa 3 del rebuild. */
const ProdeLanding = () => {
  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const { data: myPlayer, isLoading: myPlayerLoading } = useQuery({
    queryKey: ["prode-my-player", getUserId()],
    queryFn: fetchMyProdePlayer,
  });

  const activeTournament = useMemo(
    () => (tournamentsData ?? []).find((t) => t.status === "active") ?? null,
    [tournamentsData],
  );

  /* Las fechas abiertas solo se muestran a participantes del torneo activo:
     al resto no se lo invita a cargar algo que después le va a rechazar */
  const isParticipant = useMemo(() => {
    if (!myPlayer || !activeTournament) return false;
    return (activeTournament.participants ?? []).some(
      (p) => String(p._id ?? p) === String(myPlayer._id),
    );
  }, [myPlayer, activeTournament]);

  const { data: matchdaysData, isLoading: matchdaysLoading } = useQuery({
    queryKey: ["prode-matchdays", activeTournament?._id],
    queryFn: () => fetchProdeMatchdaysByTournament(activeTournament._id),
    enabled: Boolean(activeTournament) && isParticipant,
  });

  /* Drafts GDT abiertos del torneo activo: el participante arma su equipo */
  const { data: gdtUniversesData, isLoading: gdtUniversesLoading } = useQuery({
    queryKey: ["gdt-universes", activeTournament?._id],
    queryFn: () => fetchGdtUniversesByTournament(activeTournament._id),
    enabled: Boolean(activeTournament) && isParticipant,
  });

  /* Abiertos (armar equipo) y revelados/resolviendo (ver planteles y
     quemas); los finales ya no necesitan card acá */
  const activeDrafts = useMemo(
    () =>
      (gdtUniversesData ?? []).filter((universe) =>
        ["open", "revealed", "resolving"].includes(universe.draftStatus),
      ),
    [gdtUniversesData],
  );

  /* Universos con ventana de cambios en curso: el participante entra a
     hacer sus cambios (o a confirmar que no cambia nada) */
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

  /* Universos definitivos sin proceso en curso: entrada PERMANENTE para
     consultar los planteles vigentes */
  const finalUniverses = useMemo(
    () =>
      (gdtUniversesData ?? []).filter(
        (universe) =>
          universe.draftStatus === "final" &&
          !(universe.changeWindows ?? []).some(
            (item) => item.status !== "final",
          ),
      ),
    [gdtUniversesData],
  );

  /* Abiertas (a cargar), en juego (a comparar) y consolidadas del rebuild
     (con ítems — las históricas del Excel no tienen nada que mostrar acá) */
  const visibleMatchdays = useMemo(
    () =>
      (matchdaysData ?? []).filter(
        (m) =>
          m.phase === "open" ||
          m.phase === "in_play" ||
          (m.phase === "consolidated" && (m.items?.length ?? 0) > 0),
      ),
    [matchdaysData],
  );

  /* El admin me reabrió la carga post-deadline en esta fecha */
  const isReopenedForMe = (matchday) =>
    matchday.phase === "in_play" &&
    Boolean(myPlayer) &&
    (matchday.reopenedFor ?? [])
      .map((p) => String(p?._id ?? p))
      .includes(String(myPlayer._id));

  if (
    tournamentsLoading ||
    matchdaysLoading ||
    myPlayerLoading ||
    gdtUniversesLoading
  )
    return (
      <>
        <ProdeMenu />
        <SpinnerOverlay />
      </>
    );

  return (
    <>
      <ProdeMenu />
      <div className="prl-wrap">
      <div className="prl-content">
        <p className="prl-eyebrow">Prode</p>
        {activeTournament && (
          <h1 className="prl-title">
            {activeTournament.name} {activeTournament.year}
          </h1>
        )}

        {isParticipant && activeDrafts.length > 0 && (
          <div className="prl-matchday-list prl-draft-list">
            {activeDrafts.map((universe) => (
              <Link
                className="prl-matchday-card"
                to={`/prode/gdt/${universe._id}`}
                key={universe._id}
              >
                <div className="prl-matchday-info">
                  <span className="prl-matchday-name">
                    Draft del Gran DT · {universe.label}
                  </span>
                  <span className="prl-matchday-deadline">
                    {universe.draftStatus === "open"
                      ? `Armá tu equipo antes del ${formatDeadline(universe.draftDeadline)}`
                      : "Planteles revelados · mirá las quemas"}
                  </span>
                </div>
                <span className="prl-matchday-cta">
                  {universe.draftStatus === "open"
                    ? "Armar mi equipo"
                    : "Ver planteles"}
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
                </span>
              </Link>
            ))}
          </div>
        )}

        {isParticipant && activeWindows.length > 0 && (
          <div className="prl-matchday-list prl-draft-list">
            {activeWindows.map(({ universe, window: win }) => (
              <Link
                className="prl-matchday-card"
                to={`/prode/gdt/${universe._id}`}
                key={`window-${universe._id}`}
              >
                <div className="prl-matchday-info">
                  <span className="prl-matchday-name">
                    Ventana de cambios de {win.month} · {universe.label}
                  </span>
                  <span className="prl-matchday-deadline">
                    {win.status === "open"
                      ? `Hasta 2 cambios antes del ${formatDeadline(win.deadline)} (o confirmá sin cambios)`
                      : "Ronda de la ventana en curso · re-elecciones por quemas"}
                  </span>
                </div>
                <span className="prl-matchday-cta">
                  {win.status === "open" ? "Hacer mis cambios" : "Ver la ronda"}
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
                </span>
              </Link>
            ))}
          </div>
        )}

        {isParticipant && finalUniverses.length > 0 && (
          <div className="prl-matchday-list prl-draft-list">
            {finalUniverses.map((universe) => (
              <Link
                className="prl-matchday-card"
                to={`/prode/gdt/${universe._id}`}
                key={`final-${universe._id}`}
              >
                <div className="prl-matchday-info">
                  <span className="prl-matchday-name">
                    Gran DT · {universe.label}
                  </span>
                  <span className="prl-matchday-deadline">
                    Planteles vigentes del universo
                  </span>
                </div>
                <span className="prl-matchday-cta">
                  Ver planteles
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
                </span>
              </Link>
            ))}
          </div>
        )}

        {!isParticipant ? (
          <p className="prl-text">
            {activeTournament
              ? "El Prode se juega entre sus participantes. Acá vas a poder seguir los resultados y las estadísticas del torneo."
              : "No hay ningún torneo activo por ahora."}
          </p>
        ) : visibleMatchdays.length > 0 ? (
          <>
            <p className="prl-text">
              {visibleMatchdays.length === 1
                ? "Hay una fecha en curso."
                : "Hay fechas en curso."}
            </p>
            <div className="prl-matchday-list">
              {visibleMatchdays.map((matchday) => (
                <Link
                  className={`prl-matchday-card${
                    isReopenedForMe(matchday)
                      ? " prl-matchday-card--reopened"
                      : ""
                  }`}
                  to={`/prode/fecha/${matchday._id}`}
                  key={matchday._id}
                >
                  <div className="prl-matchday-info">
                    <span className="prl-matchday-name">
                      Fecha {matchday.roundNumber}
                    </span>
                    <span className="prl-matchday-deadline">
                      {matchday.phase === "open"
                        ? `Cierra el ${formatDeadline(matchday.predictionsDeadline)}`
                        : matchday.phase === "consolidated"
                          ? "Consolidada · resultados definitivos"
                          : isReopenedForMe(matchday)
                            ? "El admin te reabrió la carga: te está esperando"
                            : "En juego · deadline vencido"}
                    </span>
                  </div>
                  <span className="prl-matchday-cta">
                    {matchday.phase === "open" || isReopenedForMe(matchday)
                      ? "Cargar pronósticos"
                      : matchday.phase === "consolidated"
                        ? "Ver resultados"
                        : "Ver pronósticos"}
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
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="prl-text">
            {activeTournament
              ? "No hay fechas abiertas por ahora. Cuando el admin abra una fecha te va a llegar un mail para cargar tus pronósticos."
              : "No hay ningún torneo activo por ahora."}
          </p>
        )}

        <p className="prl-note">
          La tabla del torneo ya está disponible en la pestaña Torneo. Records
          y estadísticas llegan muy pronto.
        </p>
      </div>
      </div>
    </>
  );
};

export default ProdeLanding;
