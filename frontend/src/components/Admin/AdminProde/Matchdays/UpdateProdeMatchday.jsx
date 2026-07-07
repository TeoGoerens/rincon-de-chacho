// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";
import {
  MATCHDAY_PHASES,
  toDatetimeLocalValue,
} from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import ProdeMatchdayItems from "./ProdeMatchdayItems";
import ProdeMatchdayResults from "./ProdeMatchdayResults";
import ProdeMatchdayConsolidate from "./ProdeMatchdayConsolidate";

//Import React Query functions
import fetchProdeMatchdayById from "../../../../reactquery/prode/fetchProdeMatchdayById";
import updateProdeMatchdayMeta from "../../../../reactquery/prode/updateProdeMatchdayMeta";
import updateProdeMatchdayDuels from "../../../../reactquery/prode/updateProdeMatchdayDuels";
import openProdeMatchday from "../../../../reactquery/prode/openProdeMatchday";
import notifyProdeMatchdayChanges from "../../../../reactquery/prode/notifyProdeMatchdayChanges";
import reopenProdeMatchday from "../../../../reactquery/prode/reopenProdeMatchday";

const UpdateProdeMatchday = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [month, setMonth] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duels, setDuels] = useState([]);
  const [confirmOpenVisible, setConfirmOpenVisible] = useState(false);
  const [confirmNotifyVisible, setConfirmNotifyVisible] = useState(false);
  const [reopenPlayerId, setReopenPlayerId] = useState("");

  const {
    data: matchday,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-matchday", id],
    queryFn: () => fetchProdeMatchdayById(id),
  });

  const tournament = matchday?.tournament;
  const participants = tournament?.participants ?? [];
  const expectedDuels = Math.floor(participants.length / 2);
  const phase = MATCHDAY_PHASES[matchday?.phase] ?? MATCHDAY_PHASES.draft;
  const metaLocked = matchday?.phase === "consolidated";
  /* En una fecha en juego el deadline ya no tiene efecto (la fase manda):
     queda grisado; mes y número siguen editables */
  const deadlineLocked = metaLocked || matchday?.phase === "in_play";
  const duelsLocked =
    matchday?.phase !== "draft" && matchday?.phase !== "open";

  useEffect(() => {
    if (matchday) {
      setMonth(matchday.month ?? "");
      setRoundNumber(matchday.roundNumber ?? "");
      setDeadline(toDatetimeLocalValue(matchday.predictionsDeadline));

      const existing = (matchday.duels ?? []).map((duel) => ({
        playerA: duel.playerA?._id ?? "",
        playerB: duel.playerB?._id ?? "",
      }));
      const expected = Math.floor(
        (matchday.tournament?.participants?.length ?? 0) / 2,
      );
      while (existing.length < expected) {
        existing.push({ playerA: "", playerB: "" });
      }
      setDuels(existing.slice(0, Math.max(expected, existing.length)));
    }
  }, [matchday]);

  const metaMutation = useMutation({
    mutationFn: updateProdeMatchdayMeta,
    onSuccess: () => {
      toast.success("Datos de la fecha actualizados");
      queryClient.invalidateQueries(["prode-matchday", id]);
      queryClient.invalidateQueries(["prode-matchdays"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar la fecha");
    },
  });

  const duelsMutation = useMutation({
    mutationFn: updateProdeMatchdayDuels,
    onSuccess: () => {
      toast.success("Duelos guardados");
      queryClient.invalidateQueries(["prode-matchday", id]);
      queryClient.invalidateQueries(["prode-matchdays"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al guardar los duelos");
    },
  });

  const openMutation = useMutation({
    /* Abre con lo que está en pantalla: persiste los datos del form antes de
       abrir, para que el deadline validado sea el que el admin está viendo */
    mutationFn: async () => {
      await updateProdeMatchdayMeta({
        matchdayId: id,
        month,
        roundNumber: Number(roundNumber),
        predictionsDeadline: new Date(deadline).toISOString(),
      });
      return openProdeMatchday({ matchdayId: id });
    },
    onSuccess: (data) => {
      toast.success("Fecha abierta: mail de apertura enviado");
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      queryClient.invalidateQueries(["prode-matchday", id]);
      queryClient.invalidateQueries(["prode-matchdays"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al abrir la fecha");
    },
  });

  const notifyMutation = useMutation({
    mutationFn: notifyProdeMatchdayChanges,
    onSuccess: (data) => {
      toast.success("Mail de cambios enviado a los participantes");
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Error al notificar los cambios");
    },
  });

  const handleConfirmNotify = () => {
    setConfirmNotifyVisible(false);
    notifyMutation.mutate({ matchdayId: id });
  };

  const reopenMutation = useMutation({
    mutationFn: reopenProdeMatchday,
    onSuccess: () => {
      toast.success("Carga reabierta para el participante");
      setReopenPlayerId("");
      queryClient.invalidateQueries(["prode-matchday", id]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al reabrir la carga");
    },
  });

  const handleReopenSubmit = (e) => {
    e.preventDefault();
    if (!reopenPlayerId) {
      toast.error("Seleccioná el participante al que reabrirle la carga");
      return;
    }
    reopenMutation.mutate({ matchdayId: id, playerId: reopenPlayerId });
  };

  const handleOpenClick = () => {
    if (!month) {
      toast.error("Seleccioná el mes de la fecha");
      return;
    }
    if (!roundNumber || Number(roundNumber) < 1) {
      toast.error("Ingresá el número de fecha");
      return;
    }
    if (!deadline) {
      toast.error("Fijá el deadline de pronósticos");
      return;
    }
    if (new Date(deadline) <= new Date()) {
      toast.error("El deadline de pronósticos debe estar en el futuro");
      return;
    }
    setConfirmOpenVisible(true);
  };

  const handleConfirmOpen = () => {
    setConfirmOpenVisible(false);
    openMutation.mutate();
  };

  const handleMetaSubmit = (e) => {
    e.preventDefault();
    if (!month) {
      toast.error("Seleccioná el mes de la fecha");
      return;
    }
    if (!roundNumber || Number(roundNumber) < 1) {
      toast.error("Ingresá el número de fecha");
      return;
    }
    if (!deadlineLocked && !deadline) {
      toast.error("Fijá el deadline de pronósticos");
      return;
    }
    metaMutation.mutate({
      matchdayId: id,
      month,
      roundNumber: Number(roundNumber),
      /* El deadline no viaja cuando está bloqueado (fecha en juego) */
      ...(deadlineLocked
        ? {}
        : { predictionsDeadline: new Date(deadline).toISOString() }),
    });
  };

  const setDuelPlayer = (index, side, playerId) => {
    setDuels((prev) =>
      prev.map((duel, i) =>
        i === index ? { ...duel, [side]: playerId } : duel,
      ),
    );
  };

  /* Un participante solo puede aparecer una vez entre todos los duelos */
  const usedIds = duels.flatMap((d) => [d.playerA, d.playerB]).filter(Boolean);
  const optionsFor = (currentValue) =>
    participants.filter(
      (p) => p._id === currentValue || !usedIds.includes(p._id),
    );

  const handleDuelsSubmit = (e) => {
    e.preventDefault();
    const incomplete = duels.some((d) => !d.playerA || !d.playerB);
    if (incomplete) {
      toast.error("Todos los duelos deben tener sus dos jugadores");
      return;
    }
    duelsMutation.mutate({ matchdayId: id, duels });
  };

  if (isLoading) return <SpinnerOverlay />;
  if (isError) {
    return (
      <div className="prf-page">
        <p className="prf-state">
          {error?.message || "Ocurrió un error al cargar la fecha."}
        </p>
      </div>
    );
  }

  return (
    <>
      {(metaMutation.isPending ||
        duelsMutation.isPending ||
        openMutation.isPending ||
        notifyMutation.isPending ||
        reopenMutation.isPending) && <SpinnerOverlay />}

      <div className="prf-page">
        <div className="prf-header">
          <div className="prf-header-text">
            <div className="prf-eyebrow">
              <span className="prf-eyebrow-dot" />
              {tournament?.name} ({tournament?.year})
            </div>
            <h1 className="prf-title">
              Fecha {matchday.roundNumber}{" "}
              <span className={`pri-badge ${phase.badge}`}>{phase.label}</span>
            </h1>
          </div>
          <Link className="prf-back-link" to="/admin/prode/fechas">
            Volver
          </Link>
        </div>

        {/* ── Datos de la fecha ── */}
        <form className="prf-form" onSubmit={handleMetaSubmit}>
          <div className="prf-card-title">Datos de la fecha</div>

          <div className="prf-field">
            <label>Mes</label>
            <select
              value={month}
              disabled={metaLocked}
              onChange={(e) => setMonth(e.target.value)}
              required
            >
              <option value="">Elegí el mes</option>
              {(tournament?.months ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="prf-field">
            <label>Número de fecha</label>
            <input
              type="number"
              min="1"
              value={roundNumber}
              disabled={metaLocked}
              onChange={(e) => setRoundNumber(e.target.value)}
              required
            />
          </div>

          <div className="prf-field">
            <label>Deadline de pronósticos</label>
            <input
              type="datetime-local"
              value={deadline}
              disabled={deadlineLocked}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            {matchday.phase === "in_play" && (
              <p className="prf-hint">
                En una fecha en juego el deadline ya no tiene efecto. Para
                habilitar a un rezagado usá "Reabrir carga".
              </p>
            )}
          </div>

          {!metaLocked && (
            <button
              type="submit"
              className="prf-submit-btn"
              disabled={metaMutation.isPending}
            >
              {metaMutation.isPending ? "Guardando..." : "Guardar datos"}
            </button>
          )}
        </form>

        {/* ── Duelos ── */}
        <form className="prf-form" onSubmit={handleDuelsSubmit}>
          <div className="prf-card-title">
            Duelos ({expectedDuels} para {participants.length} participantes)
          </div>

          {participants.length === 0 ? (
            <p className="prf-hint">
              El torneo no tiene participantes cargados. Agregalos en la
              sección Torneos antes de armar los duelos.
            </p>
          ) : (
            <>
              {duels.map((duel, index) => (
                <div className="prf-duel-row" key={index}>
                  <span className="prf-duel-number">{index + 1}</span>
                  <select
                    value={duel.playerA}
                    disabled={duelsLocked}
                    onChange={(e) =>
                      setDuelPlayer(index, "playerA", e.target.value)
                    }
                  >
                    <option value="">Jugador A</option>
                    {optionsFor(duel.playerA).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="prf-duel-vs">vs</span>
                  <select
                    value={duel.playerB}
                    disabled={duelsLocked}
                    onChange={(e) =>
                      setDuelPlayer(index, "playerB", e.target.value)
                    }
                  >
                    <option value="">Jugador B</option>
                    {optionsFor(duel.playerB).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {duelsLocked ? (
                <p className="prf-hint">
                  Los duelos ya no pueden modificarse en esta instancia de la
                  fecha.
                </p>
              ) : (
                <button
                  type="submit"
                  className="prf-submit-btn"
                  disabled={duelsMutation.isPending}
                >
                  {duelsMutation.isPending
                    ? "Guardando..."
                    : "Guardar duelos"}
                </button>
              )}
            </>
          )}
        </form>

        {/* ── Ítems ARG / MISC: carrito en borrador/abierta, resultados y
            arbitraje en juego/consolidada ── */}
        {matchday.phase === "draft" || matchday.phase === "open" ? (
          <ProdeMatchdayItems matchday={matchday} />
        ) : (
          <ProdeMatchdayResults matchday={matchday} />
        )}

        {/* ── Notificar cambios (solo fecha abierta) ── */}
        {matchday.phase === "open" && (
          <section className="prf-form">
            <div className="prf-card-title">Notificar cambios</div>
            <p className="prf-hint">
              Manda un mail a todos los participantes avisando que los ítems
              de la fecha cambiaron, para que revisen sus pronósticos.
            </p>
            <button
              type="button"
              className="prf-submit-btn"
              onClick={() => setConfirmNotifyVisible(true)}
              disabled={notifyMutation.isPending}
            >
              {notifyMutation.isPending
                ? "Enviando..."
                : "Notificar cambios"}
            </button>
          </section>
        )}

        {/* ── Reabrir carga a un rezagado (solo fecha en juego) ── */}
        {matchday.phase === "in_play" && (
          <form className="prf-form" onSubmit={handleReopenSubmit}>
            <div className="prf-card-title">Reabrir carga</div>
            <p className="prf-hint">
              Habilita a un participante a cargar pronósticos post-deadline.
              Los partidos ya empezados quedan bloqueados para él, y su
              guardado cierra la reapertura.
            </p>

            {(matchday.reopenedFor ?? []).length > 0 && (
              <p className="prf-hint">
                Con carga reabierta ahora:{" "}
                {(matchday.reopenedFor ?? [])
                  .map((p) => p?.name ?? "—")
                  .join(", ")}
              </p>
            )}

            <div className="prf-field">
              <label>Participante</label>
              <select
                value={reopenPlayerId}
                onChange={(e) => setReopenPlayerId(e.target.value)}
              >
                <option value="">Elegí un participante</option>
                {participants
                  .filter(
                    (p) =>
                      !(matchday.reopenedFor ?? []).some(
                        (r) => String(r?._id ?? r) === String(p._id),
                      ),
                  )
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              className="prf-submit-btn"
              disabled={reopenMutation.isPending}
            >
              {reopenMutation.isPending ? "Reabriendo..." : "Reabrir carga"}
            </button>
          </form>
        )}

        {/* ── Consolidar fecha (solo en juego) ── */}
        {matchday.phase === "in_play" && (
          <ProdeMatchdayConsolidate matchday={matchday} />
        )}

        {/* ── Abrir fecha (solo en borrador) ── */}
        {matchday.phase === "draft" && (
          <section className="prf-form">
            <div className="prf-card-title">Abrir fecha</div>
            <p className="prf-hint">
              Guarda los datos tal como están en pantalla y envía el mail de
              apertura a los participantes.
            </p>
            <button
              type="button"
              className="prf-submit-btn"
              onClick={handleOpenClick}
              disabled={openMutation.isPending}
            >
              {openMutation.isPending ? "Abriendo..." : "Abrir fecha"}
            </button>
          </section>
        )}
      </div>

      {confirmNotifyVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
            </div>
            <h4>¿Notificar los cambios de la fecha {matchday.roundNumber}?</h4>
            <p>
              Se enviará un mail a todos los participantes del torneo avisando
              que los partidos o preguntas de la fecha cambiaron.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmNotifyVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmNotify}
              >
                Enviar mail
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpenVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
            </div>
            <h4>¿Abrir la fecha {matchday.roundNumber}?</h4>
            <p>
              Se enviará el mail de apertura a los participantes del torneo y
              la fecha quedará disponible para cargar pronósticos.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmOpenVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmOpen}
              >
                Abrir fecha
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateProdeMatchday;
