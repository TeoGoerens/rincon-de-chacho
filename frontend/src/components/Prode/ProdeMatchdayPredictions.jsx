// Import React dependencies
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./ProdePredictionsStyles.css";

//Import components
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";
import ProdeMatchdayCompare from "./ProdeMatchdayCompare";

//Import React Query functions
import fetchProdeMatchdayById from "../../reactquery/prode/fetchProdeMatchdayById";
import fetchMyProdePrediction from "../../reactquery/prode/fetchMyProdePrediction";
import fetchMyProdePlayer from "../../reactquery/prode/fetchMyProdePlayer";
import saveMyProdePrediction from "../../reactquery/prode/saveMyProdePrediction";
import { getUserId } from "../../reactquery/getUserInformation";

const CHALLENGE_BLOCKS = [
  { code: "ARG", title: "Prode Argentina" },
  { code: "MISC", title: "Prode Resto del Mundo" },
];

const EMPTY_ANSWER = { pick1x2: "", home: "", away: "", answer: "" };

/* "sábado 12/07 a las 21:00 hs" — armado por partes para evitar el
   "03:36 p. m." que devuelve toLocaleString según el sistema */
const formatDeadline = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const weekday = date.toLocaleDateString("es-AR", { weekday: "long" });
  const dayMonth = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${weekday} ${dayMonth} a las ${time} hs`;
};

/* Versión corta: "sáb 12/07 · 21:00" */
const formatKickoff = (isoDate) => {
  if (!isoDate) return "";
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

/* El pronóstico de un partido va COMPLETO o no va (decisión del dueño):
   resultado 1X2 + marcador juntos. Un ítem cuenta como pronosticado recién
   cuando no le falta nada. */
const isItemAnswered = (item, answer) => {
  if (!answer) return false;
  if (item.kind === "match") {
    return (
      answer.pick1x2 !== "" && answer.home !== "" && answer.away !== ""
    );
  }
  return answer.answer.trim() !== "";
};

/* Partido con algo cargado pero no todo: se marca distinto y el guardado
   lo rechaza */
const isItemPartial = (item, answer) => {
  if (!answer || item.kind !== "match") return false;
  const hasAny =
    answer.pick1x2 !== "" || answer.home !== "" || answer.away !== "";
  return hasAny && !isItemAnswered(item, answer);
};

/* Pronóstico guardado en el server → shape del estado del form */
const buildAnswersFromPrediction = (prediction) => {
  const toInputValue = (score) =>
    score === null || score === undefined ? "" : String(score);
  const answers = {};
  for (const pick of prediction?.picks ?? []) {
    answers[pick.item] = {
      pick1x2: pick.pick1x2 ?? "",
      home: toInputValue(pick.predictedHome),
      away: toInputValue(pick.predictedAway),
      answer: pick.answerText ?? "",
    };
  }
  return answers;
};

const answersDiffer = (a, b, itemIds) =>
  itemIds.some((id) => {
    const left = a[id] ?? EMPTY_ANSWER;
    const right = b[id] ?? EMPTY_ANSWER;
    return (
      left.pick1x2 !== right.pick1x2 ||
      left.home !== right.home ||
      left.away !== right.away ||
      left.answer !== right.answer
    );
  });

const ProdeMatchdayPredictions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  /* Volver a la última pantalla desde la que se llegó (Inicio, Torneo,
     H2H...); la ruta absoluta queda solo como fallback de link directo */
  const goBack = (event) => {
    event.preventDefault();
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/prode");
  };
  const queryClient = useQueryClient();
  const userId = getUserId();
  const draftKey = `prode-draft-${id}-${userId}`;

  const [answers, setAnswers] = useState({});
  const [serverAnswers, setServerAnswers] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const {
    data: matchday,
    isLoading: matchdayLoading,
    isError: matchdayIsError,
    error: matchdayError,
  } = useQuery({
    queryKey: ["prode-matchday", id],
    queryFn: () => fetchProdeMatchdayById(id),
  });

  const {
    data: prediction,
    isLoading: predictionLoading,
    isError: predictionIsError,
    error: predictionError,
  } = useQuery({
    /* userId en la key: lo "mío" nunca puede servirse desde el cache de
       otro usuario en el mismo navegador */
    queryKey: ["prode-my-prediction", id, userId],
    queryFn: () => fetchMyProdePrediction(id),
    retry: (failureCount, error) =>
      error?.status !== 403 && failureCount < 2,
  });

  const { data: myPlayer } = useQuery({
    queryKey: ["prode-my-player", userId],
    queryFn: fetchMyProdePlayer,
  });

  const items = useMemo(() => matchday?.items ?? [], [matchday]);
  const itemIds = useMemo(() => items.map((i) => String(i._id)), [items]);

  const deadlineMs = matchday?.predictionsDeadline
    ? new Date(matchday.predictionsDeadline).getTime()
    : null;

  /* Rezagado: el admin me reabrió la carga post-deadline (reopenedFor puede
     venir populado con {_id, name} o como ids crudos) */
  const isReopenedForMe =
    matchday?.phase === "in_play" &&
    Boolean(myPlayer) &&
    (matchday.reopenedFor ?? [])
      .map((p) => String(p?._id ?? p))
      .includes(String(myPlayer._id));

  const editable =
    (matchday?.phase === "open" && deadlineMs !== null && deadlineMs > now) ||
    isReopenedForMe;

  /* Post-deadline sin reapertura: se muestran los pronósticos de todos */
  const compareMode =
    (matchday?.phase === "in_play" || matchday?.phase === "consolidated") &&
    !isReopenedForMe;

  /* Re-render periódico: si el deadline vence con la pantalla abierta, la
     carga se bloquea sola sin refresh */
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  /* Inicialización: estado desde el server + restauración del borrador local
     si quedó algo sin guardar (opción A validada por el dueño) */
  useEffect(() => {
    if (initialized || matchdayLoading || predictionLoading) return;
    if (matchdayIsError || predictionIsError || !matchday) return;

    const fromServer = buildAnswersFromPrediction(prediction);
    setServerAnswers(fromServer);

    let restored = false;
    if (matchday.phase === "open") {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          /* El borrador declara su dueño: si no coincide con el usuario
             logueado (o no hay usuario), se descarta — nunca puede
             aparecer el tipeo de otra persona en este form */
          if (!userId || String(draft?.userId) !== String(userId)) {
            localStorage.removeItem(draftKey);
          } else {
            const draftAnswers = draft?.answers ?? {};
            const ids = (matchday.items ?? []).map((i) => String(i._id));
            if (answersDiffer(draftAnswers, fromServer, ids)) {
              setAnswers({ ...fromServer, ...draftAnswers });
              restored = true;
            } else {
              localStorage.removeItem(draftKey);
            }
          }
        }
      } catch (e) {
        localStorage.removeItem(draftKey);
      }
    }

    if (!restored) setAnswers(fromServer);
    setDraftRestored(restored);
    setInitialized(true);
  }, [
    initialized,
    matchday,
    prediction,
    matchdayLoading,
    predictionLoading,
    matchdayIsError,
    predictionIsError,
    draftKey,
    userId,
  ]);

  const dirty =
    initialized && answersDiffer(answers, serverAnswers, itemIds);

  /* Borrador local: cada cambio queda en localStorage; al volver al estado
     guardado, el borrador se limpia solo */
  useEffect(() => {
    if (!initialized || !editable) return;
    if (dirty) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ answers, userId, savedAt: Date.now() }),
      );
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [answers, dirty, initialized, editable, draftKey, userId]);

  /* Advertencia nativa del navegador al cerrar con cambios sin guardar */
  useEffect(() => {
    if (!dirty || !editable) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, editable]);

  const saveMutation = useMutation({
    mutationFn: saveMyProdePrediction,
    onSuccess: () => {
      toast.success(
        isReopenedForMe
          ? "Pronósticos guardados: tu carga quedó cerrada"
          : "Pronósticos guardados",
      );
      localStorage.removeItem(draftKey);
      setServerAnswers(answers);
      setDraftRestored(false);
      queryClient.invalidateQueries(["prode-my-prediction", id]);
      /* En modo rezagado el guardado consume la reapertura: refrescar la
         fecha hace aparecer la vista de comparación */
      queryClient.invalidateQueries(["prode-matchday", id]);
      queryClient.invalidateQueries(["prode-matchday-predictions", id]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al guardar tus pronósticos");
    },
  });

  const setAnswerField = useCallback((itemId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? EMPTY_ANSWER), [field]: value },
    }));
  }, []);

  const answerFor = (itemId) => answers[itemId] ?? EMPTY_ANSWER;

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setAnswers(serverAnswers);
    setDraftRestored(false);
  };

  /* Valida y arma los picks a enviar; null si hay un partido a medias */
  const buildPicksToSave = () => {
    const picks = [];
    for (const item of items) {
      const answer = answerFor(String(item._id));

      if (item.kind === "match") {
        if (isItemPartial(item, answer)) {
          toast.error(
            `El pronóstico de ${item.homeName} vs ${item.awayName} está incompleto: elegí el resultado y cargá el marcador, o dejalo vacío`,
          );
          return null;
        }
        if (!isItemAnswered(item, answer)) continue;
        picks.push({
          item: item._id,
          pick1x2: answer.pick1x2,
          predictedHome: Number(answer.home),
          predictedAway: Number(answer.away),
        });
        continue;
      }

      if (answer.answer.trim() === "") continue;
      picks.push({ item: item._id, answerText: answer.answer.trim() });
    }
    return picks;
  };

  const handleSave = () => {
    const picks = buildPicksToSave();
    if (picks === null) return;

    /* Rezagado: el guardado es one-shot (cierra la reapertura) — confirmar */
    if (isReopenedForMe) {
      setConfirmCloseVisible(true);
      return;
    }
    saveMutation.mutate({ matchdayId: id, picks });
  };

  const handleConfirmClose = () => {
    setConfirmCloseVisible(false);
    const picks = buildPicksToSave();
    if (picks === null) return;
    saveMutation.mutate({ matchdayId: id, picks });
  };

  /* ---------- Estados de página ---------- */

  if (matchdayLoading || predictionLoading) return <SpinnerOverlay />;

  if (predictionIsError && predictionError?.status === 403) {
    return (
      <div className="prp-wrap prp-wrap--message">
        <div className="prp-message-card">
          <p className="prp-eyebrow">Prode</p>
          <h1 className="prp-message-title">Solo para participantes</h1>
          <p className="prp-message-text">{predictionError.message}</p>
          <Link className="prp-back-link" to="/prode" onClick={goBack}>
            Volver al Prode
          </Link>
        </div>
      </div>
    );
  }

  if (matchdayIsError || predictionIsError) {
    return (
      <div className="prp-wrap prp-wrap--message">
        <div className="prp-message-card">
          <p className="prp-eyebrow">Prode</p>
          <h1 className="prp-message-title">Algo salió mal</h1>
          <p className="prp-message-text">
            {matchdayError?.message ||
              predictionError?.message ||
              "No pudimos cargar la fecha."}
          </p>
          <Link className="prp-back-link" to="/prode" onClick={goBack}>
            Volver al Prode
          </Link>
        </div>
      </div>
    );
  }

  if (matchday.phase === "draft") {
    return (
      <div className="prp-wrap prp-wrap--message">
        <div className="prp-message-card">
          <p className="prp-eyebrow">Prode</p>
          <h1 className="prp-message-title">
            La fecha todavía no está abierta
          </h1>
          <p className="prp-message-text">
            Cuando el admin la abra vas a recibir un mail para cargar tus
            pronósticos.
          </p>
          <Link className="prp-back-link" to="/prode" onClick={goBack}>
            Volver al Prode
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = items.filter((item) =>
    isItemAnswered(item, answerFor(String(item._id))),
  ).length;
  const totalCount = items.length;
  const progressPct =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  /* Marca de estado micro: Completo en verde, Incompleto en ámbar,
     Pendiente en gris discreto, "Ya empezó" para partidos bloqueados
     durante una reapertura */
  const renderStateMark = (done, partial, locked = false) => {
    if (done)
      return <span className="prp-mark prp-mark--done">Completo</span>;
    if (locked) return <span className="prp-mark">Ya empezó</span>;
    if (!editable) return null;
    if (partial)
      return <span className="prp-mark prp-mark--partial">Incompleto</span>;
    return <span className="prp-mark">Pendiente</span>;
  };

  const renderMatchItem = (item) => {
    const itemId = String(item._id);
    const answer = answerFor(itemId);
    const done = isItemAnswered(item, answer);
    const partial = isItemPartial(item, answer);

    /* Rezagado: partido con kickoff pasado queda solo-lectura (va 0 si no
       estaba cargado de antes) — el backend lo garantiza igual */
    const locked =
      isReopenedForMe &&
      item.kickoffAt &&
      new Date(item.kickoffAt).getTime() <= now;
    const itemEditable = editable && !locked;

    const options = [
      { value: "home", label: item.homeName, points: item.pointsHome },
      { value: "draw", label: "Empate", points: item.pointsDraw },
      { value: "away", label: item.awayName, points: item.pointsAway },
    ];

    return (
      <div
        className={`prp-card${done ? " prp-card--done" : ""}${
          partial ? " prp-card--partial" : ""
        }`}
        key={itemId}
      >
        <div className="prp-card-head">
          <span className="prp-item-meta">
            {[item.leagueName, formatKickoff(item.kickoffAt)]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {renderStateMark(done, partial, locked)}
        </div>

        <div className="prp-scoreline">
          <div className="prp-team prp-team--home">{item.homeName}</div>
          <input
            className="prp-goal"
            type="number"
            min="0"
            inputMode="numeric"
            aria-label={`Goles de ${item.homeName}`}
            value={answer.home}
            disabled={!itemEditable}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAnswerField(itemId, "home", e.target.value)}
          />
          <div className="prp-score-x">–</div>
          <input
            className="prp-goal"
            type="number"
            min="0"
            inputMode="numeric"
            aria-label={`Goles de ${item.awayName}`}
            value={answer.away}
            disabled={!itemEditable}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAnswerField(itemId, "away", e.target.value)}
          />
          <div className="prp-team prp-team--away">{item.awayName}</div>
        </div>

        <div className="prp-1x2">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`prp-1x2-opt${
                answer.pick1x2 === option.value ? " prp-1x2-opt--selected" : ""
              }`}
              disabled={!itemEditable}
              onClick={() =>
                setAnswerField(
                  itemId,
                  "pick1x2",
                  answer.pick1x2 === option.value ? "" : option.value,
                )
              }
            >
              <div className="prp-1x2-label">{option.label}</div>
              <div className="prp-1x2-points">{option.points} pts</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestionItem = (item) => {
    const itemId = String(item._id);
    const answer = answerFor(itemId);
    const done = isItemAnswered(item, answer);

    return (
      <div
        className={`prp-card${done ? " prp-card--done" : ""}`}
        key={itemId}
      >
        <div className="prp-card-head">
          <span className="prp-item-meta">
            Pregunta · {item.pointsCorrect} pts
          </span>
          {renderStateMark(done, false)}
        </div>
        <p className="prp-question-text">{item.questionText}</p>
        <input
          type="text"
          className="prp-question-input"
          placeholder="Tu respuesta"
          value={answer.answer}
          disabled={!editable}
          onChange={(e) => setAnswerField(itemId, "answer", e.target.value)}
        />
      </div>
    );
  };

  return (
    <>
      {saveMutation.isPending && <SpinnerOverlay />}

      <div className="prp-wrap">
        <div className="prp-content">
          {/* ── Header ── */}
          <div className="prp-header">
            <div className="prp-header-text">
              <p className="prp-eyebrow">
                Prode · {matchday.tournament?.name} {matchday.tournament?.year}
              </p>
              <h1 className="prp-title">Fecha {matchday.roundNumber}</h1>
              <p className="prp-deadline">
                La carga cierra el{" "}
                <strong>{formatDeadline(matchday.predictionsDeadline)}</strong>
              </p>
            </div>
            <Link className="prp-back-link" to="/prode" onClick={goBack}>
              ← Volver
            </Link>
          </div>

          {compareMode ? (
            <ProdeMatchdayCompare matchday={matchday} myPlayer={myPlayer} />
          ) : (
            <>
          {!editable && (
            <div className="prp-banner prp-banner--closed">
              La carga de pronósticos está cerrada para esta fecha.
            </div>
          )}

          {isReopenedForMe && (
            <div className="prp-banner prp-banner--draft">
              <span className="prp-banner-text">
                El admin te reabrió la carga. Los partidos que ya empezaron
                quedan bloqueados y al guardar se cierra tu carga.
              </span>
            </div>
          )}

          {draftRestored && editable && (
            <div className="prp-banner prp-banner--draft">
              <span className="prp-banner-text">
                Recuperamos pronósticos que no habías guardado.
              </span>
              <button
                type="button"
                className="prp-banner-btn"
                onClick={discardDraft}
              >
                Descartar
              </button>
            </div>
          )}

          {/* ── Completitud (sticky: acompaña el scroll) ── */}
          <div className="prp-progress">
            <div className="prp-progress-row">
              <span className="prp-progress-text">
                Pronosticaste{" "}
                <strong>
                  {answeredCount} de {totalCount}
                </strong>{" "}
                ítems
              </span>
              <span className="prp-progress-deadline">
                cierra {formatKickoff(matchday.predictionsDeadline)}
              </span>
            </div>
            <div className="prp-progress-track">
              <div
                className="prp-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ── Bloques ARG / MISC ── */}
          {CHALLENGE_BLOCKS.map(({ code, title }, blockIndex) => {
            const blockItems = items.filter((i) => i.challenge === code);
            if (blockItems.length === 0) return null;
            const blockAnswered = blockItems.filter((item) =>
              isItemAnswered(item, answerFor(String(item._id))),
            ).length;
            return (
              <section className="prp-block" key={code}>
                <div className="prp-block-head">
                  <div className="prp-block-name">
                    <span className="prp-block-index">
                      {String(blockIndex + 1).padStart(2, "0")}
                    </span>
                    {title}
                  </div>
                  <span
                    className={`prp-block-count${
                      blockAnswered === blockItems.length
                        ? " prp-block-count--done"
                        : ""
                    }`}
                  >
                    {blockAnswered} de {blockItems.length}
                  </span>
                </div>
                {blockItems.some((i) => i.kind === "match") && (
                  <p className="prp-block-note">
                    Resultado exacto suma 5 pts extra
                  </p>
                )}
                <div className="prp-block-cards">
                  {blockItems.map((item) =>
                    item.kind === "match"
                      ? renderMatchItem(item)
                      : renderQuestionItem(item),
                  )}
                </div>
              </section>
            );
          })}

          {/* ── Guardar ── */}
          {editable && (
            <div className="prp-save-bar">
              <span
                className={`prp-save-status ${
                  dirty ? "prp-save-status--dirty" : "prp-save-status--saved"
                }`}
              >
                <span className="prp-save-dot" />
                {dirty ? "Tenés cambios sin guardar" : "Todo guardado"}
              </span>
              <button
                type="button"
                className="prp-save-btn"
                onClick={handleSave}
                disabled={
                  saveMutation.isPending || (!dirty && !isReopenedForMe)
                }
              >
                {saveMutation.isPending
                  ? "Guardando..."
                  : isReopenedForMe
                    ? "Guardar y cerrar carga"
                    : "Guardar pronósticos"}
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {confirmCloseVisible && (
        <div className="prp-modal-overlay">
          <div className="prp-modal">
            <h4 className="prp-modal-title">¿Guardar y cerrar tu carga?</h4>
            <p className="prp-modal-text">
              Después de guardar no vas a poder editar más tus pronósticos y
              vas a ver los de todos los participantes.
            </p>
            <div className="prp-modal-actions">
              <button
                type="button"
                className="prp-modal-cancel"
                onClick={() => setConfirmCloseVisible(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="prp-modal-confirm"
                onClick={handleConfirmClose}
              >
                Guardar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProdeMatchdayPredictions;
