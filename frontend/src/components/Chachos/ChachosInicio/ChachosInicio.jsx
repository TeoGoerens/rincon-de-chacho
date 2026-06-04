import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import ChachosMenu              from "../ChachosMenu";
import fetchCurrentContext      from "../../../reactquery/chachos/fetchCurrentContext";
import fetchVoteByVoterAndRound from "../../../reactquery/chachos/fetchVoteByVoterAndRound";
import createVote               from "../../../reactquery/chachos/createVote";
import { getUserId }            from "../../../reactquery/getUserInformation";
import "./ChachosInicioStyles.css";

/* ─── Constantes ─── */
const PEARL_OPTIONS = [
  { key: "white_pearl",   emoji: "⚪", label: "Perla Blanca"  },
  { key: "vanilla_pearl", emoji: "🟡", label: "Perla Vainilla" },
  { key: "ocher_pearl",   emoji: "🟠", label: "Perla Ocre"    },
  { key: "black_pearl",   emoji: "⚫", label: "Perla Negra"   },
];

const RANKING_COLS = [
  { key: "matches",      label: "PJ",         short: "PJ",  decimals: 0 },
  { key: "goals",        label: "Goles",       short: "G",   decimals: 0 },
  { key: "assists",      label: "Asistencias", short: "A",   decimals: 0 },
  { key: "yellow_cards", label: "Amarillas",   short: "Am",  decimals: 0 },
  { key: "red_cards",    label: "Rojas",       short: "R",   decimals: 0 },
  { key: "avg_points",   label: "Puntaje",     short: "Pts", decimals: 2 },
];

