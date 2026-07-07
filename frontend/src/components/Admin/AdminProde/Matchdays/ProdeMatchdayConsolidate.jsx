// Import React dependencies
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeMatchdayPartialsAdmin from "../../../../reactquery/prode/fetchProdeMatchdayPartialsAdmin";
import consolidateProdeMatchday from "../../../../reactquery/prode/consolidateProdeMatchday";

const isValidScore = (value) =>
  value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

/* Espejo SOLO VISUAL de la fórmula del duelo para la vista previa (la
   escritura definitiva la calcula el backend con el motor único):
   GDT pesa 2, ARG/MISC 1; ganador 3 / empate 1-1 / perdedor 0; +1 por
   ganar los 3 desafíos */
const previewOutcome = (gdtA, gdtB, arg, misc) => {
  const resultOf = (a, b) => (a > b ? "A" : b > a ? "B" : "draw");
  const results = [
    { weight: 2, result: resultOf(gdtA, gdtB) },
    { weight: 1, result: resultOf(arg.a, arg.b) },
    { weight: 1, result: resultOf(misc.a, misc.b) },
  ];

  let weightedA = 0;
  let weightedB = 0;
  let winsA = 0;
  let winsB = 0;
  for (const { weight, result } of results) {
    if (result === "A") {
      weightedA += weight;
      winsA += 1;
    } else if (result === "B") {
      weightedB += weight;
      winsB += 1;
    }
  }

  const duelResult =
    weightedA > weightedB ? "A" : weightedB > weightedA ? "B" : "draw";
  return {
    duelResult,
    pointsA: (duelResult === "A" ? 3 : duelResult === "draw" ? 1 : 0) +
      (winsA === 3 ? 1 : 0),
    pointsB: (duelResult === "B" ? 3 : duelResult === "draw" ? 1 : 0) +
      (winsB === 3 ? 1 : 0),
  };
};

/* Consolidación de la fecha: sumas ARG/MISC del motor + GDT tipeado a mano
   (puente hasta el fantasy nativo de la Etapa 4) */
const ProdeMatchdayConsolidate = ({ matchday }) => {
  const queryClient = useQueryClient();
  const duels = matchday.duels ?? [];

  const [gdt, setGdt] = useState({});
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: partials } = useQuery({
    queryKey: ["prode-matchday-partials-admin", matchday._id],
    queryFn: () => fetchProdeMatchdayPartialsAdmin(matchday._id),
  });

  const consolidateMutation = useMutation({
    mutationFn: consolidateProdeMatchday,
    onSuccess: (data) => {
      toast.success("Fecha consolidada: mail de resultados enviado");
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
      queryClient.invalidateQueries(["prode-matchday", matchday._id]);
      queryClient.invalidateQueries(["prode-matchdays"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al consolidar la fecha");
    },
  });

  const setGdtField = (index, side, value) => {
    setGdt((prev) => ({
      ...prev,
      [index]: { ...(prev[index] ?? { a: "", b: "" }), [side]: value },
    }));
  };

  const gdtComplete = duels.every((_, index) => {
    const score = gdt[index] ?? { a: "", b: "" };
    return isValidScore(score.a) && isValidScore(score.b);
  });

  const handleConsolidateClick = () => {
    if (!gdtComplete) {
      toast.error(
        "Cargá el resultado GDT de todos los duelos (enteros de 0 o más)",
      );
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    consolidateMutation.mutate({
      matchdayId: matchday._id,
      gdtScores: duels.map((_, index) => ({
        scoreA: Number(gdt[index].a),
        scoreB: Number(gdt[index].b),
      })),
    });
  };

  const challengeSums = (index, code) =>
    partials?.duels?.[index]?.challenges?.[code] ?? { a: 0, b: 0 };

  return (
    <>
      {consolidateMutation.isPending && <SpinnerOverlay />}

      <section className="prf-form">
        <div className="prf-card-title">Consolidar fecha</div>
        <p className="prf-hint">
          Cierre definitivo: escribe los resultados finales (ARG y MISC salen
          de los parciales; el GDT se tipea a mano), calcula los duelos y
          envía el mail de resultados. No tiene vuelta atrás.
        </p>

        {duels.map((duel, index) => {
          const arg = challengeSums(index, "ARG");
          const misc = challengeSums(index, "MISC");
          const score = gdt[index] ?? { a: "", b: "" };
          const preview =
            isValidScore(score.a) && isValidScore(score.b)
              ? previewOutcome(Number(score.a), Number(score.b), arg, misc)
              : null;

          return (
            <div className="prf-cons-row" key={index}>
              <div className="prf-cons-names">
                {duel.playerA?.name} <span>vs</span> {duel.playerB?.name}
              </div>

              <div className="prf-cons-sums">
                ARG {arg.a}-{arg.b} · MISC {misc.a}-{misc.b}
              </div>

              <div className="prf-result-controls">
                <span className="prf-cons-gdt-label">GDT</span>
                <div className="prf-result-score">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label={`GDT de ${duel.playerA?.name}`}
                    value={score.a}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setGdtField(index, "a", e.target.value)}
                  />
                  <span className="prf-result-dash">–</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label={`GDT de ${duel.playerB?.name}`}
                    value={score.b}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setGdtField(index, "b", e.target.value)}
                  />
                </div>

                {preview && (
                  <span className="prf-cons-preview">
                    {preview.duelResult === "draw"
                      ? `Empate · ${preview.pointsA} y ${preview.pointsB} pts`
                      : `Gana ${
                          preview.duelResult === "A"
                            ? duel.playerA?.name
                            : duel.playerB?.name
                        } · ${Math.max(preview.pointsA, preview.pointsB)} pts${
                          Math.max(preview.pointsA, preview.pointsB) === 4
                            ? " (incluye barrida)"
                            : ""
                        }`}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="prf-submit-btn"
          onClick={handleConsolidateClick}
          disabled={consolidateMutation.isPending}
        >
          {consolidateMutation.isPending
            ? "Consolidando..."
            : "Consolidar fecha"}
        </button>
      </section>

      {confirmVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 15V4h16l-4 5.5L20 15H4Z" />
                <path d="M4 22v-7" />
              </svg>
            </div>
            <h4>¿Consolidar la fecha {matchday.roundNumber}?</h4>
            <p>
              Se escriben los resultados definitivos de los duelos, la fecha
              queda cerrada para siempre y se envía el mail de resultados a
              los participantes.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirm}
              >
                Consolidar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProdeMatchdayConsolidate;
