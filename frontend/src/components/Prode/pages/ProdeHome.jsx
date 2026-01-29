import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import "../styles/ProdeUserSideStyles.css";

import fetchAllProdeTournaments from "../../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeTournamentSummary from "../../../reactquery/prode/fetchProdeTournamentSummary";
import fetchProdeMatchdaysByTournament from "../../../reactquery/prode/fetchProdeMatchdaysByTournament";
import fetchAllProdePlayers from "../../../reactquery/prode/fetchAllProdePlayers";

const normalizeRow = (row) => {
  const base = Number(row?.basePoints ?? row?.pointsBase ?? row?.base ?? 0);
  const bonus = Number(row?.bonusPoints ?? row?.pointsBonus ?? row?.bonus ?? 0);
  return {
    id: String(row?.playerId || row?._id || row?.player || Math.random()),
    name: row?.name || row?.playerName || "—",
    played: Number(row?.played ?? 0),
    wins: Number(row?.wins ?? 0),
    draws: Number(row?.draws ?? 0),
    losses: Number(row?.losses ?? 0),
    basePoints: base,
    bonusPoints: bonus,
    totalPoints: Number(row?.totalPoints ?? base + bonus),
    challengesStats: row?.challengesStats || null,
  };
};

const rankEmoji = (idx) => {
  if (idx === 0) return "🥇";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return "";
};

const ProdeHome = () => {
  const [selectedMonths, setSelectedMonths] = useState([]);

  const toggleMonth = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const { data: allPlayers } = useQuery({
    queryKey: ["fetchAllProdePlayers"],
    queryFn: fetchAllProdePlayers,
  });
  const { data: tournaments, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const selectedTournament = useMemo(() => {
    const list = Array.isArray(tournaments) ? tournaments : [];
    return list.find((t) => t.status === "active") || list[0];
  }, [tournaments]);

  const tournamentId = selectedTournament?._id;

  const { data: summaryResp } = useQuery({
    queryKey: ["fetchProdeTournamentSummary", tournamentId],
    queryFn: () => fetchProdeTournamentSummary(tournamentId),
    enabled: !!tournamentId,
  });

  const tournament = summaryResp?.tournament || selectedTournament;
  const standingsTotal = summaryResp?.summary?.table || [];
  const monthlyTables = summaryResp?.summary?.byMonth || null;

  const resolvePlayerName = (p) => {
    if (!p) return "—";
    if (typeof p === "object") return p.name || "—";
    const found = allPlayers?.find((ap) => String(ap._id) === String(p));
    return found ? found.name : "—";
  };

  // --- LÓGICA DE GANADORES MENSUALES (ARRAY DE 4 NOMBRES + NOTA) ---
  const currentMonthlyWinnerObj = useMemo(() => {
    if (selectedMonths.length !== 1 || !tournament?.monthlyWinners) return null;
    const found = tournament.monthlyWinners.find(
      (mw) => mw.month === selectedMonths[0],
    );
    return found && Array.isArray(found.winnerPlayerIds) ? found : null;
  }, [selectedMonths, tournament]);

  const standings = useMemo(() => {
    if (!selectedMonths.length || !monthlyTables)
      return standingsTotal.map(normalizeRow);
    const map = new Map();
    selectedMonths.forEach((m) => {
      (monthlyTables[m] || []).forEach((row) => {
        const n = normalizeRow(row);
        if (!map.has(n.id)) map.set(n.id, { ...n });
        else {
          const a = map.get(n.id);
          a.played += n.played;
          a.wins += n.wins;
          a.draws += n.draws;
          a.losses += n.losses;
          a.basePoints += n.basePoints;
          a.bonusPoints += n.bonusPoints;
          a.totalPoints += n.totalPoints;
          if (n.challengesStats) {
            ["GDT", "ARG", "MISC"].forEach((type) => {
              if (!a.challengesStats) a.challengesStats = {};
              if (!a.challengesStats[type])
                a.challengesStats[type] = {
                  played: 0,
                  wins: 0,
                  draws: 0,
                  losses: 0,
                };
              a.challengesStats[type].played += n.challengesStats[type].played;
              a.challengesStats[type].wins += n.challengesStats[type].wins;
              a.challengesStats[type].draws += n.challengesStats[type].draws;
              a.challengesStats[type].losses += n.challengesStats[type].losses;
            });
          }
        }
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints,
    );
  }, [standingsTotal, monthlyTables, selectedMonths]);

  const { data: matchdays } = useQuery({
    queryKey: ["fetchProdeMatchdaysByTournament", tournamentId],
    queryFn: () => fetchProdeMatchdaysByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const { lastPlayed, nextScheduled } = useMemo(() => {
    const list = Array.isArray(matchdays) ? matchdays : [];
    const played = list
      .filter((m) => m.status === "played")
      .sort((a, b) => b.roundNumber - a.roundNumber);
    const scheduled = list
      .filter((m) => m.status === "scheduled")
      .sort((a, b) => a.roundNumber - b.roundNumber);
    return { lastPlayed: played[0], nextScheduled: scheduled[0] };
  }, [matchdays]);

  const resolveChallengeWinnerLabel = (challenge, duel) => {
    const r = challenge?.result;
    if (!r) return "—";
    if (r === "draw") return "Empate";
    if (r === "A") return resolvePlayerName(duel?.playerA);
    if (r === "B") return resolvePlayerName(duel?.playerB);
    return String(r);
  };

  if (isLoadingTournaments)
    return (
      <div className="prode-user-home container">
        <div className="p-skeleton" />
      </div>
    );

  return (
    <div className="prode-user-home container">
      {/* 1. HEADER */}
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">PRODE de CHACHO</span>
          <h1 className="p-main-title">
            {tournament?.name}{" "}
            <span className="p-year">({tournament?.year})</span>
          </h1>
          <div className="p-status-row">
            {tournament?.status && (
              <span className={`p-tag p-tag-${tournament.status}`}>
                {tournament.status}
              </span>
            )}
          </div>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-primary" to="/prode">
            Home
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/h2h">
            H2H
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/records">
            Records
          </Link>
        </div>
      </header>

      <div className="p-main-grid">
        <div className="p-main-col">
          {/* TABLA DE POSICIONES CON PILLS */}
          <section className="p-card">
            <h2 className="p-card-title">Posiciones</h2>
            <div className="p-pills-container">
              {tournament?.months?.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`p-pill ${selectedMonths.includes(m) ? "active" : ""}`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="p-table-scroll">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>P1 (1)</th>
                    <th>B</th>
                    <th>P2 (2)</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-td-rank">
                        {idx + 1} <span>{rankEmoji(idx)}</span>
                      </td>
                      <td className="p-td-name">{row.name}</td>
                      <td>{row.played}</td>
                      <td>{row.wins}</td>
                      <td>{row.draws}</td>
                      <td>{row.losses}</td>
                      <td>{row.basePoints}</td>
                      <td>{row.bonusPoints}</td>
                      <td className="p-td-total">{row.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-table-hint">
              <p>(1) Puntos base obtenidos por duelos</p>
              <p>(2) Puntos base + puntos bonus</p>
            </div>
          </section>

          {/* TRES CARDS DE DESAFÍOS */}
          <div className="p-challenges-stats-grid">
            {["GDT", "ARG", "MISC"].map((type) => {
              const sorted = [...standings]
                .sort(
                  (a, b) =>
                    (b.challengesStats?.[type]?.wins || 0) -
                    (a.challengesStats?.[type]?.wins || 0),
                )
                .slice(0, 3);
              return (
                <div key={type} className="p-card p-stat-card">
                  <div className="p-stat-header-mini">
                    <div className="p-stat-badge">{type}</div>
                    <span className="p-stat-title-label">
                      Top 3 Ranking Desafío
                    </span>
                  </div>
                  <div className="p-stat-list-container">
                    {sorted
                      .filter((p) => p.challengesStats?.[type]?.played > 0)
                      .map((player, idx) => (
                        <div key={player.id} className="p-stat-player-row">
                          <div className="p-stat-player-info">
                            <span className="p-stat-rank-small">
                              {idx + 1}°
                            </span>
                            <span className="p-stat-name-small">
                              {player.name}
                            </span>
                          </div>
                          <div className="p-stat-values-mini">
                            <div className="p-val-box">
                              <span>PJ</span>
                              {player.challengesStats[type].played}
                            </div>
                            <div className="p-val-box win">
                              <span>G</span>
                              {player.challengesStats[type].wins}
                            </div>
                            <div className="p-val-box">
                              <span>E</span>
                              {player.challengesStats[type].draws}
                            </div>
                            <div className="p-val-box loss">
                              <span>P</span>
                              {player.challengesStats[type].losses}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA (ASIDE) */}
        <aside className="p-side-col">
          {/* MONTHLY WINNERS - COMIDA */}
          {currentMonthlyWinnerObj && (
            <section className="p-side-section p-card p-monthly-podium">
              <div className="p-side-header">
                <h3>Ganadores de la Comida - {selectedMonths[0]}</h3>
              </div>
              <div className="p-winners-list">
                {currentMonthlyWinnerObj.winnerPlayerIds.map(
                  (winnerId, index) => (
                    <div key={`${winnerId}-${index}`} className="p-winner-item">
                      <span className="p-winner-rank">🏆</span>
                      <div className="p-winner-info">
                        <span className="p-subtitle">{index + 1}º</span>
                        <div className="p-winner-name">
                          {resolvePlayerName(winnerId)}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
              {currentMonthlyWinnerObj.note && (
                <p className="p-monthly-note">
                  <strong>Nota:</strong> {currentMonthlyWinnerObj.note}
                </p>
              )}
            </section>
          )}

          {/* ULTIMA FECHA */}
          <section className="p-side-section">
            <div className="p-side-header">
              <h3>Última Fecha</h3>
            </div>
            <div className="p-match-info">
              Fecha {lastPlayed?.roundNumber} • {lastPlayed?.month}
            </div>
            {lastPlayed?.duels?.map((d, i) => {
              const pA =
                Number(d.points?.playerA || 0) + Number(d.points?.bonusA || 0);
              const pB =
                Number(d.points?.playerB || 0) + Number(d.points?.bonusB || 0);
              return (
                <div key={i} className="p-duel-container">
                  <div className="p-mini-duel">
                    <div className="p-mini-names">
                      <span className={pA > pB ? "p-w" : ""}>
                        {resolvePlayerName(d.playerA)}
                      </span>
                      <span className="p-vs">vs</span>
                      <span className={pB > pA ? "p-w" : ""}>
                        {resolvePlayerName(d.playerB)}
                      </span>
                    </div>
                    <div className="p-mini-score">
                      {pA} - {pB}
                    </div>
                  </div>
                  <div className="p-challenges-box">
                    {d.challenges?.map((c, ci) => (
                      <div key={ci} className="p-challenge-row">
                        <span className="p-ch-type">{c.type}</span>
                        <span className="p-ch-res">
                          {c.scoreA}-{c.scoreB}
                        </span>
                        <span className="p-ch-winner">
                          {resolveChallengeWinnerLabel(c, d)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* PROXIMA FECHA */}
          <section className="p-side-section">
            <div className="p-side-header">
              <h3>Próxima Fecha</h3>
            </div>
            <div className="p-match-info">
              Fecha {nextScheduled?.roundNumber} • {nextScheduled?.month}
            </div>
            {nextScheduled?.duels?.map((d, i) => (
              <div key={i} className="p-duel-container">
                <div className="p-mini-duel upcoming">
                  <div className="p-mini-names">
                    <span>{resolvePlayerName(d.playerA)}</span>
                    <span className="p-vs">vs</span>
                    <span>{resolvePlayerName(d.playerB)}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProdeHome;