/* ─── Helpers ─── */
const getOutcome = (r) => {
  if (!r) return null;
  if (r.win)    return { label: "Victoria", cls: "win"    };
  if (r.draw)   return { label: "Empate",   cls: "draw"   };
  if (r.defeat) return { label: "Derrota",  cls: "defeat" };
  return null;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

const scrollToVote = () => {
  const el = document.getElementById("ci-vote-form");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: "smooth" });
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const ChachosInicio = () => {
  const [sortKey, setSortKey] = useState("avg_points");
  const queryClient = useQueryClient();
  const userId = getUserId();

  /* ── Datos base (contexto vigente) ── */
  const { data: contextData, isLoading: loadingRounds } = useQuery({
    queryKey: ["chachos-current-context"],
    queryFn:  fetchCurrentContext,
  });

  const lastRound      = contextData?.lastRound ?? null;
  const roundStats     = contextData?.lastRoundStats ?? [];
  const playerPictures = contextData?.playerPictures ?? {};
  const seasonRounds   = useMemo(() => contextData?.seasonRounds ?? [], [contextData]);

  const isOpen    = !!lastRound?.open_for_vote;
  const hasStats  = !!lastRound?.complete_stats;
  const outcome   = getOutcome(lastRound);
  const players   = lastRound?.players ?? [];

  const currentTournamentName = lastRound?.tournament?.name ?? "";
  const currentYear           = lastRound?.year ?? null;

  const recentRounds       = useMemo(() => seasonRounds.slice(0, 5), [seasonRounds]);
  const rankingsByCategory = contextData?.rankings ?? [];

  /* ── Resumen temporada (torneo vigente) ── */
  const seasonStats = useMemo(() => {
    const pj  = seasonRounds.length;
    const pg  = seasonRounds.filter((r) => r.win).length;
    const pe  = seasonRounds.filter((r) => r.draw).length;
    const pp  = seasonRounds.filter((r) => r.defeat).length;
    const gf  = seasonRounds.reduce((a, r) => a + (r.score_chachos ?? 0), 0);
    const gc  = seasonRounds.reduce((a, r) => a + (r.score_rival   ?? 0), 0);
    const gd  = gf - gc;
    const pct = pj > 0 ? Math.round((pg / pj) * 100) : 0;
    return { pj, pg, pe, pp, gf, gc, gd, pct };
  }, [seasonRounds]);

  /* ── Voto del usuario ── */
  const { data: voteData } = useQuery({
    queryKey: ["ci-my-vote", lastRound?._id, userId],
    queryFn:  () => fetchVoteByVoterAndRound(lastRound._id),
    enabled:  isOpen && !!userId && !!lastRound?._id,
    retry:    false,
  });
  const alreadyVoted = !!voteData?.usersVote;

  /* ── Players con stats del partido ── */
  const playersWithStats = useMemo(() =>
    players.map((player) => {
      const stat = roundStats.find((s) => {
        const sid = s.player?._id ?? s.player;
        return sid?.toString() === player._id?.toString();
      });
      return {
        ...player,
        goals:        stat?.goals        ?? 0,
        assists:      stat?.assists      ?? 0,
        yellow_cards: stat?.yellow_cards ?? 0,
        red_cards:    stat?.red_cards    ?? 0,
        points:       stat?.points       ?? null,
      };
    }),
  [players, roundStats]);

  /* ── Highlights del partido ── */
  const highlights = useMemo(() => {
    if (!hasStats || !roundStats.length) return null;
    return {
      scorers:   playersWithStats.filter((p) => p.goals > 0),
      assisters: playersWithStats.filter((p) => p.assists > 0),
      yellows:   playersWithStats.filter((p) => p.yellow_cards > 0),
      reds:      playersWithStats.filter((p) => p.red_cards > 0),
    };
  }, [hasStats, roundStats.length, playersWithStats]);

/* ── Formulario de voto ── */
  const [scores, setScores] = useState({});
  const [pearls, setPearls] = useState({ white_pearl: "", vanilla_pearl: "", ocher_pearl: "", black_pearl: "" });

  useEffect(() => {
    if (players.length > 0)
      setScores(Object.fromEntries(players.map((p) => [p._id, ""])));
  }, [lastRound?._id]);

  const togglePearl = (pearlKey, playerId) => {
    setPearls((prev) => ({
      ...prev,
      [pearlKey]: prev[pearlKey] === playerId ? "" : playerId,
    }));
  };

  const allScoresFilled = players.every((p) => {
    const v = scores[p._id];
    return v !== "" && v !== undefined && !isNaN(parseFloat(v));
  });
  const allPearlsFilled = PEARL_OPTIONS.every((p) => !!pearls[p.key]);
  const canSubmit = allScoresFilled && allPearlsFilled;

  const voteMutation = useMutation({
    mutationFn: (payload) => createVote(payload),
    onSuccess: () => {
      toast.success("¡Voto registrado correctamente!");
      queryClient.invalidateQueries(["ci-my-vote", lastRound._id, userId]);
    },
    onError: (err) => toast.error(`Error al votar: ${err.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    voteMutation.mutate({
      roundId:    lastRound._id,
      evaluation: players.map((p) => ({ player: p._id, points: parseFloat(scores[p._id]) })),
      ...pearls,
    });
  };

  /* ── Render ── */
  if (loadingRounds) return (
    <>
      <ChachosMenu />
      <div className="ci"><p className="ci-empty">Cargando...</p></div>
    </>
  );

  return (
    <>
      <ChachosMenu />
      <div className="ci">

        {/* Header */}
        <div className="ci-header">
          <div className="ci-eyebrow"><span className="ci-eyebrow-dot" />Chachos</div>
          <h1 className="ci-title">Inicio</h1>
        </div>

        {lastRound && (
          <>
            {/* ── 1. Hero del partido ── */}
            <h2 className="ci-section-heading">Último partido</h2>
            <div className={`ci-hero ci-hero--${outcome?.cls ?? "neutral"}`}>
              <div className="ci-hero-left">
                {currentTournamentName && (
                  <span className="ci-hero-tournament">{currentTournamentName}</span>
                )}
                <h2 className="ci-hero-rival">vs {lastRound.rival?.name ?? "—"}</h2>
                <p className="ci-hero-date">{fmtDate(lastRound.match_date)}</p>
              </div>
              <div className="ci-hero-right">
                <span className="ci-hero-score">
                  {lastRound.score_chachos} - {lastRound.score_rival}
                </span>
                {outcome && (
                  <span className={`ci-badge ci-badge--${outcome.cls}`}>{outcome.label}</span>
                )}
              </div>

              {/* Highlights del partido */}
              {hasStats && (
                <div className="ci-hero-highlights">
                  {[
                    {
                      icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-chachos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 2a10 10 0 0 1 6.16 2.1L12 8.5 5.84 4.1A10 10 0 0 1 12 2z"/>
                          <path d="M2.46 8.5H8.5l2 6-5.06 3.68A10 10 0 0 1 2.46 8.5z"/>
                          <path d="M21.54 8.5a10 10 0 0 1-2.98 9.18L13.5 14.5l2-6h6.04z"/>
                          <path d="M8.5 14.5 12 22l3.5-7.5"/>
                        </svg>
                      ),
                      label: "Goles",       items: highlights?.scorers   ?? [], fmt: (p) => `${p.first_name} ${p.last_name} (${p.goals})`
                    },
                    {
                      icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-chachos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"/>
                          <path d="m12 5 7 7-7 7"/>
                        </svg>
                      ),
                      label: "Asistencias", items: highlights?.assisters ?? [], fmt: (p) => `${p.first_name} ${p.last_name} (${p.assists})`
                    },
                    {
                      icon: (
                        <svg width="11" height="14" viewBox="0 0 11 14" fill="var(--color-podrida)" stroke="none">
                          <rect x="0" y="0" width="11" height="14" rx="2"/>
                        </svg>
                      ),
                      label: "Amarillas",   items: highlights?.yellows   ?? [], fmt: (p) => `${p.first_name} ${p.last_name} (${p.yellow_cards})`
                    },
                    {
                      icon: (
                        <svg width="11" height="14" viewBox="0 0 11 14" fill="var(--color-cronicas)" stroke="none">
                          <rect x="0" y="0" width="11" height="14" rx="2"/>
                        </svg>
                      ),
                      label: "Rojas",       items: highlights?.reds      ?? [], fmt: (p) => `${p.first_name} ${p.last_name} (${p.red_cards})`
                    },
                  ].map(({ icon, label, items, fmt }) => (
                    <div key={label} className="ci-hl-row">
                      <span className="ci-hl-label">{icon}{label}</span>
                      <span className="ci-hl-names">
                        {items.length > 0 ? items.map(fmt).join(" — ") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 2. Banner de votación ── */}
            {isOpen && !alreadyVoted && (
              <div className="ci-vote-banner">
                <div className="ci-vote-banner-left">
                  <span className="ci-vote-pulse" />
                  <div>
                    <span className="ci-vote-banner-tag">Votación abierta</span>
                    <p className="ci-vote-banner-msg">
                      Completá el puntaje de cada jugador y nominá las 4 perlas
                    </p>
                  </div>
                </div>
                <button type="button" className="ci-vote-btn" onClick={scrollToVote}>
                  Ir a votar ↓
                </button>
              </div>
            )}

            {isOpen && alreadyVoted && (
              <div className="ci-vote-banner ci-vote-banner--voted">
                <div className="ci-vote-banner-left">
                  <span className="ci-vote-pulse ci-vote-pulse--green" />
                  <div>
                    <span className="ci-vote-banner-tag ci-vote-banner-tag--green">Votación abierta</span>
                    <p className="ci-vote-banner-msg">Ya registraste tu voto en esta fecha</p>
                  </div>
                </div>
                <div className="ci-voted-check">
                  <span className="material-symbols-outlined">check_circle</span>
                  Votado
                </div>
              </div>
            )}

            {/* ── 3. Formulario de voto ── */}
            {isOpen && !alreadyVoted && (
              <form id="ci-vote-form" onSubmit={handleSubmit} className="ci-card ci-vote-form">
                <span className="ci-card-label">Tu voto</span>
                <p className="ci-vote-hint">
                  Puntaje del 1 al 10 · Clic en el emoji para nominar la perla
                </p>

                <div className="ci-vote-table">
                  <div className="ci-vote-table-head">
                    <span></span>
                    <span>Jugador</span>
                    <span className="ci-vt-center">Puntaje</span>
                    {PEARL_OPTIONS.map((p) => (
                      <span key={p.key} className="ci-vt-center" title={p.label}>{p.emoji}</span>
                    ))}
                  </div>

                  {players.map((player) => (
                    <div key={player._id} className="ci-vote-table-row">
                      <span className="ci-player-shirt">{player.shirt}</span>
                      <span className="ci-player-name">{player.first_name} {player.last_name}</span>
                      <div className="ci-vt-center">
                        <input
                          type="number"
                          className="ci-score-input"
                          min="1" max="10" step="0.5"
                          placeholder="–"
                          value={scores[player._id] ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({ ...prev, [player._id]: e.target.value }))
                          }
                        />
                      </div>
                      {PEARL_OPTIONS.map((pearl) => {
                        const selected = pearls[pearl.key] === player._id;
                        const blocked  = !selected && PEARL_OPTIONS.some(
                          (p) => p.key !== pearl.key && pearls[p.key] === player._id
                        );
                        return (
                          <div key={pearl.key} className="ci-vt-center">
                            <button
                              type="button"
                              className={`ci-pearl-toggle${selected ? " ci-pearl-toggle--active" : ""}${blocked ? " ci-pearl-toggle--blocked" : ""}`}
                              title={blocked ? `${player.first_name} ya tiene una perla` : pearl.label}
                              disabled={blocked}
                              onClick={() => togglePearl(pearl.key, player._id)}
                            >
                              {pearl.emoji}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="ci-vote-submit-row">
                  {!canSubmit && (
                    <p className="ci-vote-warning">
                      Completá todos los puntajes y las 4 perlas para poder enviar
                    </p>
                  )}
                  <button
                    type="submit"
                    className="ci-vote-submit"
                    disabled={!canSubmit || voteMutation.isPending}
                  >
                    {voteMutation.isPending ? "Enviando..." : "Enviar voto →"}
                  </button>
                </div>
              </form>
            )}

            {/* ── 4. Resultados del partido ── */}
            {!isOpen && hasStats && (
              <>
                <h2 className="ci-section-heading">Resultados de la votación</h2>
                <div className="ci-card ci-results-card">

                  <div className="ci-results-body">

                  {/* Puntajes */}
                  <div className="ci-results-scores">
                    {[...playersWithStats]
                      .filter((p) => p.points !== null)
                      .sort((a, b) => b.points - a.points)
                      .map((p, i) => {
                        const pic = playerPictures[p._id?.toString()];
                        const hasPhoto = pic && !pic.includes("pixabay") && !pic.includes("avatar-1577909");
                        const initial = p.first_name?.[0]?.toUpperCase() ?? "?";
                        return (
                          <div key={p._id} className={`ci-score-row ci-score-row--${i + 1}`}>
                            <span className="ci-score-pos">{i + 1}</span>
                            {i < 3 && (
                              <div className="ci-score-avatar">
                                {hasPhoto
                                  ? <img src={pic} alt={p.first_name} className="ci-score-avatar-img" />
                                  : <span className="ci-score-avatar-initial">{initial}</span>
                                }
                              </div>
                            )}
                            <span className="ci-score-name">{p.first_name} {p.last_name}</span>
                            <span className="ci-score-val">{p.points.toFixed(2)}</span>
                          </div>
                        );
                      })
                    }
                  </div>

                  {/* Perlas */}
                  <div className="ci-results-pearls">
                    {[
                      { key: "white_pearl",   emoji: "⚪", label: "Perla Blanca"   },
                      { key: "vanilla_pearl", emoji: "🟡", label: "Perla Vainilla" },
                      { key: "ocher_pearl",   emoji: "🟠", label: "Perla Ocre"     },
                      { key: "black_pearl",   emoji: "⚫", label: "Perla Negra"    },
                    ].map(({ key, emoji, label }) => {
                      const winner = lastRound[key]?.[0] ?? null;
                      const pic    = winner ? playerPictures[winner._id?.toString()] : null;
                      const defaultPic = pic && !pic.includes("pixabay") && !pic.includes("avatar-1577909");
                      return (
                        <div key={key} className="ci-pearl-result">
                          <div className="ci-pearl-result-avatar-wrap">
                            {defaultPic ? (
                              <img src={pic} alt={winner?.first_name} className="ci-pearl-result-avatar" />
                            ) : (
                              <div className="ci-pearl-result-initial">
                                {winner?.first_name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                            )}
                            <span className="ci-pearl-result-badge">{emoji}</span>
                          </div>
                          <div className="ci-pearl-result-info">
                            <span className="ci-pearl-result-label">{label}</span>
                            <span className="ci-pearl-result-name">
                              {winner ? `${winner.first_name} ${winner.last_name}` : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  </div>

                </div>
              </>
            )}

            {/* ── 5. Performance del equipo ── */}
            <div className="ci-section-heading-row">
              <h2 className="ci-section-heading">
                Rendimiento del equipo — {currentTournamentName || `Temporada ${currentYear ?? ""}`}
              </h2>
              <span className="ci-season-pct">{seasonStats.pct}% victorias</span>
            </div>
            <div className="ci-card">
              {recentRounds.length > 0 && (
                <div className="ci-forma-strip">
                  <span className="ci-forma-label">Forma</span>
                  <div className="ci-forma-pills">
                    {recentRounds.map((r, i) => {
                      const type = r.win ? "win" : r.draw ? "draw" : "defeat";
                      return (
                        <span key={r._id} className={`ci-forma-pill ci-forma-pill--${type}${i === 0 ? " ci-forma-pill--latest" : ""}`}>
                          {type === "win" ? "V" : type === "draw" ? "E" : "D"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {seasonStats.pj > 0 && (
                <div className="ci-tribar-wrapper">
                  {[
                    { count: seasonStats.pg, cls: "win",    abbr: "V" },
                    { count: seasonStats.pe, cls: "draw",   abbr: "E" },
                    { count: seasonStats.pp, cls: "defeat", abbr: "D" },
                  ].map(({ count, cls, abbr }) => (
                    <div
                      key={cls}
                      className={`ci-tribar-col ci-tribar-col--${cls}`}
                      style={{ flex: Math.max(count, 0.5) }}
                    >
                      {count > 0 && (
                        <div className="ci-tribar-top">
                          <span className="ci-tribar-count">{count}</span>
                          <span className="ci-tribar-abbr">{abbr}</span>
                        </div>
                      )}
                      <div className="ci-tribar-seg" />
                    </div>
                  ))}
                </div>
              )}

              <div className="ci-secondary-stats">
                {[
                  { num: seasonStats.pj, lbl: "PJ", mod: "" },
                  { num: seasonStats.gf, lbl: "GF", mod: "" },
                  { num: seasonStats.gc, lbl: "GC", mod: "" },
                  {
                    num: `${seasonStats.gd >= 0 ? "+" : ""}${seasonStats.gd}`,
                    lbl: "DG",
                    mod: seasonStats.gd > 0 ? "pos" : seasonStats.gd < 0 ? "neg" : "",
                  },
                ].map(({ num, lbl, mod }, i) => (
                  <>
                    {i > 0 && <div key={`div-${lbl}`} className="ci-secondary-divider" />}
                    <div key={lbl} className="ci-secondary-stat">
                      <span className={`ci-secondary-num${mod ? ` ci-secondary-num--${mod}` : ""}`}>{num}</span>
                      <span className="ci-secondary-lbl">{lbl}</span>
                    </div>
                  </>
                ))}
              </div>
            </div>

            {/* ── 5. Últimas fechas del torneo ── */}
            {recentRounds.length > 0 && (
              <div className="ci-recents-section">
                <h2 className="ci-section-heading">
                  Últimas fechas{currentTournamentName ? ` — ${currentTournamentName}` : ""}
                </h2>
                <div className="ci-recent-grid">
                  {recentRounds.map((round) => {
                    const out = getOutcome(round);
                    const to  = round.complete_stats
                      ? `/chachos/tournament-rounds/${round._id}/results`
                      : `/chachos/tournament-rounds`;
                    return (
                      <Link key={round._id} to={to} className="ci-recent-pill">
                        <div className="ci-recent-top">
                          <span className="ci-recent-rival">vs {round.rival?.name ?? "—"}</span>
                          {out && <span className={`ci-badge ci-badge--${out.cls}`}>{out.label[0]}</span>}
                        </div>
                        <div className="ci-recent-score">{round.score_chachos} - {round.score_rival}</div>
                        <div className="ci-recent-date">{fmtDateShort(round.match_date)}</div>
                        <div className="ci-recent-cta">
                          {round.complete_stats ? "Ver detalle →" : "Ver fechas →"}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── 6. Rankings individuales ── */}
        <div className="ci-rankings-section">
          <h2 className="ci-section-heading">
            Estadísticas individuales{currentTournamentName ? ` — ${currentTournamentName}` : ""}
          </h2>

          {/* Perlas del torneo */}
          {rankingsByCategory.length > 0 && (
            <div className="ci-pearl-leaders">
              {[
                { key: "white_pearl_count",   emoji: "⚪", label: "Perla Blanca",   color: "#d4d4d4" },
                { key: "vanilla_pearl_count", emoji: "🟡", label: "Perla Vainilla", color: "#f6c90e" },
                { key: "ocher_pearl_count",   emoji: "🟠", label: "Perla Ocre",     color: "#c87941" },
                { key: "black_pearl_count",   emoji: "⚫", label: "Perla Negra",    color: "#9b8ec4" },
              ].map(({ key, emoji, label, color }) => {
                const winners = rankingsByCategory
                  .filter((r) => (r[key] ?? 0) > 0)
                  .sort((a, b) => {
                    const diff = (b[key] ?? 0) - (a[key] ?? 0);
                    if (diff !== 0) return diff;
                    const nameA = `${a.player?.last_name} ${a.player?.first_name}`;
                    const nameB = `${b.player?.last_name} ${b.player?.first_name}`;
                    return nameA.localeCompare(nameB, "es");
                  });
                if (winners.length === 0) return null;

                const top = winners[0];
                const rest = winners.slice(1);
                const topPic = playerPictures[top.player?._id?.toString()];
                const topHasPhoto = topPic && !topPic.includes("pixabay") && !topPic.includes("avatar-1577909");

                return (
                  <div
                    key={key}
                    className="ci-pearl-leader-chip"
                    style={{
                      borderTopColor: color,
                      background: `linear-gradient(160deg, color-mix(in srgb, ${color} 6%, var(--bg-card-dark)) 0%, var(--bg-card-dark) 60%)`,
                    }}
                  >
                    <div className="ci-plc-header">
                      <span className="ci-plc-emoji">{emoji}</span>
                      <span className="ci-plc-label">{label}</span>
                    </div>

                    <div className="ci-plc-top">
                      <div className="ci-plc-avatar">
                        {topHasPhoto
                          ? <img src={topPic} alt={top.player?.first_name} className="ci-plc-avatar-img" />
                          : <span className="ci-plc-avatar-initial">{top.player?.first_name?.[0]?.toUpperCase() ?? "?"}</span>
                        }
                      </div>
                      <span className="ci-plc-top-name">{top.player?.first_name} {top.player?.last_name}</span>
                      <span className="ci-plc-top-count" style={{ color, background: `${color}18` }}>{top[key]}</span>
                    </div>

                    {rest.length > 0 && (
                      <div className="ci-plc-rest">
                        {rest.map((r) => (
                          <div key={r.player?._id} className="ci-plc-rest-row">
                            <span className="ci-plc-rest-name">{r.player?.first_name} {r.player?.last_name}</span>
                            <span className="ci-plc-rest-count">{r[key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="ci-stats-table-hint">↕ Tocá un encabezado para ordenar</p>
          <div className="ci-card ci-stats-table-card">
            {(rankingsByCategory ?? []).length > 0 ? (() => {
              const sorted = [...rankingsByCategory].sort((a, b) => {
                const diff = (b[sortKey] ?? 0) - (a[sortKey] ?? 0);
                if (diff !== 0) return diff;
                const nameA = `${a.player?.last_name} ${a.player?.first_name}`;
                const nameB = `${b.player?.last_name} ${b.player?.first_name}`;
                return nameA.localeCompare(nameB, "es");
              });
              return (
                <div className="ci-stats-table-wrapper">
                  <table className="ci-stats-table">
                    <colgroup>
                      <col className="ci-st-col--name" />
                      {RANKING_COLS.map((col) => (
                        <col key={col.key} className="ci-st-col--stat" />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="ci-st-th ci-st-th--name">Jugador</th>
                        {RANKING_COLS.map((col) => (
                          <th
                            key={col.key}
                            className={`ci-st-th ci-st-th--stat${sortKey === col.key ? " ci-st-th--active" : ""}`}
                            onClick={() => setSortKey(col.key)}
                          >
                            <span className="ci-st-label-full">{col.label}</span>
                            <span className="ci-st-label-short">{col.short}</span>
                            <span className="ci-st-sort-icon">{sortKey === col.key ? "↓" : "↕"}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((item, i) => (
                        <tr key={item.player?._id ?? i} className={`ci-st-row${i === 0 ? " ci-st-row--first" : ""}`}>
                          <td className="ci-st-td ci-st-td--name">
                            <span className="ci-st-pos">{i + 1}</span>
                            <span className="ci-st-name">{item.player?.first_name} {item.player?.last_name}</span>
                          </td>
                          {RANKING_COLS.map((col) => {
                            const val = item[col.key];
                            const isZero = val === 0;
                            const semanticClass = !isZero && val != null ? ` ci-st-val--${col.key}` : "";
                            const zeroClass = isZero ? " ci-st-val--zero" : "";
                            return (
                              <td
                                key={col.key}
                                className={`ci-st-td ci-st-td--stat${sortKey === col.key ? " ci-st-td--active" : ""}${semanticClass}${zeroClass}`}
                              >
                                {val != null
                                  ? (col.decimals ? val.toFixed(col.decimals) : val)
                                  : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })() : (
              <p className="ci-empty">Sin datos para este torneo</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default ChachosInicio;
