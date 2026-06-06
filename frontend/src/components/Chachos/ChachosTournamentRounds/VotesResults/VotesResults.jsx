import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./VotesResultsStyles.css";
import { formatDate } from "../../../../helpers/dateFormatter";
import { consolidateEvaluation } from "../../../../helpers/consolidateEvaluation";
import { calculateTotalVotesByPearl } from "../../../../helpers/pearlsManagementInARound";
import fetchRoundById from "../../../../reactquery/chachos/fetchRoundById";
import fetchVotesByRound from "../../../../reactquery/chachos/fetchVotesByRound";
import fetchMatchStatsByRound from "../../../../reactquery/chachos/fetchMatchStatsByRound";
import fetchPlayerPicturesByRound from "../../../../reactquery/chachos/fetchPlayerPicturesByRound";

// ── Definición de perlas ──────────────────────────────────────────────────────
const PEARLS = [
  {
    key:        "white_pearl",
    emoji:      "⚪",
    label:      "Perla Blanca",
    colorVar:   "var(--third-color)",
    bgVar:      "rgba(168,218,220,0.1)",
    borderVar:  "rgba(168,218,220,0.25)",
  },
  {
    key:        "vanilla_pearl",
    emoji:      "🟡",
    label:      "Perla Vainilla",
    colorVar:   "var(--color-podrida)",
    bgVar:      "rgba(246,201,14,0.1)",
    borderVar:  "rgba(246,201,14,0.25)",
  },
  {
    key:        "ocher_pearl",
    emoji:      "🟠",
    label:      "Perla Ocre",
    colorVar:   "var(--color-prode)",
    bgVar:      "rgba(249,115,22,0.1)",
    borderVar:  "rgba(249,115,22,0.25)",
  },
  {
    key:        "black_pearl",
    emoji:      "⚫",
    label:      "Perla Negra",
    colorVar:   "var(--fourth-color)",
    bgVar:      "rgba(230,57,70,0.1)",
    borderVar:  "rgba(230,57,70,0.25)",
  },
];

// ── Helper: resultado del partido ─────────────────────────────────────────────
const resultMeta = (round) => {
  if (round?.win)    return { cls: "win",  label: "Victoria" };
  if (round?.draw)   return { cls: "draw", label: "Empate"   };
  if (round?.defeat) return { cls: "loss", label: "Derrota"  };
  return { cls: "neutral", label: "—" };
};

