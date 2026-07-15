// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import InfoTip from "../InfoTip";

//Import React Query functions
import fetchProdeMatchdayGdtBoard from "../../../../reactquery/prode/fetchProdeMatchdayGdtBoard";
import saveProdeMatchdayGdtScores from "../../../../reactquery/prode/saveProdeMatchdayGdtScores";

const POSITION_LABELS = {
  ARQ: "Arquero",
  DEF: "Defensor",
  VOL: "Volante",
  DEL: "Delantero",
};

const isValidPoints = (value) =>
  value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

/* Foto del jugador con inicial de fallback (mismo patrón del pool) */
const PlayerPhoto = ({ player }) =>
  player.photoUrl ? (
    <img className="pri-photo" src={player.photoUrl} alt="" loading="lazy" />
  ) : (
    <span className="pri-photo pri-photo--initial">
      {(player.name ?? "?").charAt(0).toUpperCase()}
    </span>
  );

/* Carga de puntajes GDT de la fecha (en juego; solo lectura consolidada):
   UN número por jugador real —diario + bonus ya sumados—, replicado a todos
   los planteles que lo tengan. Sin puntaje = mini-duelo pendiente en los
   parciales (y 0 recién al consolidar). Incluye el tablero de mini-duelos
   slot vs slot por duelo. */
