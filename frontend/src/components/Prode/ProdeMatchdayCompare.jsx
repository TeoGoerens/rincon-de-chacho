// Import React dependencies
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

// Imports CSS & helpers
import "./ProdePredictionsStyles.css";

//Import components
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeMatchdayPredictions from "../../reactquery/prode/fetchProdeMatchdayPredictions";
import fetchProdeMatchdayPartials from "../../reactquery/prode/fetchProdeMatchdayPartials";
import { orderProdeItems } from "../../helpers/prodeItemOrder";

const CHALLENGE_BLOCKS = [
  { code: "ARG", title: "Prode Argentina", short: "Argentina" },
  { code: "MISC", title: "Prode Resto del Mundo", short: "Resto del Mundo" },
];

/* El hero del duelo muestra los 3 desafíos: el GDT en vivo con el marcador
   de mini-duelos (4.5); "se define al consolidar" solo si la fecha no tiene
   universo GDT. En desktop van en fila; en mobile apilados compactos */
const HERO_BLOCKS = [
  { code: "ARG", label: "Argentina" },
  { code: "MISC", label: "Resto del Mundo" },
  { code: "GDT", label: "Gran DT" },
];

/* Etiquetas cortas del resumen por duelo de la vista Todos */
const SUMMARY_BLOCKS = [
  { code: "ARG", label: "ARG" },
  { code: "MISC", label: "RESTO" },
  { code: "GDT", label: "GDT" },
];

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

/* Etiquetas de slot: solo se numeran las posiciones que se repiten (ARQ queda
   sin número, DEF1..DEF4 sí). Compartido por el bloque GDT de Mi duelo y el
   detalle de planteles del Resumen. */
const gdtSlotLabels = (miniDuels) => {
  const totals = {};
  for (const miniDuel of miniDuels) {
    totals[miniDuel.position] = (totals[miniDuel.position] ?? 0) + 1;
  }
  const seen = {};
  return miniDuels.map((miniDuel) => {
    seen[miniDuel.position] = (seen[miniDuel.position] ?? 0) + 1;
    return totals[miniDuel.position] > 1
      ? `${miniDuel.position}${seen[miniDuel.position]}`
      : miniDuel.position;
  });
};

/* Código de colores del comparativo: la CELDA se tiñe con el 1X2 elegido
   (L verde / E amarillo / V rojo) y el NÚMERO se pinta con lo que dice el
   marcador cargado — si no coinciden, la incoherencia salta sola */
const PICK_TONE = { home: "l", draw: "e", away: "v" };

const scoreTone = (home, away) =>
  home > away ? "l" : home === away ? "e" : "v";

/* Vista post-deadline: el duelo como tablero en vivo. "Mi duelo" (vos contra
   tu rival, lo que más importa) y "Todos" (los duelos de la fecha, cada uno
   desplegable con el mismo detalle). */
