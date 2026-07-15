// Import React dependencies
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import InfoTip from "../InfoTip";

//Import React Query functions
import fetchProdeMatchdayPartialsAdmin from "../../../../reactquery/prode/fetchProdeMatchdayPartialsAdmin";
import fetchProdeMatchdayGdtBoard from "../../../../reactquery/prode/fetchProdeMatchdayGdtBoard";
import consolidateProdeMatchday from "../../../../reactquery/prode/consolidateProdeMatchday";

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

/* Consolidación de la fecha: ARG/MISC desde los parciales y GDT desde los
   mini-duelos slot vs slot (4.5) — ya no se tipea nada. Consolidar declara
   terminada la carga de puntajes: los jugadores sin puntaje valen 0. */
const ProdeMatchdayConsolidate = ({ matchday }) => {
  const queryClient = useQueryClient();
  const duels = matchday.duels ?? [];

  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: partials } = useQuery({
    queryKey: ["prode-matchday-partials-admin", matchday._id],
    queryFn: () => fetchProdeMatchdayPartialsAdmin(matchday._id),
  });

  /* Misma query (y cache) que la card de puntajes GDT */
  const { data: board } = useQuery({
    queryKey: ["prode-matchday-gdt-board", matchday._id],
    queryFn: () => fetchProdeMatchdayGdtBoard(matchday._id),
    enabled: Boolean(matchday.gdtUniverse),
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
      queryClient.invalidateQueries(["prode-matchday-gdt-board", matchday._id]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al consolidar la fecha");
    },
  });

  const challengeSums = (index, code) =>
    partials?.duels?.[index]?.challenges?.[code] ?? { a: 0, b: 0 };

  /* Bloqueos de la consolidación (regla del dueño 2026-07-10): nada se
     resuelve por omisión — todos los ítems con resultado (o anulados) y
     todos los jugadores GDT de la fecha con puntaje (0 si no jugó) */
  const unresolvedItems = (matchday.items ?? []).filter(
    (item) => item.status === "scheduled",
  ).length;
  const missingGdt = matchday.gdtUniverse
    ? (board?.missingScores?.length ?? null)
    : 0;

  const blockers = [];
  if (unresolvedItems > 0) {
    blockers.push(
      `Faltan resultados en ${unresolvedItems} ítem${
        unresolvedItems === 1 ? "" : "s"
      } (cargalos o anulalos)`,
    );
  }
  if (missingGdt === null) {
    blockers.push("Cargando el tablero GDT...");
  } else if (missingGdt > 0) {
    blockers.push(
      `Faltan puntajes GDT de ${missingGdt} jugador${
        missingGdt === 1 ? "" : "es"
      } — cargá 0 si no jugó`,
    );
  }

  const handleConfirm = () => {
    setConfirmVisible(false);
    consolidateMutation.mutate({ matchdayId: matchday._id });
  };

  return (
    <>
      {consolidateMutation.isPending && <SpinnerOverlay />}

      <section className="prf-form">
        <div className="prf-card-title">
          Consolidar fecha
          <InfoTip text="Cierre de la fecha: escribe los resultados finales de los duelos (ARG y MISC salen de los parciales; el GDT, de los mini-duelos con los puntajes cargados) y envía el mail de resultados. Si encontrás un error después, podés reabrirla para corregir y volver a consolidar." />
        </div>

        {duels.map((duel, index) => {
          const arg = challengeSums(index, "ARG");
          const misc = challengeSums(index, "MISC");
          const boardDuel = board?.duels?.[index];
          const gdt = boardDuel?.finalScore ?? null;
          const gdtPending = boardDuel?.score?.pending ?? 0;
          const preview = gdt
            ? previewOutcome(gdt.a, gdt.b, arg, misc)
            : null;

          return (
            <div className="prf-cons-row" key={index}>
              <div className="prf-cons-names">
                {duel.playerA?.name} <span>vs</span> {duel.playerB?.name}
              </div>

              <div className="prf-cons-sums">
                ARG {arg.a}-{arg.b} · MISC {misc.a}-{misc.b}
                {gdt && (
                  <>
                    {" "}
                    · GDT {gdt.a}-{gdt.b}
                    {gdtPending > 0 && (
                      <span className="prf-cons-pending">
                        {" "}
                        ({gdtPending} mini-duelo
                        {gdtPending === 1 ? "" : "s"} sin definir)
                      </span>
                    )}
                  </>
                )}
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
                          ? " (incluye bonus)"
                          : ""
                      }`}
                </span>
              )}
            </div>
          );
        })}

        {blockers.length > 0 && (
          <p className="prf-hint prf-cons-warning">
            Para consolidar: {blockers.join(" · ")}.
          </p>
        )}

        <button
          type="button"
          className="prf-submit-btn"
          onClick={() => setConfirmVisible(true)}
          disabled={consolidateMutation.isPending || blockers.length > 0}
          title={blockers.length > 0 ? blockers.join(" · ") : undefined}
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