const ProdeMatchdayGdtScores = ({ matchday }) => {
  const queryClient = useQueryClient();
  const readOnly = matchday.phase !== "in_play";

  const [values, setValues] = useState({});
  const [clubFilter, setClubFilter] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: board,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-matchday-gdt-board", matchday._id],
    queryFn: () => fetchProdeMatchdayGdtBoard(matchday._id),
  });

  const players = useMemo(() => board?.players ?? [], [board]);

  /* Estado local desde el server SIN pisar lo tipeado a medio guardar
     (refetch por re-foco de ventana): lo local siempre gana */
  useEffect(() => {
    if (players.length === 0) return;
    setValues((prev) => {
      const next = {};
      for (const player of players) {
        next[player._id] = player.points === null ? "" : String(player.points);
      }
      return { ...next, ...prev };
    });
  }, [players]);

  const serverValueOf = (player) =>
    player.points === null ? "" : String(player.points);

  const dirty = players.some(
    (player) => (values[player._id] ?? "") !== serverValueOf(player),
  );

  const loadedCount = players.filter((player) =>
    isValidPoints(values[player._id] ?? ""),
  ).length;

  const clubs = useMemo(
    () =>
      [...new Set(players.map((player) => player.club).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [players],
  );

  const normalized = (text) =>
    (text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

  const visiblePlayers = players.filter((player) => {
    if (clubFilter && player.club !== clubFilter) return false;
    if (search && !normalized(player.name).includes(normalized(search))) {
      return false;
    }
    return true;
  });

  /* Bandas por CLUB (los jugadores ya vienen del server ordenados por club
     y, adentro, arquero → defensores → volantes → delanteros) */
  const groups = [];
  for (const player of visiblePlayers) {
    const title = player.club || "Sin club";
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      last.players.push(player);
    } else {
      groups.push({ title, players: [player] });
    }
  }

  const saveMutation = useMutation({
    mutationFn: saveProdeMatchdayGdtScores,
    onSuccess: () => {
      toast.success("Puntajes GDT guardados");
      queryClient.invalidateQueries(["prode-matchday-gdt-board", matchday._id]);
      queryClient.invalidateQueries(["prode-matchday", matchday._id]);
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Error al guardar los puntajes");
    },
  });

  const setPoints = (playerId, value) => {
    setValues((prev) => ({ ...prev, [playerId]: value }));
  };

  const handleSave = () => {
    const scores = [];
    for (const player of players) {
      const value = values[player._id] ?? "";
      if (value === "") continue;
      if (!isValidPoints(value)) {
        toast.error(
          `El puntaje de ${player.name} debe ser un entero de 0 o más`,
        );
        return;
      }
      scores.push({ realPlayer: player._id, points: Number(value) });
    }
    saveMutation.mutate({ matchdayId: matchday._id, scores });
  };

  const scoreInput = (player, extraClass = "") => {
    const value = values[player._id] ?? "";
    const saved = value !== "" && value === serverValueOf(player);
    return (
      <input
        type="number"
        min="0"
        inputMode="numeric"
        aria-label={`Puntaje de ${player.name}`}
        className={`${saved ? "prf-rt-input--done" : ""} ${extraClass}`.trim()}
        value={value}
        disabled={readOnly}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setPoints(player._id, e.target.value)}
      />
    );
  };

  /* Lado de un mini-duelo: nombre + valor efectivo (bloqueado→0, sin
     puntaje→"—" pendiente), el ganador resaltado */
  const miniDuelSide = (side, winner) => {
    if (!side?.playerName) {
      return <span className="prf-gdt-md-side">—</span>;
    }
    return (
      <span
        className={`prf-gdt-md-side ${winner ? "prf-gdt-md-side--winner" : ""}`}
      >
        <span
          className={`prf-gdt-md-name ${side.blocked ? "prf-gdt-md-name--blocked" : ""}`}
          title={
            side.blocked
              ? "Bloqueado por el admin: vale 0 mientras dure el conflicto"
              : side.club
          }
        >
          {side.playerName}
        </span>
        <span className="prf-gdt-md-pts">
          {side.value === null || side.value === undefined ? "—" : side.value}
        </span>
      </span>
    );
  };

  return (
    <>
      {saveMutation.isPending && <SpinnerOverlay />}

      <section className="prf-form">
        <div className="prf-card-title">
          Puntajes del Gran DT · {board?.universe?.label ?? "GDT"}
          <InfoTip text="Un número final por jugador (diario + bonus ya sumados): se replica en todos los planteles que lo tengan. Sin puntaje el mini-duelo queda pendiente; si alguien no jugó, cargale 0. La fecha no puede consolidarse hasta que todos tengan puntaje." />
          <span className="prf-card-count">
            {plural(loadedCount, "jugador", "jugadores")} con puntaje de{" "}
            {players.length}
          </span>
        </div>

        {isLoading && <p className="prf-hint">Cargando tablero GDT...</p>}
        {isError && (
          <p className="prf-hint">
            {error?.message || "Error al obtener el tablero GDT"}
          </p>
        )}

        {board && (
          <>
            <div className="pri-filter-row">
              <select
                className="pri-filter"
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
              >
                <option value="">Todos los clubes</option>
                {clubs.map((club) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>
              <input
                className="pri-search-input"
                type="text"
                placeholder="Buscar jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="pri-filter-count">
                {visiblePlayers.length} de {players.length}
              </span>
            </div>

            {/* Desktop: tabla compacta con bandas por posición */}
            <div className="prf-rt-wrap prf-rt-desktop">
              <table className="prf-results-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Posición</th>
                    <th className="prf-gdt-col-count">Planteles</th>
                    <th className="prf-rt-col-score">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <React.Fragment key={group.title}>
                      <tr className="prf-rt-group prf-rt-group--manual">
                        <td colSpan={4}>
                          {group.title}
                          <span className="prf-card-count">
                            {
                              group.players.filter((player) =>
                                isValidPoints(values[player._id] ?? ""),
                              ).length
                            }{" "}
                            de {group.players.length} con puntaje
                          </span>
                        </td>
                      </tr>
                      {group.players.map((player, index) => (
                        <tr
                          key={player._id}
                          className={index % 2 === 1 ? "prf-rt-row--alt" : ""}
                        >
                          <td className="prf-rt-match">
                            <div className="prf-rt-match-inner">
                              <div className="pri-cell-player">
                                <PlayerPhoto player={player} />
                                <span className="prf-rt-teams">
                                  {player.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="prf-gdt-club">
                            {POSITION_LABELS[player.position] ??
                              "Sin posición"}
                          </td>
                          <td className="prf-gdt-count">
                            {player.squadCount}
                          </td>
                          <td className="prf-rt-score">
                            {scoreInput(player)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: filas compactas */}
            <div className="prf-rt-mobile">
              {groups.map((group) => (
                <React.Fragment key={group.title}>
                  <div className="prf-gdt-mgroup">{group.title}</div>
                  {group.players.map((player) => (
                    <div className="prf-gdt-mrow" key={player._id}>
                      <PlayerPhoto player={player} />
                      <div className="prf-gdt-mtext">
                        <div className="prf-gdt-mname">{player.name}</div>
                        <div className="prf-gdt-mclub">
                          {POSITION_LABELS[player.position] ?? "Sin posición"}
                        </div>
                      </div>
                      {scoreInput(player, "prf-gdt-minput")}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {!readOnly && (
              <div className="prf-gdt-savebar">
                <button
                  type="button"
                  className="prf-submit-btn"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !dirty}
                >
                  {saveMutation.isPending
                    ? "Guardando..."
                    : "Guardar puntajes"}
                </button>
                {dirty && (
                  <span className="prf-gdt-dirty">Cambios sin guardar</span>
                )}
              </div>
            )}

            {/* Mini-duelos slot vs slot por duelo */}
            <div className="prf-gdt-duels">
              <div className="prf-gdt-duels-title">
                Mini-duelos
                <InfoTip text="Slot contra slot (1 a 11). Un mini-duelo se define solo cuando ambos lados tienen valor: puntaje cargado o jugador bloqueado (vale 0). El empate no lo gana nadie. El desafío GDT del duelo es la cantidad de mini-duelos ganados por cada uno." />
              </div>
              {(board.duels ?? []).map((duel, index) => (
                <details className="prf-gdt-duel" key={index}>
                  <summary>
                    <span className="prf-gdt-duel-names">
                      {duel.playerA.name} vs {duel.playerB.name}
                    </span>
                    <span className="prf-gdt-duel-score">
                      {duel.score.a}–{duel.score.b}
                      {duel.score.pending > 0 && (
                        <span className="prf-gdt-duel-pending">
                          · {plural(duel.score.pending, "pendiente", "pendientes")}
                        </span>
                      )}
                    </span>
                  </summary>
                  <div className="prf-gdt-md-list">
                    {duel.miniDuels.map((miniDuel) => {
                      const pending = miniDuel.result === null;
                      return (
                        <div
                          className={`prf-gdt-md-row ${pending ? "prf-gdt-md-row--pending" : ""}`}
                          key={miniDuel.slotNumber}
                        >
                          <span className="prf-gdt-md-slot">
                            {miniDuel.slotNumber} · {miniDuel.position}
                          </span>
                          {miniDuelSide(
                            miniDuel.a,
                            pending
                              ? miniDuel.a?.blocked
                                ? 0
                                : (miniDuel.a?.points ?? null)
                              : (miniDuel.a?.blocked
                                  ? 0
                                  : (miniDuel.a?.points ?? 0)),
                            miniDuel.result === "A",
                          )}
                          <span className="prf-gdt-md-vs">vs</span>
                          {miniDuelSide(
                            miniDuel.b,
                            pending
                              ? miniDuel.b?.blocked
                                ? 0
                                : (miniDuel.b?.points ?? null)
                              : (miniDuel.b?.blocked
                                  ? 0
                                  : (miniDuel.b?.points ?? 0)),
                            miniDuel.result === "B",
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default ProdeMatchdayGdtScores;