const ProdeMatchdayCompare = ({ matchday, myPlayer }) => {
  const myPlayerId = myPlayer?._id;
  /* La pestaña Resumen es exclusiva del admin (foto de la fecha para
     compartir en el grupo). Mismo gate que el link Admin del Sidebar. */
  const { isAdmin } = useSelector((store) => store.users);
  const [view, setView] = useState("duel");
  /* Duelos desplegados en la vista Todos (clave = id del jugador izquierdo) */
  const [openDuels, setOpenDuels] = useState(() => new Set());

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

  /* Orden canónico compartido: catálogo por kickoff → manuales por kickoff
     → preguntas en orden de carga */
  const items = useMemo(
    () => orderProdeItems(matchday.items ?? []),
    [matchday],
  );

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

  /* Participantes de la fecha, tomados de los duelos: incluye a quien no
     cargó nada (computeMatchdayPartials igual lo cuenta en 0). Lo usa la
     vista Resumen del admin. */
  const summaryPlayers = useMemo(() => {
    const list = [];
    for (const duel of matchday.duels ?? []) {
      for (const side of ["playerA", "playerB"]) {
        const player = duel[side];
        const id = toId(player);
        if (!list.some((entry) => entry.id === id)) {
          list.push({ id, name: player?.name ?? "?" });
        }
      }
    }
    return list;
  }, [matchday]);

  const isConsolidated = matchday.phase === "consolidated";

  /* ---------- Contexto genérico de un duelo ----------
     Todo el detalle (hero, tablas, GDT) se renderiza desde este contexto:
     "Mi duelo" es el caso particular donde el lado izquierdo soy yo. */
  const buildDuelCtx = (duel) => {
    if (!duel) return null;
    const meIsB = toId(duel.playerB) === String(myPlayerId);
    const leftPlayer = meIsB ? duel.playerB : duel.playerA;
    const rightPlayer = meIsB ? duel.playerA : duel.playerB;
    const leftId = toId(leftPlayer);
    const rightId = toId(rightPlayer);

    const partial =
      partials?.duels?.find(
        (d) => d.playerA === leftId || d.playerB === leftId,
      ) ?? null;
    const gdtDuel =
      partials?.gdt?.duels?.find(
        (d) => d.playerA === leftId || d.playerB === leftId,
      ) ?? null;

    return {
      duel,
      left: {
        id: leftId,
        name: leftPlayer?.name,
        isMe: leftId === String(myPlayerId),
      },
      right: {
        id: rightId,
        name: rightPlayer?.name,
        isMe: rightId === String(myPlayerId),
      },
      leftIsDuelA: toId(duel.playerA) === leftId,
      partial,
      leftIsPartialA: partial?.playerA === leftId,
      gdtDuel,
      leftIsGdtA: gdtDuel?.playerA === leftId,
    };
  };

  /* Marcador de un desafío desde el lado izquierdo del contexto:
     consolidada → challenges del duelo; en juego → parciales (GDT con su
     marcador de mini-duelos). null = sin datos para mostrar. */
  const challengeScore = (ctx, code) => {
    if (isConsolidated) {
      const challenge = ctx.duel.challenges?.find((c) => c.type === code);
      if (!challenge || challenge.scoreA === null) return null;
      return {
        left: ctx.leftIsDuelA ? challenge.scoreA : challenge.scoreB,
        right: ctx.leftIsDuelA ? challenge.scoreB : challenge.scoreA,
      };
    }
    if (code === "GDT") {
      if (!ctx.gdtDuel) return null;
      return {
        left: ctx.leftIsGdtA ? ctx.gdtDuel.score.a : ctx.gdtDuel.score.b,
        right: ctx.leftIsGdtA ? ctx.gdtDuel.score.b : ctx.gdtDuel.score.a,
      };
    }
    if (!ctx.partial) return null;
    const challenge = ctx.partial.challenges[code];
    return {
      left: ctx.leftIsPartialA ? challenge.a : challenge.b,
      right: ctx.leftIsPartialA ? challenge.b : challenge.a,
    };
  };

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

  /* Celda de partido: tone = color de FONDO (el 1X2 elegido); el número va
     coloreado por lo que dice el marcador. Nombre completo en el title */
  const matchCell = (pick, item) => {
    const hasScore =
      pick && pick.predictedHome !== null && pick.predictedAway !== null;
    const pickTone = pick?.pick1x2 ? PICK_TONE[pick.pick1x2] : null;
    const pickLabel =
      pick?.pick1x2 === "home"
        ? item.homeName
        : pick?.pick1x2 === "draw"
          ? "Empate"
          : pick?.pick1x2 === "away"
            ? item.awayName
            : null;

    if (!hasScore && !pickTone) {
      return { tone: null, content: <span className="prp-cmp-empty">—</span> };
    }
    const numTone = hasScore
      ? scoreTone(pick.predictedHome, pick.predictedAway)
      : pickTone;
    return {
      tone: pickTone,
      content: (
        <span
          className={`prp-cmp-score prp-cmp-score--${numTone}`}
          title={pickLabel ?? undefined}
        >
          {hasScore
            ? `${pick.predictedHome}-${pick.predictedAway}`
            : pickTone.toUpperCase()}
        </span>
      ),
    };
  };

  const questionCell = (pick) => ({
    tone: null,
    content: pick?.answerText ? (
      <span className="prp-cmp-answer">{pick.answerText}</span>
    ) : (
      <span className="prp-cmp-empty">—</span>
    ),
  });

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

  /* ---------- Detalle de un duelo (Mi duelo y desplegables de Todos) ---------- */

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

  const sideLabel = (side) => (side.isMe ? "Vos" : side.name);

  /* Cierre del duelo consolidado: quién lo ganó y qué puntos deja */
  const renderDuelVerdict = (ctx) => {
    const points = ctx.duel.points ?? {};
    const leftIsA = ctx.leftIsDuelA;
    const leftPts =
      ((leftIsA ? points.playerA : points.playerB) ?? 0) +
      ((leftIsA ? points.bonusA : points.bonusB) ?? 0);
    const leftBonus = (leftIsA ? points.bonusA : points.bonusB) ?? 0;
    const rightPts =
      ((leftIsA ? points.playerB : points.playerA) ?? 0) +
      ((leftIsA ? points.bonusB : points.bonusA) ?? 0);
    const rightBonus = (leftIsA ? points.bonusB : points.bonusA) ?? 0;
    const leftWon = ctx.duel.duelResult === (leftIsA ? "A" : "B");
    const isDraw = ctx.duel.duelResult === "draw";
    const winner = leftWon ? ctx.left : ctx.right;
    const winnerPts = leftWon ? leftPts : rightPts;
    const winnerBonus = leftWon ? leftBonus : rightBonus;

    const text = isDraw
      ? "Empate en el duelo · +1 pt cada uno"
      : winner.isMe
        ? `Ganaste el duelo · +${winnerPts} pts${
            winnerBonus > 0 ? " (incluye bonus)" : ""
          }`
        : `Ganó ${winner.name} · +${winnerPts} pts${
            winnerBonus > 0 ? " (incluye bonus)" : ""
          }`;

    /* En mi duelo el color cuenta MI suerte; en los ajenos, verde al ganador */
    const involvesMe = ctx.left.isMe || ctx.right.isMe;
    const tone = isDraw
      ? " prp-verdict--draw"
      : !involvesMe || winner.isMe
        ? " prp-verdict--won"
        : " prp-verdict--lost";

    return (
      <div className={`prp-verdict${tone}`}>
        <span className="prp-verdict-dot" />
        {text}
      </div>
    );
  };

  /* Tablero compacto: avatares a los costados, los marcadores apilados en
     el centro ENTRE los jugadores — sin espacio muerto */
  const renderDuelHero = (ctx) => (
    <div className="prp-duel-hero">
      <div className="prp-hero-side">
        {renderAvatar(ctx.left.id, ctx.left.name, { me: ctx.left.isMe })}
        <span className="prp-hero-side-name">{sideLabel(ctx.left)}</span>
      </div>

      <div className="prp-hero-center">
        {HERO_BLOCKS.map(({ code, label }) => {
          const score = challengeScore(ctx, code);
          let caption = null;

          if (!isConsolidated) {
            if (code === "GDT") {
              caption = ctx.gdtDuel
                ? `${11 - ctx.gdtDuel.score.pending} de 11 definidos`
                : "se define al consolidar";
            } else {
              const blockItems = items.filter((i) => i.challenge === code);
              if (blockItems.length === 0) return null;
              const settled = blockItems.filter(isItemSettled).length;
              caption = `${settled} de ${blockItems.length} definidos`;
            }
          } else if (!score) {
            return null;
          }

          return (
            <div className="prp-hero-ch" key={code}>
              <span className="prp-hero-label">{label}</span>
              <div className="prp-hero-score">
                {!score ? (
                  <span className="prp-hero-num prp-hero-num--pending">–</span>
                ) : (
                  <>
                    <span
                      className={`prp-hero-num${
                        score.left > score.right
                          ? " prp-hero-num--leading"
                          : ""
                      }`}
                    >
                      {score.left}
                    </span>
                    <span className="prp-hero-dash">–</span>
                    <span
                      className={`prp-hero-num${
                        score.right > score.left
                          ? " prp-hero-num--leading"
                          : ""
                      }`}
                    >
                      {score.right}
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
        {renderAvatar(ctx.right.id, ctx.right.name, { me: ctx.right.isMe })}
        <span className="prp-hero-side-name">{sideLabel(ctx.right)}</span>
      </div>

      {isConsolidated && ctx.duel.duelResult && renderDuelVerdict(ctx)}
    </div>
  );

  const renderDuelTable = (ctx, tableItems, { pending }) => (
    <div
      className={`prp-duel-table-wrap${
        pending ? "" : " prp-duel-table-wrap--settled"
      }`}
    >
      <table className="prp-duel-table">
        <thead>
          <tr>
            <th className="prp-dt-item" />
            <th className={ctx.left.isMe ? "prp-dt-th--me" : undefined}>
              {sideLabel(ctx.left)}
            </th>
            <th>{sideLabel(ctx.right)}</th>
          </tr>
        </thead>
        <tbody>
          {tableItems.map((item) => {
            const leftCell =
              item.kind === "match"
                ? matchCell(pickFor(ctx.left.id, item._id), item)
                : questionCell(pickFor(ctx.left.id, item._id));
            const rightCell =
              item.kind === "match"
                ? matchCell(pickFor(ctx.right.id, item._id), item)
                : questionCell(pickFor(ctx.right.id, item._id));
            /* Definidos: la celda replica las 3 filas de la metadata —
               primera vacía, resultado pronosticado, puntaje obtenido */
            const valClass =
              !pending && item.kind === "match"
                ? "prp-dt-val prp-dt-val--settled"
                : "prp-dt-val";
            return (
              <tr key={item._id}>
                <td className="prp-dt-item">
                  {item.kind === "match" && (
                    <div className="prp-dt-sub">
                      <span className="prp-dt-meta-league">
                        {item.leagueName}
                      </span>
                      {/* Cada tramo es un span y cada punto un sep: así
                          la separación es idéntica en todos (el gap del
                          flex), sin espacios de texto desparejos */}
                      {formatKickoff(item.kickoffAt)
                        .split(" · ")
                        .filter(Boolean)
                        .map((part, index) => (
                          <React.Fragment key={part}>
                            {(item.leagueName || index > 0) && (
                              <span className="prp-dt-meta-sep">·</span>
                            )}
                            <span className="prp-dt-meta-when">{part}</span>
                          </React.Fragment>
                        ))}
                    </div>
                  )}
                  <span
                    className="prp-dt-title"
                    title={`${itemTitle(item)} · ${itemMeta(item)}`}
                  >
                    {itemTitle(item)}
                  </span>
                  {item.kind === "match" ? (
                    <div className="prp-dt-points">
                      <span className="prp-cmp-score--l">
                        L {item.pointsHome}
                      </span>
                      <span className="prp-cmp-score--e">
                        E {item.pointsDraw}
                      </span>
                      <span className="prp-cmp-score--v">
                        V {item.pointsAway}
                      </span>
                      {!pending && renderItemResult(item)}
                    </div>
                  ) : (
                    !pending && (
                      <div className="prp-dt-sub">{renderItemResult(item)}</div>
                    )
                  )}
                </td>
                <td
                  className={`prp-dt-pick${
                    ctx.left.isMe ? " prp-dt-pick--me" : ""
                  }${leftCell.tone ? ` prp-dt-pick--${leftCell.tone}` : ""}`}
                >
                  <div className={valClass}>
                    {leftCell.content}
                    {renderPoints(ctx.left.id, item._id)}
                  </div>
                </td>
                <td
                  className={`prp-dt-pick${
                    rightCell.tone ? ` prp-dt-pick--${rightCell.tone}` : ""
                  }`}
                >
                  <div className={valClass}>
                    {rightCell.content}
                    {renderPoints(ctx.right.id, item._id)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ---------- Bloque Gran DT: mini-duelos slot a slot ---------- */

  /* Celda con el formato del comparador de planteles: foto + nombre con
     club debajo + puntaje a la derecha */
  const renderGdtSide = (side, winner) => {
    if (!side?.playerName) {
      return <span className="prp-cmp-empty">—</span>;
    }
    const pending = side.value === null || side.value === undefined;
    return (
      <div className="prp-gdt-cell">
        {side.photoUrl ? (
          <img
            className="prp-gdt-photo"
            src={side.photoUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="prp-gdt-photo prp-gdt-photo--initial">
            {side.playerName.charAt(0)}
          </span>
        )}
        <span className="prp-gdt-id">
          <span
            className={`prp-gdt-name${
              side.blocked ? " prp-gdt-name--blocked" : ""
            }`}
            title={
              side.blocked
                ? "Bloqueado por conflicto de club: vale 0 mientras dure"
                : undefined
            }
          >
            {side.playerName}
          </span>
          <span className="prp-gdt-club">{side.club}</span>
        </span>
        <span
          className={`prp-gdt-num${winner ? " prp-gdt-num--won" : ""}${
            pending ? " prp-gdt-num--pending" : ""
          }`}
        >
          {pending ? "—" : side.value}
        </span>
      </div>
    );
  };

  /* Los 11 mini-duelos en el orden de la formación (1 arquero, 2-5
     defensores, 6-9 volantes, 10-11 delanteros); ganador en verde,
     pendiente atenuado, bloqueado tachado */
  const renderGdtBlock = (ctx) => {
    if (!ctx.gdtDuel) return null;

    /* ARQ, DEF1..DEF4, VOL1..VOL4, DEL1, DEL2 */
    const slotLabels = gdtSlotLabels(ctx.gdtDuel.miniDuels);

    return (
      <section className="prp-block">
        <div className="prp-block-head">
          <div className="prp-block-name">Gran DT</div>
          <div className="prp-gdt-count">
            {11 - ctx.gdtDuel.score.pending} de 11 definidos
          </div>
        </div>
        <div className="prp-duel-table-wrap">
          <table className="prp-duel-table prp-duel-table--gdt">
            <thead>
              <tr>
                <th className="prp-dt-item" />
                <th className={ctx.left.isMe ? "prp-dt-th--me" : undefined}>
                  {sideLabel(ctx.left)}
                </th>
                <th>{sideLabel(ctx.right)}</th>
              </tr>
            </thead>
            <tbody>
              {ctx.gdtDuel.miniDuels.map((miniDuel, index, arr) => {
                const leftSide = ctx.leftIsGdtA ? miniDuel.a : miniDuel.b;
                const rightSide = ctx.leftIsGdtA ? miniDuel.b : miniDuel.a;
                const leftCode = ctx.leftIsGdtA ? "A" : "B";
                const rightCode = ctx.leftIsGdtA ? "B" : "A";
                /* Hairline entre bloques de posición */
                const isNewBlock =
                  index > 0 && arr[index - 1].position !== miniDuel.position;
                return (
                  <tr
                    key={miniDuel.slotNumber}
                    className={`${
                      miniDuel.result === null ? "prp-gdt-row--pending" : ""
                    }${isNewBlock ? " prp-gdt-row--block" : ""}`}
                  >
                    <td className="prp-dt-item">
                      <span className="prp-dt-title">{slotLabels[index]}</span>
                    </td>
                    <td
                      className={`prp-dt-pick${
                        ctx.left.isMe ? " prp-dt-pick--me" : ""
                      }`}
                    >
                      <div className="prp-dt-val">
                        {renderGdtSide(leftSide, miniDuel.result === leftCode)}
                      </div>
                    </td>
                    <td className="prp-dt-pick">
                      <div className="prp-dt-val">
                        {renderGdtSide(
                          rightSide,
                          miniDuel.result === rightCode,
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderDuelView = (ctx) => (
    <>
      {renderDuelHero(ctx)}

      {CHALLENGE_BLOCKS.map(({ code, title }) => {
        const blockItems = items.filter((i) => i.challenge === code);
        if (blockItems.length === 0) return null;
        const pendingItems = blockItems.filter((i) => !isItemSettled(i));
        const settledItems = blockItems.filter(isItemSettled);
        return (
          <section className="prp-block" key={code}>
            <div className="prp-block-head">
              <div className="prp-block-name">{title}</div>
              <div className="prp-cmp-legend">
                <span className="prp-cmp-score--l" title="Local">
                  L
                </span>
                <span className="prp-cmp-score--e" title="Empate">
                  E
                </span>
                <span className="prp-cmp-score--v" title="Visitante">
                  V
                </span>
              </div>
            </div>

            {pendingItems.length > 0 && (
              <>
                <div className="prp-sub-label prp-sub-label--live">
                  <span className="prp-sub-dot" />
                  En juego
                </div>
                {renderDuelTable(ctx, pendingItems, { pending: true })}
              </>
            )}

            {settledItems.length > 0 && (
              <>
                <div className="prp-sub-label">Definidos</div>
                {renderDuelTable(ctx, settledItems, { pending: false })}
              </>
            )}
          </section>
        );
      })}

      {renderGdtBlock(ctx)}
    </>
  );

  /* ---------- Vista Todos: los duelos de la fecha, desplegables ---------- */

  const toggleDuel = (key) => {
    setOpenDuels((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* Mi duelo primero, el resto en el orden del fixture */
  const orderedDuels = [...(matchday.duels ?? [])].sort((a, b) => {
    const involvesMe = (duel) =>
      toId(duel.playerA) === String(myPlayerId) ||
      toId(duel.playerB) === String(myPlayerId)
        ? 1
        : 0;
    return involvesMe(b) - involvesMe(a);
  });

  const renderAllView = () => (
    <div className="prp-ad-list">
      <div className="prp-totals-title">Los duelos de la fecha</div>
      {orderedDuels.map((duel) => {
        const ctx = buildDuelCtx(duel);
        const key = ctx.left.id;
        const isOpen = openDuels.has(key);
        const involvesMe = ctx.left.isMe || ctx.right.isMe;
        return (
          <div
            className={`prp-ad${involvesMe ? " prp-ad--me" : ""}`}
            key={key}
          >
            <button
              type="button"
              className="prp-ad-head"
              onClick={() => toggleDuel(key)}
              aria-expanded={isOpen}
            >
              <span className="prp-ad-name prp-ad-name--a">
                {ctx.left.name}
                {ctx.left.isMe ? " (vos)" : ""}
              </span>
              <span className="prp-ad-scores">
                {SUMMARY_BLOCKS.map(({ code, label }) => {
                  const score = challengeScore(ctx, code);
                  return (
                    <span className="prp-ad-ch" key={code}>
                      <span className="prp-ad-ch-label">{label}</span>
                      {!score ? (
                        <span className="prp-ad-num prp-ad-num--pending">
                          –
                        </span>
                      ) : (
                        <>
                          <span
                            className={`prp-ad-num${
                              score.left > score.right
                                ? " prp-ad-num--lead"
                                : ""
                            }`}
                          >
                            {score.left}
                          </span>
                          <span className="prp-ad-dash">–</span>
                          <span
                            className={`prp-ad-num${
                              score.right > score.left
                                ? " prp-ad-num--lead"
                                : ""
                            }`}
                          >
                            {score.right}
                          </span>
                        </>
                      )}
                    </span>
                  );
                })}
              </span>
              <span className="prp-ad-name prp-ad-name--b">
                {ctx.right.name}
                {ctx.right.isMe ? " (vos)" : ""}
              </span>
              <span
                className={`prp-ad-chevron${
                  isOpen ? " prp-ad-chevron--open" : ""
                }`}
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="prp-ad-body">{renderDuelView(ctx)}</div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ---------- Vista Resumen (admin): foto de la fecha para el grupo ----------
     Escueta y pensada para captura de pantalla: una tabla por prode con
     TODOS los participantes y sus puntos de la fecha, y abajo el marcador
     de cada duelo. El GDT queda pendiente. */

  const summaryRanking = (code) =>
    summaryPlayers
      .map((player) => ({
        ...player,
        points: partials?.totals?.[player.id]?.[code] ?? 0,
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  /* Marcador de un desafío en el orden canónico A vs B del fixture (sin el
     flip de "mi lado primero" que hace buildDuelCtx) */
  const summaryDuelScore = (duel, code) => {
    if (isConsolidated) {
      const challenge = duel.challenges?.find((c) => c.type === code);
      if (!challenge || challenge.scoreA === null) return null;
      return { a: challenge.scoreA, b: challenge.scoreB };
    }
    const partial = partials?.duels?.find(
      (d) => d.playerA === toId(duel.playerA),
    );
    if (!partial) return null;
    return { a: partial.challenges[code].a, b: partial.challenges[code].b };
  };

  /* Duelo GDT completo (marcador de mini-duelos + los 11 slot a slot) en el
     orden canónico A vs B. Siempre desde los parciales, también con la fecha
     consolidada: así el marcador y el detalle de abajo salen del mismo
     cálculo y no pueden contradecirse. */
  const summaryGdtDuel = (duel) =>
    partials?.gdt?.duels?.find((d) => d.playerA === toId(duel.playerA)) ?? null;

  /* Valor efectivo del slot en su mini-duelo: sin puntaje cargado, pendiente */
  const gdtSideValue = (side) =>
    side?.value === null || side?.value === undefined ? "—" : side.value;

  const gdtSideClass = (result, code) => {
    const base = "prp-sum-md-side";
    if (result === null || result === "draw") return base;
    return result === code ? `${base} prp-sum-md-side--win` : base;
  };

  /* Sin puntaje cargado el número se apaga: un "—" con el mismo peso que un
     número real se lee como si fuera un dato */
  const gdtPtsClass = (side) =>
    side?.value === null || side?.value === undefined
      ? "prp-sum-md-pts prp-sum-md-pts--empty"
      : "prp-sum-md-pts";

  /* Ganó / perdió / empató un lado del duelo en ese prode. Sin marcador
     todavía, los dos lados quedan neutros. */
  const duelSideClass = (score, side) => {
    const base = "prp-sum-duel-side";
    /* El empate NO se distingue con color: ya lo dice el marcador. El ámbar
       queda reservado para "pendiente", que no tiene ninguna otra señal. */
    if (!score || score.a === score.b) return base;
    const winner = score.a > score.b ? "a" : "b";
    return winner === side
      ? `${base} prp-sum-duel-side--win`
      : `${base} prp-sum-duel-side--lose`;
  };

  /* Duelos con datos GDT (una fecha sin universo no los tiene). Se resuelve
     antes de renderizar para saber si hace falta la columna de relleno. */
  const gdtRows = (matchday.duels ?? [])
    .map((duel) => ({ duel, gdtDuel: summaryGdtDuel(duel) }))
    .filter((row) => row.gdtDuel);

  const renderSummaryView = () => (
    <div className="prp-sum">
      <div className="prp-sum-head">
        <span className="prp-sum-title">Fecha {matchday.roundNumber}</span>
        <span className="prp-sum-state">
          {isConsolidated ? "Consolidada" : "En juego"}
        </span>
      </div>

      {/* Estructura duplicada a propósito (pedido del dueño): cada prode
          con su ranking y, debajo, SUS duelos con el marcador de ese prode */}
      {CHALLENGE_BLOCKS.map(({ code, title }) => {
        const ranking = summaryRanking(code);
        const topPoints = ranking[0]?.points ?? 0;
        /* Mismo criterio y wording que el hero del duelo, para que no digan
           cosas distintas sobre la misma fecha */
        const blockItems = items.filter((i) => i.challenge === code);
        const settled = blockItems.filter(isItemSettled).length;
        const isComplete = blockItems.length > 0 && settled === blockItems.length;
        return (
          <section className="prp-sum-block" key={code}>
            <div className="prp-sum-block-head">
              <span className="prp-sum-block-title">{title}</span>
              {blockItems.length > 0 && (
                <span
                  className={`prp-sum-pill${
                    isComplete ? " prp-sum-pill--done" : ""
                  }`}
                >
                  {settled} de {blockItems.length} definidos
                </span>
              )}
            </div>

            <table className="prp-sum-table">
              <tbody>
                {ranking.map((player, index) => {
                  const isLeader = topPoints > 0 && player.points === topPoints;
                  return (
                    <tr
                      key={player.id}
                      className={isLeader ? "prp-sum-row--leader" : undefined}
                    >
                      <td className="prp-sum-pos">{index + 1}</td>
                      <td className="prp-sum-name">
                        <span
                          className="prp-sum-bar"
                          style={{
                            width: topPoints
                              ? `${(player.points / topPoints) * 100}%`
                              : "0%",
                          }}
                        />
                        <span className="prp-sum-name-text">{player.name}</span>
                      </td>
                      <td className="prp-sum-pts">{player.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="prp-sum-duels">
              {(matchday.duels ?? []).map((duel) => {
                const score = summaryDuelScore(duel, code);
                return (
                  <div className="prp-sum-duel" key={toId(duel.playerA)}>
                    <span className={duelSideClass(score, "a")}>
                      {duel.playerA?.name ?? "?"}
                    </span>
                    <span className="prp-sum-duel-score">
                      {score ? `${score.a} – ${score.b}` : "—"}
                    </span>
                    <span className={duelSideClass(score, "b")}>
                      {duel.playerB?.name ?? "?"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Gran DT: sin ranking propio (el número de cada participante ES el
          resultado de su duelo), pero con los planteles enfrentados slot a
          slot y el puntaje de cada mini-duelo. */}
      {partials?.gdt && (
        <section className="prp-sum-block prp-sum-block--wide">
          <div className="prp-sum-block-head">
            <span className="prp-sum-block-title">Gran DT</span>
          </div>
          <div className="prp-sum-gdt-grid">
            {gdtRows.map(({ duel, gdtDuel }) => {
              const score = { a: gdtDuel.score.a, b: gdtDuel.score.b };
              const { pending } = gdtDuel.score;
              const labels = gdtSlotLabels(gdtDuel.miniDuels);
              return (
                <div className="prp-sum-gdt-duel" key={toId(duel.playerA)}>
                  <div className="prp-sum-gdt-head">
                    <div className="prp-sum-duel">
                      <span className={duelSideClass(score, "a")}>
                        {duel.playerA?.name ?? "?"}
                      </span>
                      <span className="prp-sum-duel-score">
                        {score.a} – {score.b}
                      </span>
                      <span className={duelSideClass(score, "b")}>
                        {duel.playerB?.name ?? "?"}
                      </span>
                    </div>
                    {pending > 0 && (
                      <div className="prp-sum-gdt-pending">
                        {/* La MISMA pill que marca cada fila: es lo que ata el
                            copete con los mini-duelos que cuenta */}
                        <span className="prp-sum-md-pill" />
                        {pending}{" "}
                        {pending === 1
                          ? "mini-duelo pendiente"
                          : "mini-duelos pendientes"}
                      </div>
                    )}
                  </div>

                  {gdtDuel.miniDuels.map((miniDuel, index, arr) => {
                    /* Hairline al cambiar de línea de la formación: da el
                       ritmo 1 / 4 / 4 / 2 en vez de 11 filas iguales */
                    const isNewLine =
                      index > 0 &&
                      arr[index - 1].position !== miniDuel.position;
                    return (
                      <div
                        className={`prp-sum-md${
                          isNewLine ? " prp-sum-md--line" : ""
                        }${
                          miniDuel.result === null
                            ? " prp-sum-md--pending"
                            : ""
                        }`}
                        key={miniDuel.slotNumber}
                      >
                        <span className="prp-sum-md-flag">
                          {miniDuel.result === null && (
                            <span
                              className="prp-sum-md-pill"
                              title="Mini-duelo pendiente: falta cargar algún puntaje"
                            />
                          )}
                        </span>
                        <span className={gdtSideClass(miniDuel.result, "A")}>
                          <span className="prp-sum-md-name">
                            {miniDuel.a?.playerName ?? "—"}
                          </span>
                          <span className={gdtPtsClass(miniDuel.a)}>
                            {gdtSideValue(miniDuel.a)}
                          </span>
                        </span>
                        <span className="prp-sum-md-slot">{labels[index]}</span>
                        <span className={gdtSideClass(miniDuel.result, "B")}>
                          <span className={gdtPtsClass(miniDuel.b)}>
                            {gdtSideValue(miniDuel.b)}
                          </span>
                          <span className="prp-sum-md-name">
                            {miniDuel.b?.playerName ?? "—"}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {gdtRows.length % 2 === 1 && (
              <div className="prp-sum-gdt-spacer" aria-hidden="true" />
            )}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <>
      {(myDuel || isAdmin) && (
        <div className="prp-tabs">
          {myDuel && (
            <button
              type="button"
              className={`prp-tab${view === "duel" ? " prp-tab--active" : ""}`}
              onClick={() => setView("duel")}
            >
              Mi duelo
            </button>
          )}
          <button
            type="button"
            className={`prp-tab${view === "all" ? " prp-tab--active" : ""}`}
            onClick={() => setView("all")}
          >
            Todos
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`prp-tab${view === "summary" ? " prp-tab--active" : ""}`}
              onClick={() => setView("summary")}
            >
              Resumen
            </button>
          )}
        </div>
      )}

      {isAdmin && view === "summary"
        ? renderSummaryView()
        : myDuel && view === "duel"
          ? renderDuelView(buildDuelCtx(myDuel))
          : renderAllView()}
    </>
  );
};

export default ProdeMatchdayCompare;