// ─────────────────────────────────────────────────────────────────────────────
const VotesResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Fetch paralelo: round + votes ─────────────────────────────────────────
  const {
    data: roundData,
    isLoading: loadingRound,
    isError: errorRound,
  } = useQuery({
    queryKey: ["round", id],
    queryFn:  () => fetchRoundById(id),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: votesData,
    isLoading: loadingVotes,
    isError: errorVotes,
  } = useQuery({
    queryKey: ["votes-by-round", id],
    queryFn:  () => fetchVotesByRound(id),
    staleTime: 5 * 60 * 1000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["match-stats", id],
    queryFn:  () => fetchMatchStatsByRound(id),
    staleTime: 5 * 60 * 1000,
  });

  const { data: picturesData } = useQuery({
    queryKey: ["player-pictures", id],
    queryFn:  () => fetchPlayerPicturesByRound(id),
    staleTime: 30 * 60 * 1000,
  });

  const round      = roundData?.tournamentRound;
  const votes      = votesData?.allVotesForRound ?? [];
  const totalVotes = votes.length;
  const matchStats    = statsData ?? [];
  const hasStats      = matchStats.length > 0;
  const pictureMap    = picturesData ?? {};

  // ── Highlights (igual que ChachosInicio) ──────────────────────────────────
  const highlights = useMemo(() => {
    if (!hasStats) return null;
    return {
      scorers:   matchStats.filter((s) => s.goals        > 0),
      assisters: matchStats.filter((s) => s.assists      > 0),
      yellows:   matchStats.filter((s) => s.yellow_cards > 0),
      reds:      matchStats.filter((s) => s.red_cards    > 0),
    };
  }, [hasStats, matchStats]);

  // ── Consolidar puntajes ────────────────────────────────────────────────────
  const sortedScores = consolidateEvaluation(votes).sort(
    (a, b) => b.points - a.points
  );

  const pearlStandings = {
    white_pearl:   calculateTotalVotesByPearl(votes, "white_pearl"),
    vanilla_pearl: calculateTotalVotesByPearl(votes, "vanilla_pearl"),
    ocher_pearl:   calculateTotalVotesByPearl(votes, "ocher_pearl"),
    black_pearl:   calculateTotalVotesByPearl(votes, "black_pearl"),
  };

  const isLoading = loadingRound || loadingVotes;
  const isError   = errorRound   || errorVotes;
  const { cls: resultCls, label: resultLabel } = resultMeta(round);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="vr">

      {/* ── Header ── */}
      <div className="vr-header">
        <div className="vr-header-top">
          <div className="vr-eyebrow"><span className="vr-eyebrow-dot" />Chachos · Fechas</div>
          <button className="vr-back" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </button>
        </div>
        <h1 className="vr-title">Resultados de votación</h1>
      </div>

      {/* ── Estados de carga / error ── */}
      {isLoading && <p className="vr-loading">Cargando resultados…</p>}
      {isError   && <p className="vr-empty">Error al cargar los datos.</p>}

      {!isLoading && !isError && (
        <>
          {/* ── Match card ── */}
          <div className="vr-match-card">

            {/* Fila superior: datos primarios */}
            <div className="vr-match-top">
              <div className="vr-match-main">
                <div className="vr-match-rival">{round?.rival?.name ?? "—"}</div>
                <div className="vr-match-date">{formatDate(round?.match_date)}</div>
              </div>
              <div className="vr-match-right">
                <div className={`vr-score vr-score--${resultCls}`}>
                  {round?.score_chachos} – {round?.score_rival}
                </div>
                <div className={`vr-result-badge vr-result-badge--${resultCls}`}>{resultLabel}</div>
              </div>
              <div className="vr-votes-chip">
                <span className="vr-votes-chip-count">{totalVotes}</span>
                <span className="vr-votes-chip-label">votos</span>
              </div>
            </div>

            {/* Highlights del partido */}
            {hasStats && (
              <div className="vr-highlights">
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
                    label: "Goles",
                    items: highlights?.scorers   ?? [],
                    fmt:   (p) => `${p.player?.first_name ?? p.first_name} ${p.player?.last_name ?? p.last_name} (${p.goals})`,
                  },
                  {
                    icon: (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-chachos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/>
                        <path d="m12 5 7 7-7 7"/>
                      </svg>
                    ),
                    label: "Asistencias",
                    items: highlights?.assisters ?? [],
                    fmt:   (p) => `${p.player?.first_name ?? p.first_name} ${p.player?.last_name ?? p.last_name} (${p.assists})`,
                  },
                  {
                    icon: (
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="var(--color-podrida)" stroke="none">
                        <rect x="0" y="0" width="11" height="14" rx="2"/>
                      </svg>
                    ),
                    label: "Amarillas",
                    items: highlights?.yellows   ?? [],
                    fmt:   (p) => `${p.player?.first_name ?? p.first_name} ${p.player?.last_name ?? p.last_name} (${p.yellow_cards})`,
                  },
                  {
                    icon: (
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="var(--color-cronicas)" stroke="none">
                        <rect x="0" y="0" width="11" height="14" rx="2"/>
                      </svg>
                    ),
                    label: "Rojas",
                    items: highlights?.reds      ?? [],
                    fmt:   (p) => `${p.player?.first_name ?? p.first_name} ${p.player?.last_name ?? p.last_name} (${p.red_cards})`,
                  },
                ].map(({ icon, label, items, fmt }) => (
                  <div key={label} className="vr-hl-row">
                    <span className="vr-hl-label">{icon}{label}</span>
                    <span className="vr-hl-names">
                      {items.length > 0 ? items.map(fmt).join(" — ") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Sin votos ── */}
          {totalVotes === 0 ? (
            <p className="vr-empty">No hay votos registrados para esta fecha.</p>
          ) : (
            <>
              {/* ── Grid de perlas ── */}
              <h2 className="vr-section-heading">Perlas</h2>
              <div className="vr-pearls-grid">
                {PEARLS.map((pearl) => {
                  const winners   = round?.[pearl.key] ?? [];
                  const standings = pearlStandings[pearl.key] ?? [];
                  const topVotes  = standings[0]?.total_votes ?? 1;

                  return (
                    <div
                      key={pearl.key}
                      className="vr-pearl-card"
                      style={{
                        "--pearl-color":  pearl.colorVar,
                        "--pearl-bg":     pearl.bgVar,
                        "--pearl-border": pearl.borderVar,
                      }}
                    >
                      {/* Header de la card */}
                      <div className="vr-pearl-header">
                        <span className="vr-pearl-label">{pearl.label}</span>
                        <span className="vr-pearl-emoji">{pearl.emoji}</span>
                      </div>

                      {/* Ganador(es) */}
                      <div className="vr-pearl-winners">
                        {winners.length > 0
                          ? winners.map((p) => {
                              const pic      = pictureMap[p._id?.toString()];
                              const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
                              return (
                                <div key={p._id} className="vr-pearl-winner-row">
                                  {pic
                                    ? <img src={pic} alt={p.first_name} className="vr-pearl-winner-avatar" />
                                    : <span className="vr-pearl-winner-avatar vr-pearl-winner-avatar--initials">{initials}</span>
                                  }
                                  <span className="vr-pearl-winner-name">
                                    {p.first_name} {p.last_name}
                                  </span>
                                </div>
                              );
                            })
                          : <span className="vr-pearl-no-winner">Sin definir</span>
                        }
                      </div>

                      {/* Breakdown de votos */}
                      {standings.length > 0 && (
                        <div className="vr-pearl-breakdown">
                          {standings.map((s) => {
                            const pct  = Math.round((s.total_votes / totalVotes) * 100);
                            const barW = Math.round((s.total_votes / topVotes) * 100);
                            return (
                              <div key={s._id} className="vr-pearl-row">
                                <span className="vr-pearl-row-name">
                                  {s.first_name} {s.last_name}
                                </span>
                                <div className="vr-pearl-bar-wrap">
                                  <div className="vr-pearl-bar" style={{ width: `${barW}%` }} />
                                </div>
                                <span className="vr-pearl-row-votes">{s.total_votes}</span>
                                <span className="vr-pearl-row-pct">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Tabla de puntajes ── */}
              <h2 className="vr-section-heading">Puntajes individuales</h2>
              <div className="vr-scores-card">
                <div className="vr-scores-wrapper">
                  <table className="vr-scores-table">
                    <colgroup>
                      <col className="vr-col--name" />
                      <col className="vr-col--pts"  />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="vr-th vr-th--center">Jugador</th>
                        <th className="vr-th vr-th--center">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedScores.map((player, idx) => (
                        <tr key={player._id} className={`vr-tr${idx === 0 ? " vr-tr--top" : ""}`}>
                          <td className="vr-td vr-td--name">
                            <div className="vr-td-name-inner">
                              <span className="vr-st-pos">{idx + 1}</span>
                              <span className="vr-st-name">{player.first_name} {player.last_name}</span>
                            </div>
                          </td>
                          <td className="vr-td vr-td--center vr-td--pts">
                            {player.points.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default VotesResults;
