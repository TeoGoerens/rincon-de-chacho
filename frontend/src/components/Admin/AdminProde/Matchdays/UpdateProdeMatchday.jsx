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

//Import React Query functions
import fetchProdeMatchdayById from "../../../../reactquery/prode/fetchProdeMatchdayById";
import updateProdeMatchdayMeta from "../../../../reactquery/prode/updateProdeMatchdayMeta";
import updateProdeMatchdayDuels from "../../../../reactquery/prode/updateProdeMatchdayDuels";

const UpdateProdeMatchday = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [month, setMonth] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duels, setDuels] = useState([]);

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
    if (!deadline) {
      toast.error("Fijá el deadline de pronósticos");
      return;
    }
    metaMutation.mutate({
      matchdayId: id,
      month,
      roundNumber: Number(roundNumber),
      predictionsDeadline: new Date(deadline).toISOString(),
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
      {(metaMutation.isPending || duelsMutation.isPending) && (
        <SpinnerOverlay />
      )}

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
            <div className="prf-chips">
              {(tournament?.months ?? []).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={metaLocked}
                  className={`prf-chip${
                    month === m ? " prf-chip--selected" : ""
                  }${metaLocked ? " prf-chip--disabled" : ""}`}
                  onClick={() => setMonth(m)}
                >
                  {m}
                </button>
              ))}
            </div>
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
              disabled={metaLocked}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
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
      </div>
    </>
  );
};

export default UpdateProdeMatchday;
