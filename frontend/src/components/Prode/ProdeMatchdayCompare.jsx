// Import React dependencies
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdePredictionsStyles.css";

//Import components
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeMatchdayPredictions from "../../reactquery/prode/fetchProdeMatchdayPredictions";
import fetchProdeMatchdayPartials from "../../reactquery/prode/fetchProdeMatchdayPartials";

const CHALLENGE_BLOCKS = [
  { code: "ARG", title: "Prode Argentina", short: "Argentina" },
  { code: "MISC", title: "Prode Resto del Mundo", short: "Resto del Mundo" },
];

/* El hero del duelo muestra los 3 desafíos: el GDT en juego aparece como
   pendiente (se tipea recién al consolidar) y consolidado con su total */
const HERO_BLOCKS = [...CHALLENGE_BLOCKS, { code: "GDT", short: "Gran DT" }];

const toId = (value) => String(value?._id ?? value);

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

/* Definido = ya no depende de nadie (con resultado o anulado) */
const isItemSettled = (item) =>
  item.status === "finished" || item.status === "annulled";

/* Cuánto difieren dos picks de un ítem PENDIENTE:
   "full" = picks enfrentados (acá se define el duelo)
   "score" = mismo ganador, distinto marcador (solo se juega el exacto)
   "same" = neutralizado */
const diffLevel = (item, pickA, pickB) => {
  if (item.kind === "match") {
    const oneXtwoA = pickA?.pick1x2 ?? null;
    const oneXtwoB = pickB?.pick1x2 ?? null;
    if (oneXtwoA !== oneXtwoB) return "full";
    const scoreA = pickA ? `${pickA.predictedHome}-${pickA.predictedAway}` : "";
    const scoreB = pickB ? `${pickB.predictedHome}-${pickB.predictedAway}` : "";
    return scoreA !== scoreB ? "score" : "same";
  }
  const answerA = (pickA?.answerText ?? "").trim().toLowerCase();
  const answerB = (pickB?.answerText ?? "").trim().toLowerCase();
  return answerA === answerB ? "same" : "full";
};

const DIFF_TAGS = {
  full: { label: "Difieren", className: "prp-diff--full" },
  score: { label: "Otro marcador", className: "prp-diff--score" },
  same: { label: "Iguales", className: "prp-diff--same" },
};

/* Vista post-deadline: el duelo como tablero en vivo. "Mi duelo" (vos contra
   tu rival, lo que más importa) y "Todos" (la fecha completa). */
