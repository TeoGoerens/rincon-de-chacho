// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";
import { formatDeadline } from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeMatchdayAllPredictions from "../../../../reactquery/prode/fetchProdeMatchdayAllPredictions";
import setProdeMatchdayItemResult from "../../../../reactquery/prode/setProdeMatchdayItemResult";
import annulProdeMatchdayItem from "../../../../reactquery/prode/annulProdeMatchdayItem";
import judgeProdeMatchdayQuestion from "../../../../reactquery/prode/judgeProdeMatchdayQuestion";

const CHALLENGE_CARDS = [
  { code: "ARG", title: "Prode Argentina" },
  { code: "MISC", title: "Prode Resto del Mundo" },
];

const ITEM_STATUS = {
  scheduled: { label: "Programado", className: "prf-status--scheduled" },
  finished: { label: "Finalizado", className: "prf-status--finished" },
  annulled: { label: "Anulado", className: "prf-status--annulled" },
};

const isValidScore = (value) =>
  value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

/* Resultados y arbitraje de una fecha en juego (solo lectura si ya está
   consolidada): marcador real por partido, respuesta oficial + veredictos
   por pregunta, anular/restaurar ítems. */
const ProdeMatchdayResults = ({ matchday }) => {
  const queryClient = useQueryClient();
  const items = matchday.items ?? [];
  const participants = matchday.tournament?.participants ?? [];
  const readOnly = matchday.phase !== "in_play";

  const [scores, setScores] = useState({});
  const [officialAnswers, setOfficialAnswers] = useState({});
  const [verdicts, setVerdicts] = useState({});

  const { data: predictions } = useQuery({
    queryKey: ["prode-matchday-all-predictions", matchday._id],
    queryFn: () => fetchProdeMatchdayAllPredictions(matchday._id),
  });

  /* Respuesta de cada participante por ítem: { itemId: { playerId: pick } } */
  const picksByItem = useMemo(() => {
    const map = {};
    for (const prediction of predictions ?? []) {
      const playerId = String(prediction.player?._id ?? prediction.player);
      for (const pick of prediction.picks ?? []) {
        const itemId = String(pick.item);
        if (!map[itemId]) map[itemId] = {};
        map[itemId][playerId] = pick;
      }
    }
    return map;
  }, [predictions]);

  /* Estado local desde el server, SIN pisar lo que el admin tiene a medio
     tipear/tildar: React Query refetchea al reenfocar la ventana (algo
     constante probando con dos ventanas) y un set incondicional volaba los
     veredictos antes de guardarlos. Lo local siempre gana; tras guardar,
     local y server ya coinciden. */
  useEffect(() => {
    const toInput = (value) =>
      value === null || value === undefined ? "" : String(value);
    const nextScores = {};
    const nextAnswers = {};
    for (const item of matchday.items ?? []) {
      const itemId = String(item._id);
      if (item.kind === "match") {
        nextScores[itemId] = {
          home: toInput(item.scoreHome),
          away: toInput(item.scoreAway),
        };
      } else {
        nextAnswers[itemId] = item.officialAnswer ?? "";
      }
    }
    setScores((prev) => ({ ...nextScores, ...prev }));
    setOfficialAnswers((prev) => ({ ...nextAnswers, ...prev }));
  }, [matchday]);

  useEffect(() => {
    setVerdicts((prev) => {
      const next = {};
      for (const [itemId, byPlayer] of Object.entries(picksByItem)) {
        next[itemId] = {};
        for (const [playerId, pick] of Object.entries(byPlayer)) {
          next[itemId][playerId] =
            prev[itemId]?.[playerId] !== undefined
              ? prev[itemId][playerId]
              : (pick.isCorrect ?? null);
        }
      }
      return next;
    });
  }, [picksByItem]);

  const invalidate = () => {
    queryClient.invalidateQueries(["prode-matchday", matchday._id]);
    queryClient.invalidateQueries(["prode-matchdays"]);
    queryClient.invalidateQueries([
      "prode-matchday-all-predictions",
      matchday._id,
    ]);
  };

  const resultMutation = useMutation({
    mutationFn: setProdeMatchdayItemResult,
    onSuccess: () => {
      toast.success("Resultado guardado");
      invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Error al cargar el resultado");
    },
  });

  const annulMutation = useMutation({
    mutationFn: annulProdeMatchdayItem,
    onSuccess: (matchdayUpdated, variables) => {
      toast.success(
        variables.annulled ? "Ítem anulado" : "Ítem restaurado",
      );
      invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Error al anular el ítem");
    },
  });

  const judgeMutation = useMutation({
    /* Guarda respuesta oficial y veredictos juntos */
    mutationFn: async ({ itemId, officialAnswer, itemVerdicts }) => {
      await setProdeMatchdayItemResult({
        matchdayId: matchday._id,
        itemId,
        result: { officialAnswer },
      });
      return judgeProdeMatchdayQuestion({
        matchdayId: matchday._id,
        itemId,
        verdicts: itemVerdicts,
      });
    },
    onSuccess: () => {
      toast.success("Arbitraje guardado");
      invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Error al guardar el arbitraje");
    },
  });

  const busy =
    resultMutation.isPending ||
    annulMutation.isPending ||
    judgeMutation.isPending;

  const handleSaveMatchResult = (item) => {
    const itemId = String(item._id);
    const score = scores[itemId] ?? { home: "", away: "" };
    if (!isValidScore(score.home) || !isValidScore(score.away)) {
      toast.error("El resultado debe tener los dos goles como enteros de 0 o más");
      return;
    }
    resultMutation.mutate({
      matchdayId: matchday._id,
      itemId,
      result: {
        scoreHome: Number(score.home),
        scoreAway: Number(score.away),
      },
    });
  };

  const handleSaveJudge = (item) => {
    const itemId = String(item._id);
    const officialAnswer = (officialAnswers[itemId] ?? "").trim();
    if (!officialAnswer) {
      toast.error("Cargá la respuesta oficial antes de guardar el arbitraje");
      return;
    }
    const itemVerdicts = Object.entries(verdicts[itemId] ?? {}).map(
      ([player, isCorrect]) => ({ player, isCorrect }),
    );
    judgeMutation.mutate({ itemId, officialAnswer, itemVerdicts });
  };

  const setScoreField = (itemId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? { home: "", away: "" }), [field]: value },
    }));
  };

  const toggleVerdict = (itemId, playerId, value) => {
    setVerdicts((prev) => {
      const current = prev[itemId]?.[playerId] ?? null;
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] ?? {}),
          [playerId]: current === value ? null : value,
        },
      };
    });
  };

  const renderStatus = (item) => {
    const status = ITEM_STATUS[item.status] ?? ITEM_STATUS.scheduled;
    return (
      <span className={`prf-status ${status.className}`}>
        <span className="prf-status-dot" />
        {status.label}
      </span>
    );
  };

  const renderAnnulButton = (item) => {
    if (readOnly) return null;
    const annulled = item.status === "annulled";
    return (
      <button
        type="button"
        className={`prf-annul-btn${annulled ? " prf-annul-btn--restore" : ""}`}
        onClick={() =>
          annulMutation.mutate({
            matchdayId: matchday._id,
            itemId: item._id,
            annulled: !annulled,
          })
        }
        disabled={busy}
      >
        {annulled ? "Restaurar" : "Anular"}
      </button>
    );
  };

  const renderMatchItem = (item) => {
    const itemId = String(item._id);
    const score = scores[itemId] ?? { home: "", away: "" };
    const annulled = item.status === "annulled";

    return (
      <div className="prf-result-item" key={itemId}>
        <div className="prf-result-head">
          <div className="prf-item-body">
            <span className="prf-item-main">
              {item.homeName} vs {item.awayName}
            </span>
            <span className="prf-item-meta">
              {[item.leagueName, formatDeadline(item.kickoffAt)]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          {renderStatus(item)}
        </div>

        {!annulled && (
          <div className="prf-result-controls">
            <div className="prf-result-score">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={`Goles de ${item.homeName}`}
                value={score.home}
                disabled={readOnly}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setScoreField(itemId, "home", e.target.value)}
              />
              <span className="prf-result-dash">–</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={`Goles de ${item.awayName}`}
                value={score.away}
                disabled={readOnly}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setScoreField(itemId, "away", e.target.value)}
              />
            </div>
            {!readOnly && (
              <button
                type="button"
                className="prf-add-item-btn"
                onClick={() => handleSaveMatchResult(item)}
                disabled={busy}
              >
                {item.status === "finished"
                  ? "Corregir resultado"
                  : "Guardar resultado"}
              </button>
            )}
          </div>
        )}

        {renderAnnulButton(item)}
      </div>
    );
  };

  const renderQuestionItem = (item) => {
    const itemId = String(item._id);
    const annulled = item.status === "annulled";
    const answered = participants.filter(
      (p) => picksByItem[itemId]?.[String(p._id)],
    );
    const unanswered = participants.filter(
      (p) => !picksByItem[itemId]?.[String(p._id)],
    );

    return (
      <div className="prf-result-item" key={itemId}>
        <div className="prf-result-head">
          <div className="prf-item-body">
            <span className="prf-item-main">{item.questionText}</span>
            <span className="prf-item-meta">
              Pregunta · {item.pointsCorrect} pts
            </span>
          </div>
          {renderStatus(item)}
        </div>

        {!annulled && (
          <>
            <div className="prf-field">
              <label>Respuesta oficial</label>
              <input
                type="text"
                value={officialAnswers[itemId] ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  setOfficialAnswers((prev) => ({
                    ...prev,
                    [itemId]: e.target.value,
                  }))
                }
                placeholder="La respuesta correcta"
              />
            </div>

            {answered.length === 0 ? (
              <p className="prf-hint">Nadie respondió esta pregunta.</p>
            ) : (
              <div className="prf-answers-list">
                {answered.map((participant) => {
                  const playerId = String(participant._id);
                  const pick = picksByItem[itemId][playerId];
                  const verdict = verdicts[itemId]?.[playerId] ?? null;
                  return (
                    <div className="prf-answer-row" key={playerId}>
                      <span className="prf-answer-name">
                        {participant.name}
                      </span>
                      <span className="prf-answer-text">
                        {pick.answerText}
                      </span>
                      {!readOnly && (
                        <span className="prf-verdict-group">
                          <button
                            type="button"
                            className={`prf-verdict-btn prf-verdict-btn--yes${
                              verdict === true
                                ? " prf-verdict-btn--selected"
                                : ""
                            }`}
                            onClick={() =>
                              toggleVerdict(itemId, playerId, true)
                            }
                          >
                            Correcta
                          </button>
                          <button
                            type="button"
                            className={`prf-verdict-btn prf-verdict-btn--no${
                              verdict === false
                                ? " prf-verdict-btn--selected"
                                : ""
                            }`}
                            onClick={() =>
                              toggleVerdict(itemId, playerId, false)
                            }
                          >
                            Incorrecta
                          </button>
                        </span>
                      )}
                      {readOnly && (
                        <span className="prf-answer-text">
                          {verdict === true
                            ? "Correcta"
                            : verdict === false
                              ? "Incorrecta"
                              : "Sin arbitrar"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {unanswered.length > 0 && (
              <p className="prf-hint">
                Sin respuesta: {unanswered.map((p) => p.name).join(", ")}
              </p>
            )}

            {!readOnly && answered.length > 0 && (
              <button
                type="button"
                className="prf-add-item-btn"
                onClick={() => handleSaveJudge(item)}
                disabled={busy}
              >
                Guardar arbitraje
              </button>
            )}
          </>
        )}

        {renderAnnulButton(item)}
      </div>
    );
  };

  return (
    <>
      {busy && <SpinnerOverlay />}

      {CHALLENGE_CARDS.map(({ code, title }) => {
        const challengeItems = items.filter((i) => i.challenge === code);
        return (
          <section className="prf-form" key={code}>
            <div className="prf-card-title">
              {title}
              <span className="prf-card-count">
                {challengeItems.filter((i) => i.status === "finished").length}{" "}
                de {challengeItems.length} con resultado
              </span>
            </div>

            {challengeItems.length === 0 && (
              <p className="prf-hint">Este prode no tiene ítems.</p>
            )}

            <div className="prf-items-list">
              {challengeItems.map((item) =>
                item.kind === "match"
                  ? renderMatchItem(item)
                  : renderQuestionItem(item),
              )}
            </div>
          </section>
        );
      })}
    </>
  );
};

export default ProdeMatchdayResults;
