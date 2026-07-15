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
import refreshProdeMatchdayResults from "../../../../reactquery/prode/refreshProdeMatchdayResults";

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

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

const byKickoff = (a, b) =>
  new Date(a.kickoffAt ?? 0) - new Date(b.kickoffAt ?? 0);

/* Kickoff en dos niveles ("dom 26/07" / "17:00") — armado por partes con
   hour12:false (nunca "p. m."); el día separado ayuda a distinguir jornadas */
const kickoffParts = (isoDate) => {
  if (!isoDate) return { day: "—", time: "" };
  const d = new Date(isoDate);
  const weekday = d.toLocaleDateString("es-AR", { weekday: "short" });
  const dayMonth = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { day: `${weekday} ${dayMonth}`, time };
};

/* Sub-grupos dentro de cada prode: separar lo que llena el botón de refresh
   de lo que el admin completa a mano evita cargar resultados donde no era.
   Partidos en orden cronológico de kickoff. */
const buildItemGroups = (challengeItems) => {
  const apiMatches = challengeItems
    .filter((i) => i.kind === "match" && i.source === "api")
    .sort(byKickoff);
  const manualMatches = challengeItems
    .filter((i) => i.kind === "match" && i.source !== "api")
    .sort(byKickoff);
  const questions = challengeItems.filter((i) => i.kind === "question");

  return [
    { key: "api", title: "Partidos del catálogo", items: apiMatches },
    { key: "manual", title: "Partidos manuales", items: manualMatches },
    { key: "questions", title: "Preguntas", items: questions },
  ].filter((group) => group.items.length > 0);
};

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

  const refreshMutation = useMutation({
    mutationFn: refreshProdeMatchdayResults,
    onSuccess: ({ matchdayUpdated, summary }) => {
      /* Server-wins SOLO en los ítems que el refresh acaba de resolver: el
         merge local-wins del useEffect no los actualizaría, y un set global
         pisaría marcadores a medio tipear en otros ítems */
      const updatedIds = new Set(summary.updatedItemIds ?? []);
      if (updatedIds.size > 0) {
        const fromServer = {};
        for (const item of matchdayUpdated.items ?? []) {
          const itemId = String(item._id);
          if (updatedIds.has(itemId)) {
            fromServer[itemId] = {
              home: String(item.scoreHome),
              away: String(item.scoreAway),
            };
          }
        }
        setScores((prev) => ({ ...prev, ...fromServer }));
      }

      if (summary.updated > 0) {
        toast.success(
          plural(summary.updated, "resultado cargado", "resultados cargados"),
        );
      }
      if (summary.stillPending.length > 0) {
        toast.info(
          `${plural(
            summary.stillPending.length,
            "partido aún sin terminar",
            "partidos aún sin terminar",
          )} — volvé a intentar más tarde`,
        );
      }
      if (summary.postponed.length > 0) {
        toast.warn(
          `Postergados según el proveedor: ${summary.postponed.join(
            ", ",
          )}. Anulalos si corresponde.`,
        );
      }
      if (summary.failed.length > 0) {
        toast.error(
          `No se pudo consultar: ${summary.failed.join(", ")}`,
        );
      }
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error?.message || "Error al traer los resultados del catálogo",
      );
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
    judgeMutation.isPending ||
    refreshMutation.isPending;

  const pendingCatalogCount = items.filter(
    (item) =>
      item.kind === "match" &&
      item.source === "api" &&
      item.status === "scheduled",
  ).length;

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
          <span className="prf-result-tags">{renderStatus(item)}</span>
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

  /* Fila compacta de la tabla desktop: mismo estado y mismas mutations que
     las cards mobile, solo cambia el markup */
  const renderMatchRow = (item, index) => {
    const itemId = String(item._id);
    const score = scores[itemId] ?? { home: "", away: "" };
    const annulled = item.status === "annulled";
    const { day, time } = kickoffParts(item.kickoffAt);
    const rowClass = [
      annulled && "prf-rt-row--annulled",
      index % 2 === 1 && "prf-rt-row--alt",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <tr key={itemId} className={rowClass || undefined}>
        <td className="prf-rt-kickoff">
          <div className="prf-rt-day">{day}</div>
          <div className="prf-rt-time">{time}</div>
        </td>
        <td className="prf-rt-match">
          <div className="prf-rt-match-inner">
            <span className="prf-rt-teams">
              {item.homeName} vs {item.awayName}
            </span>
          </div>
          {item.leagueName && (
            <div className="prf-rt-league">{item.leagueName}</div>
          )}
        </td>
        <td>{renderStatus(item)}</td>
        <td className="prf-rt-score">
          {!annulled && (
            <>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={`Goles de ${item.homeName}`}
                className={
                  item.status === "finished" ? "prf-rt-input--done" : undefined
                }
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
                className={
                  item.status === "finished" ? "prf-rt-input--done" : undefined
                }
                value={score.away}
                disabled={readOnly}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setScoreField(itemId, "away", e.target.value)}
              />
            </>
          )}
        </td>
        <td className="prf-rt-actions">
          {!readOnly && (
            <>
              {!annulled && (
                <button
                  type="button"
                  className="prf-rt-action"
                  onClick={() => handleSaveMatchResult(item)}
                  disabled={busy}
                >
                  {item.status === "finished" ? "Corregir" : "Guardar"}
                </button>
              )}
              <button
                type="button"
                className="prf-rt-action prf-rt-action--danger"
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
            </>
          )}
        </td>
      </tr>
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
      <div className="prf-result-item prf-question" key={itemId}>
        <div className="prf-result-head">
          <div className="prf-item-body">
            <span className="prf-item-main">{item.questionText}</span>
            <span className="prf-item-meta">
              Pregunta · {item.pointsCorrect} pts
            </span>
          </div>
          <span className="prf-result-tags">{renderStatus(item)}</span>
        </div>

        {!annulled && (
          <>
            <div className="prf-q-controls">
              <label className="prf-q-label" htmlFor={`prf-q-${itemId}`}>
                Respuesta oficial
              </label>
              <input
                id={`prf-q-${itemId}`}
                className="prf-q-input"
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
              {!readOnly && answered.length > 0 && (
                <button
                  type="button"
                  className="prf-q-save"
                  onClick={() => handleSaveJudge(item)}
                  disabled={busy}
                >
                  Guardar arbitraje
                </button>
              )}
              {!readOnly && renderAnnulButton(item)}
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
          </>
        )}

        {annulled && renderAnnulButton(item)}
      </div>
    );
  };

  return (
    <>
      {busy && <SpinnerOverlay />}

      {!readOnly && pendingCatalogCount > 0 && (
        <section className="prf-form">
          <div className="prf-refresh-bar">
            <div className="prf-item-body">
              <div className="prf-item-main">Resultados del catálogo</div>
              <div className="prf-item-meta">
                {plural(
                  pendingCatalogCount,
                  "partido del catálogo sin resultado",
                  "partidos del catálogo sin resultado",
                )}{" "}
                · la consulta tarda unos segundos
              </div>
            </div>
            <button
              type="button"
              className="prf-refresh-btn"
              onClick={() => refreshMutation.mutate(matchday._id)}
              disabled={busy}
            >
              {refreshMutation.isPending
                ? "Trayendo resultados..."
                : "Traer resultados"}
            </button>
          </div>
        </section>
      )}

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

            {(() => {
              const groups = buildItemGroups(challengeItems);
              const matchGroups = groups.filter((g) => g.key !== "questions");
              const questionGroups = groups.filter(
                (g) => g.key === "questions",
              );

              const renderGroupCards = (group) => {
                const resolved = group.items.filter(
                  (i) => i.status === "finished",
                ).length;
                return (
                  <div className="prf-result-group" key={group.key}>
                    <div className="prf-result-group-title">
                      {group.title}
                      <span className="prf-card-count">
                        {resolved} de {group.items.length} con resultado
                      </span>
                    </div>
                    <div className="prf-items-list">
                      {group.items.map((item) =>
                        item.kind === "match"
                          ? renderMatchItem(item)
                          : renderQuestionItem(item),
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* Desktop: tabla compacta con separadores por origen */}
                  {matchGroups.length > 0 && (
                    <div className="prf-rt-wrap prf-rt-desktop">
                      <table className="prf-results-table">
                        <colgroup>
                          <col className="prf-rt-col-kickoff" />
                          <col />
                          <col className="prf-rt-col-status" />
                          <col className="prf-rt-col-score" />
                          <col className="prf-rt-col-actions" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>Kickoff</th>
                            <th>Partido</th>
                            <th>Estado</th>
                            <th>Resultado</th>
                            <th aria-label="Acciones" />
                          </tr>
                        </thead>
                        <tbody>
                          {matchGroups.map((group) => {
                            const resolved = group.items.filter(
                              (i) => i.status === "finished",
                            ).length;
                            return (
                              <React.Fragment key={group.key}>
                                <tr
                                  className={`prf-rt-group prf-rt-group--${group.key}`}
                                >
                                  <td colSpan={5}>
                                    {group.title}
                                    <span className="prf-card-count">
                                      {resolved} de {group.items.length} con
                                      resultado
                                    </span>
                                  </td>
                                </tr>
                                {group.items.map((item, index) =>
                                  renderMatchRow(item, index),
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mobile: cards agrupadas (como hasta ahora) */}
                  {matchGroups.length > 0 && (
                    <div className="prf-rt-mobile">
                      {matchGroups.map(renderGroupCards)}
                    </div>
                  )}

                  {/* Preguntas: cards en ambas versiones */}
                  {questionGroups.map(renderGroupCards)}
                </>
              );
            })()}
          </section>
        );
      })}
    </>
  );
};

export default ProdeMatchdayResults;