const ProdeMatchdayCompare = ({ matchday, myPlayer }) => {
  const myPlayerId = myPlayer?._id;
  const [view, setView] = useState("duel");

  const {
    data: predictions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-matchday-predictions", matchday._id],
    queryFn: () => fetchProdeMatchdayPredictions(matchday._id),
  });

  /* Parciales al vuelo: puntos por pick, totales y estado de duelos */
  const { data: partials } = useQuery({
    queryKey: ["prode-matchday-partials", matchday._id],
    queryFn: () => fetchProdeMatchdayPartials(matchday._id),
  });

  const items = matchday.items ?? [];
  const participants = matchday.tournament?.participants ?? [];

  /* pick de cada jugador por ítem: { playerId: { itemId: pick } } */
  const picksByPlayer = useMemo(() => {
    const map = {};
    for (const prediction of predictions ?? []) {
      const playerId = toId(prediction.player);
      map[playerId] = {};
      for (const pick of prediction.picks ?? []) {
        map[playerId][String(pick.item)] = pick;
      }
    }
    return map;
  }, [predictions]);

  const myDuel = useMemo(
    () =>
      (matchday.duels ?? []).find(
        (duel) =>
          toId(duel.playerA) === String(myPlayerId) ||
          toId(duel.playerB) === String(myPlayerId),
      ) ?? null,
    [matchday, myPlayerId],
  );

  const rival = myDuel
    ? toId(myDuel.playerA) === String(myPlayerId)
      ? myDuel.playerB
      : myDuel.playerA
    : null;

  const myDuelPartial =
    partials?.duels?.find(
      (duel) =>
        duel.playerA === String(myPlayerId) ||
        duel.playerB === String(myPlayerId),
    ) ?? null;
  const iAmSideA = myDuelPartial?.playerA === String(myPlayerId);

  /* Consolidada: los totales definitivos (GDT incluido) viven en el propio
     documento del duelo, no en los parciales */
  const isConsolidated = matchday.phase === "consolidated";
  const iAmDuelA = myDuel
    ? toId(myDuel.playerA) === String(myPlayerId)
    : false;
  const duelChallenge = (type) =>
    myDuel?.challenges?.find((challenge) => challenge.type === type) ?? null;

  if (isLoading) return <SpinnerOverlay />;

  if (isError) {
    return (
      <div className="prp-banner prp-banner--closed">
        <span className="prp-banner-text">
          {error?.message || "No pudimos cargar los pronósticos."}
        </span>
      </div>
    );
  }

  const pickFor = (playerId, itemId) =>
    picksByPlayer[String(playerId)]?.[String(itemId)] ?? null;

  /* Chip de puntos parciales de un pick (solo si el ítem ya puntúa) */
  const renderPoints = (playerId, itemId) => {
    const entry = partials?.picks?.[String(playerId)]?.[String(itemId)];
    if (!entry?.scored) return null;
    return (
      <span className={`prp-pts${entry.points > 0 ? " prp-pts--won" : ""}`}>
        +{entry.points}
      </span>
    );
  };

  const totalsFor = (playerId) =>
    partials?.totals?.[String(playerId)] ?? { ARG: 0, MISC: 0, total: 0 };

  /* Resultado real del ítem, visible bajo su título */
  const renderItemResult = (item) => {
    if (item.status === "annulled") {
      return (
        <span className="prp-dt-result prp-dt-result--annulled">Anulado</span>
      );
    }
    if (item.status !== "finished") return null;
    if (item.kind === "match") {
      return (
        <span className="prp-dt-result">
          Final {item.scoreHome}-{item.scoreAway}
        </span>
      );
    }
    return item.officialAnswer ? (
      <span className="prp-dt-result">Respuesta: {item.officialAnswer}</span>
    ) : null;
  };

  const renderMatchPick = (pick, item) => {
    const hasScore =
      pick && pick.predictedHome !== null && pick.predictedAway !== null;
    const pickLabel =
      pick?.pick1x2 === "home"
        ? item.homeName
        : pick?.pick1x2 === "draw"
          ? "Empate"
          : pick?.pick1x2 === "away"
            ? item.awayName
            : null;

    if (!hasScore && !pickLabel) {
      return <span className="prp-cmp-empty">Sin pronóstico</span>;
    }
    return (
      <>
        {hasScore && (
          <span className="prp-cmp-score">
            {pick.predictedHome}-{pick.predictedAway}
          </span>
        )}
        {pickLabel && <span className="prp-cmp-pick">{pickLabel}</span>}
      </>
    );
  };

  const renderQuestionPick = (pick) => {
    if (!pick?.answerText) {
      return <span className="prp-cmp-empty">Sin pronóstico</span>;
    }
    return <span className="prp-cmp-answer">{pick.answerText}</span>;
  };

  const itemTitle = (item) =>
    item.kind === "match"
      ? `${item.homeName} – ${item.awayName}`
      : item.questionText;

  const itemMeta = (item) =>
    item.kind === "match"
      ? [item.leagueName, formatKickoff(item.kickoffAt)]
          .filter(Boolean)
          .join(" · ")
      : "Pregunta";

  const renderDiffTag = (item) => {
    const level = diffLevel(
      item,
      pickFor(myPlayerId, item._id),
      pickFor(toId(rival), item._id),
    );
    const tag = DIFF_TAGS[level];
    return (
      <span className={`prp-diff ${tag.className}`}>{tag.label}</span>
    );
  };

  /* ---------- Vista Mi duelo ---------- */

  const initialOf = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  /* Misma regla que el resto del sitio: foto de perfil propia si hay una
     cargada (las default de pixabay no cuentan), inicial si no */
  const hasCustomPhoto = (pic) => pic && !pic.includes("pixabay.com");

  const renderAvatar = (playerId, name, { me = false, small = false } = {}) => {
    const pic = matchday.participantAvatars?.[String(playerId)];
    const withPhoto = hasCustomPhoto(pic);
    return (
      <span
        className={`prp-avatar${small ? " prp-avatar--sm" : ""}${
          me ? " prp-avatar--me" : ""
        }${withPhoto ? " prp-avatar--photo" : ""}`}
      >
        {withPhoto ? <img src={pic} alt={name} /> : initialOf(name)}
      </span>
    );
  };

  /* Cierre del duelo consolidado: quién lo ganó y qué puntos deja */
  const renderDuelVerdict = () => {
    const points = myDuel.points ?? {};
    const myPts =
      ((iAmDuelA ? points.playerA : points.playerB) ?? 0) +
      ((iAmDuelA ? points.bonusA : points.bonusB) ?? 0);
    const myBonus = (iAmDuelA ? points.bonusA : points.bonusB) ?? 0;
    const rivalPts =
      ((iAmDuelA ? points.playerB : points.playerA) ?? 0) +
      ((iAmDuelA ? points.bonusB : points.bonusA) ?? 0);
    const rivalBonus = (iAmDuelA ? points.bonusB : points.bonusA) ?? 0;
    const iWon = myDuel.duelResult === (iAmDuelA ? "A" : "B");
    const isDraw = myDuel.duelResult === "draw";

    const text = isDraw
      ? "Empate en el duelo · +1 pt cada uno"
      : iWon
        ? `Ganaste el duelo · +${myPts} pts${
            myBonus > 0 ? " (incluye bonus)" : ""
          }`
        : `Ganó ${rival?.name} · +${rivalPts} pts${
            rivalBonus > 0 ? " (incluye bonus)" : ""
          }`;

    return (
      <div
        className={`prp-verdict${
          iWon
            ? " prp-verdict--won"
            : isDraw
              ? " prp-verdict--draw"
              : " prp-verdict--lost"
        }`}
      >
        <span className="prp-verdict-dot" />
        {text}
      </div>
    );
  };

  /* Tablero compacto: avatares a los costados, los marcadores apilados en
     el centro ENTRE los jugadores — sin espacio muerto */
  const renderDuelHero = () => (
    <div className="prp-duel-hero">
      <div className="prp-hero-side">
        {renderAvatar(myPlayerId, myPlayer?.name, { me: true })}
        <span className="prp-hero-side-name">Vos</span>
      </div>

      <div className="prp-hero-center">
        {HERO_BLOCKS.map(({ code, short }) => {
          let mine = null;
          let theirs = null;
          let caption = null;

          if (isConsolidated) {
            const challenge = duelChallenge(code);
            if (!challenge) return null;
            mine = iAmDuelA ? challenge.scoreA : challenge.scoreB;
            theirs = iAmDuelA ? challenge.scoreB : challenge.scoreA;
          } else if (code === "GDT") {
            caption = "se define al consolidar";
          } else {
            if (!myDuelPartial) return null;
            const challenge = myDuelPartial.challenges[code];
            mine = iAmSideA ? challenge.a : challenge.b;
            theirs = iAmSideA ? challenge.b : challenge.a;
            const blockItems = items.filter((i) => i.challenge === code);
            if (blockItems.length === 0) return null;
            const settled = blockItems.filter(isItemSettled).length;
            caption = `${settled} de ${blockItems.length} definidos`;
          }

          return (
            <div className="prp-hero-ch" key={code}>
              <span className="prp-hero-label">{short}</span>
              <div className="prp-hero-score">
                {mine === null ? (
                  <span className="prp-hero-num prp-hero-num--pending">–</span>
                ) : (
                  <>
                    <span
                      className={`prp-hero-num${
                        mine > theirs ? " prp-hero-num--leading" : ""
                      }`}
                    >
                      {mine}
                    </span>
                    <span className="prp-hero-dash">–</span>
                    <span
                      className={`prp-hero-num${
                        theirs > mine ? " prp-hero-num--leading" : ""
                      }`}
                    >
                      {theirs}
                    </span>
                  </>
                )}
              </div>
              {caption && <span className="prp-hero-caption">{caption}</span>}
            </div>
          );
        })}
      </div>

      <div className="prp-hero-side">
        {renderAvatar(toId(rival), rival?.name)}
        <span className="prp-hero-side-name">{rival?.name}</span>
      </div>

      {isConsolidated && myDuel?.duelResult && renderDuelVerdict()}
    </div>
  );

  const renderDuelTable = (tableItems, { pending }) => (
    <div
      className={`prp-duel-table-wrap${
        pending ? "" : " prp-duel-table-wrap--settled"
      }`}
    >
      <table className="prp-duel-table">
        <thead>
          <tr>
            <th className="prp-dt-item" />
            <th className="prp-dt-th--me">Vos</th>
            <th>{rival?.name}</th>
          </tr>
        </thead>
        <tbody>
          {tableItems.map((item) => {
            const level = pending
              ? diffLevel(
                  item,
                  pickFor(myPlayerId, item._id),
                  pickFor(toId(rival), item._id),
                )
              : null;
            return (
            <tr
              key={item._id}
              className={level === "full" ? "prp-dt-row--diff" : ""}
            >
              <td className="prp-dt-item">
                <span className="prp-dt-title">{itemTitle(item)}</span>
                <span className="prp-dt-meta">{itemMeta(item)}</span>
                {pending ? renderDiffTag(item) : renderItemResult(item)}
              </td>
              <td className="prp-dt-pick prp-dt-pick--me">
                <div className="prp-dt-val">
                  {item.kind === "match"
                    ? renderMatchPick(pickFor(myPlayerId, item._id), item)
                    : renderQuestionPick(pickFor(myPlayerId, item._id))}
                  {renderPoints(myPlayerId, item._id)}
                </div>
              </td>
              <td className="prp-dt-pick">
                <div className="prp-dt-val">
                  {item.kind === "match"
                    ? renderMatchPick(pickFor(toId(rival), item._id), item)
                    : renderQuestionPick(pickFor(toId(rival), item._id))}
                  {renderPoints(toId(rival), item._id)}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderDuelView = () => (
    <>
      {renderDuelHero()}

      {CHALLENGE_BLOCKS.map(({ code, title }) => {
        const blockItems = items.filter((i) => i.challenge === code);
        if (blockItems.length === 0) return null;
        const pendingItems = blockItems.filter((i) => !isItemSettled(i));
        const settledItems = blockItems.filter(isItemSettled);
        return (
          <section className="prp-block" key={code}>
            <div className="prp-block-head">
              <div className="prp-block-name">{title}</div>
            </div>

            {pendingItems.length > 0 && (
              <>
                <div className="prp-sub-label prp-sub-label--live">
                  <span className="prp-sub-dot" />
                  En juego
                </div>
                {renderDuelTable(pendingItems, { pending: true })}
              </>
            )}

            {settledItems.length > 0 && (
              <>
                <div className="prp-sub-label">Definidos</div>
                {renderDuelTable(settledItems, { pending: false })}
              </>
            )}
          </section>
        );
      })}
    </>
  );

  /* ---------- Vista Todos ---------- */

  /* Lado, GDT y puntos definitivos de un participante en su duelo (solo
     tienen sentido con la fecha consolidada) */
  const duelEntryFor = (playerId) => {
    const duel = (matchday.duels ?? []).find(
      (d) =>
        toId(d.playerA) === String(playerId) ||
        toId(d.playerB) === String(playerId),
    );
    if (!duel) return null;
    const isA = toId(duel.playerA) === String(playerId);
    const gdt = duel.challenges?.find((c) => c.type === "GDT");
    const points = duel.points ?? {};
    return {
      gdt: (isA ? gdt?.scoreA : gdt?.scoreB) ?? 0,
      duelPoints:
        ((isA ? points.playerA : points.playerB) ?? 0) +
        ((isA ? points.bonusA : points.bonusB) ?? 0),
    };
  };

  /* Consolidada manda el puntaje del duelo (la moneda del torneo);
     los ítems desempatan. En juego, solo los ítems. */
  const sortedParticipants = [...participants].sort((a, b) => {
    if (isConsolidated) {
      const diff =
        (duelEntryFor(toId(b))?.duelPoints ?? 0) -
        (duelEntryFor(toId(a))?.duelPoints ?? 0);
      if (diff !== 0) return diff;
    }
    return totalsFor(toId(b)).total - totalsFor(toId(a)).total;
  });

  const renderLeaderboard = () => (
    <div className="prp-lb">
      <div className="prp-totals-title">
        {isConsolidated ? "Resultados de la fecha" : "Parciales de la fecha"}
      </div>
      {sortedParticipants.map((participant, index) => {
        const playerId = toId(participant);
        const totals = totalsFor(playerId);
        const entry = isConsolidated ? duelEntryFor(playerId) : null;
        const isMe = playerId === String(myPlayerId);
        const isLeader =
          index === 0 && (entry ? entry.duelPoints > 0 : totals.total > 0);
        return (
          <div
            className={`prp-lb-row${isMe ? " prp-lb-row--me" : ""}${
              isLeader ? " prp-lb-row--leader" : ""
            }`}
            key={playerId}
          >
            <div className="prp-lb-line">
              <span className="prp-lb-pos">
                {String(index + 1).padStart(2, "0")}
              </span>
              {renderAvatar(playerId, participant.name, {
                me: isMe,
                small: true,
              })}
              <span className="prp-lb-name">
                {participant.name}
                {isMe ? " (vos)" : ""}
              </span>
              <span className="prp-lb-breakdown">
                ARG {totals.ARG} · MISC {totals.MISC}
                {entry ? ` · GDT ${entry.gdt}` : ""}
              </span>
              {entry ? (
                <span className="prp-lb-total">
                  {entry.duelPoints}
                  <span className="prp-lb-total-unit"> pts</span>
                </span>
              ) : (
                <span className="prp-lb-total">{totals.total}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* Distribución de picks 1X2 en un partido pendiente: dónde fue cada uno */
  const renderDistribution = (item) => {
    const counts = { home: 0, draw: 0, away: 0 };
    let none = 0;
    for (const participant of participants) {
      const pick = pickFor(toId(participant), item._id);
      if (pick?.pick1x2) counts[pick.pick1x2] += 1;
      else none += 1;
    }
    const parts = [
      counts.home > 0 && `${counts.home}× ${item.homeName}`,
      counts.draw > 0 && `${counts.draw}× Empate`,
      counts.away > 0 && `${counts.away}× ${item.awayName}`,
      none > 0 && `${none} sin pick`,
    ].filter(Boolean);
    if (parts.length === 0) return null;
    return <p className="prp-dist">{parts.join(" · ")}</p>;
  };

  const renderAllCard = (item, { pending }) => (
    <div
      className={`prp-card${pending ? "" : " prp-card--settled"}`}
      key={item._id}
    >
      <div className="prp-card-head">
        <span className="prp-item-meta">{itemMeta(item)}</span>
        {renderItemResult(item)}
      </div>
      <p className="prp-cmp-title">{itemTitle(item)}</p>
      {pending && item.kind === "match" && renderDistribution(item)}
      <div className="prp-cmp-rows">
        {participants.map((participant) => {
          const pick = pickFor(toId(participant), item._id);
          const isMe = toId(participant) === String(myPlayerId);
          return (
            <div
              className={`prp-cmp-row${isMe ? " prp-cmp-row--me" : ""}`}
              key={toId(participant)}
            >
              <span className="prp-cmp-row-name">
                {participant.name}
                {isMe ? " (vos)" : ""}
              </span>
              <span className="prp-cmp-row-val">
                {item.kind === "match"
                  ? renderMatchPick(pick, item)
                  : renderQuestionPick(pick)}
                {renderPoints(toId(participant), item._id)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAllView = () => (
    <>
      {renderLeaderboard()}

      {CHALLENGE_BLOCKS.map(({ code, title }) => {
        const blockItems = items.filter((i) => i.challenge === code);
        if (blockItems.length === 0) return null;
        const pendingItems = blockItems.filter((i) => !isItemSettled(i));
        const settledItems = blockItems.filter(isItemSettled);
        return (
          <section className="prp-block" key={code}>
            <div className="prp-block-head">
              <div className="prp-block-name">{title}</div>
            </div>

            {pendingItems.length > 0 && (
              <>
                <div className="prp-sub-label prp-sub-label--live">
                  <span className="prp-sub-dot" />
                  En juego
                </div>
                <div className="prp-block-cards prp-block-cards--rows">
                  {pendingItems.map((item) =>
                    renderAllCard(item, { pending: true }),
                  )}
                </div>
              </>
            )}

            {settledItems.length > 0 && (
              <>
                <div className="prp-sub-label">Definidos</div>
                <div className="prp-block-cards prp-block-cards--rows">
                  {settledItems.map((item) =>
                    renderAllCard(item, { pending: false }),
                  )}
                </div>
              </>
            )}
          </section>
        );
      })}
    </>
  );

  return (
    <>
      {myDuel && (
        <div className="prp-tabs">
          <button
            type="button"
            className={`prp-tab${view === "duel" ? " prp-tab--active" : ""}`}
            onClick={() => setView("duel")}
          >
            Mi duelo
          </button>
          <button
            type="button"
            className={`prp-tab${view === "all" ? " prp-tab--active" : ""}`}
            onClick={() => setView("all")}
          >
            Todos
          </button>
        </div>
      )}

      {myDuel && view === "duel" ? renderDuelView() : renderAllView()}
    </>
  );
};

export default ProdeMatchdayCompare;
