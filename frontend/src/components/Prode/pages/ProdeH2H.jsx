import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../styles/ProdeUserSideStyles.css";
import fetchProdeH2H from "../../../reactquery/prode/fetchProdeH2H";
import fetchAllProdePlayers from "../../../reactquery/prode/fetchAllProdePlayers";
import fetchAllProdeTournaments from "../../../reactquery/prode/fetchAllProdeTournaments";

const ProdeH2H = () => {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [expandedOpponentId, setExpandedOpponentId] = useState(null);

  const { data: tournaments } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const { data: players } = useQuery({
    queryKey: ["fetchAllProdePlayers"],
    queryFn: fetchAllProdePlayers,
  });

  const { data: h2hData, isLoading } = useQuery({
    queryKey: ["fetchProdeH2H", selectedPlayerId, selectedTournamentId],
    queryFn: () => fetchProdeH2H(selectedPlayerId, selectedTournamentId),
    enabled: !!selectedPlayerId,
  });

  const availableTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(
      (t) => t.status === "finished" || t.status === "active",
    );
  }, [tournaments]);

  const toggleExpand = (id) =>
    setExpandedOpponentId(expandedOpponentId === id ? null : id);

  return (
    <div className="prode-user-home container">
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">Análisis de Desempeño</span>
          <h1 className="p-main-title">Perfil & Rivalidades</h1>
          <div
            className="p-filter-box"
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <select
              className="p-select"
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                setExpandedOpponentId(null);
              }}
            >
              <option value="">Seleccioná un jugador...</option>
              {players?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="p-select"
              value={selectedTournamentId}
              onChange={(e) => {
                setSelectedTournamentId(e.target.value);
                setExpandedOpponentId(null);
              }}
            >
              <option value="">🌎 Todos los Tiempos</option>
              {availableTournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.year})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-outline" to="/prode">
            Home
          </Link>
          <Link className="p-btn p-btn-primary" to="/prode/h2h">
            H2H
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/records">
            Records
          </Link>
        </div>
      </header>

      <div className="h2h-main-grid">
        <div className="p-main-col">
          {isLoading && (
            <p className="p-match-info">Procesando estadísticas...</p>
          )}

          {h2hData?.playerSummary && (
            <section className="p-card p-profile-summary-card fade-in">
              <div className="p-profile-header">
                <div>
                  <h2 className="p-profile-name">
                    {players?.find((p) => p._id === selectedPlayerId)?.name}
                  </h2>
                  <div className="p-profile-ranks">
                    <span className="p-rank-badge">
                      🏆 Ranking Torneo: #{h2hData.playerSummary.rankActive}
                    </span>
                    <span className="p-rank-badge">
                      🌎 Ranking Histórico: #
                      {h2hData.playerSummary.rankHistorical}
                    </span>
                  </div>
                </div>

                <div className="p-profile-main-stat">
                  <span className="p-label" style={{ textAlign: "center" }}>
                    Efectividad
                  </span>
                  <span
                    className="p-value-large"
                    style={{ textAlign: "center" }}
                  >
                    {h2hData.playerSummary.totalPj > 0
                      ? (
                          (h2hData.playerSummary.totalPg /
                            h2hData.playerSummary.totalPj) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                {/* NUEVO BLOQUE: RACHA PERSONAL DE LOS ÚLTIMOS 5 DUELOS */}
                <div
                  className="p-streak-container"
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span className="p-label" style={{ fontSize: "0.7rem" }}>
                    ÚLTIMOS 5:
                  </span>
                  <div className="p-h2h-streak">
                    {h2hData.playerSummary.playerStreak?.map((res, idx) => (
                      <span
                        key={idx}
                        className={`p-res-circle ${res === "G" ? "p-res-G" : res === "P" ? "p-res-P" : "p-res-E"}`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-profile-stats-grid">
                <div className="p-profile-stat-box">
                  <span className="p-label">Récord de Duelos</span>
                  <span className="p-value">
                    {h2hData.playerSummary.totalPg}G -{" "}
                    {h2hData.playerSummary.totalPj -
                      h2hData.playerSummary.totalPg}
                    P
                  </span>
                </div>
                <div className="p-profile-stat-box">
                  <span className="p-label">Comidas Mensuales</span>
                  <span
                    className="p-value"
                    style={{ color: "var(--p-primary)" }}
                  >
                    {h2hData.playerSummary.monthlyWins} 🗓️
                  </span>
                </div>
                <div className="p-profile-stat-box">
                  <span className="p-label">Mayor "Hijo"</span>
                  <span className="p-value text-win">
                    {h2hData.playerSummary.biggestVictim}
                  </span>
                </div>
                <div className="p-profile-stat-box">
                  <span className="p-label">Su "Verdugo"</span>
                  <span className="p-value text-loss">
                    {h2hData.playerSummary.toughestRival}
                  </span>
                </div>
              </div>

              <div className="p-profile-challenges-row">
                {Object.entries(h2hData.playerSummary.challenges).map(
                  ([type, data]) => (
                    <div key={type} className="p-mini-stat">
                      <span className="p-ch-tag">{type}</span>
                      <span className="p-ch-val">
                        {data.pg} / {data.pj}
                      </span>
                      <span className="p-ch-perc">
                        {data.pj > 0
                          ? ((data.pg / data.pj) * 100).toFixed(0)
                          : 0}
                        % efectividad
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          <h3 className="p-subtitle" style={{ margin: "2rem 0 1rem" }}>
            Historial H2H Detallado
          </h3>
          {h2hData?.opponents?.map((item) => (
            <div
              key={item.opponentId}
              className={`p-h2h-wrapper ${expandedOpponentId === item.opponentId ? "active" : ""}`}
            >
              <div
                className="p-card p-h2h-light"
                onClick={() => toggleExpand(item.opponentId)}
              >
                <div className="p-h2h-main-info">
                  <div className="p-h2h-opp-name">
                    <h3>{item.opponentName}</h3>
                    <span
                      className={`p-sub-stat ${item.balance > 0 ? "text-win" : item.balance < 0 ? "text-loss" : ""}`}
                    >
                      Balance:{" "}
                      {item.balance > 0 ? `+${item.balance}` : item.balance}
                    </span>
                  </div>
                  <div className="p-h2h-brief-stats">
                    <div className="p-val-box">
                      <span>PJ</span>
                      {item.pj}
                    </div>
                    <div className="p-val-box win">
                      <span>G</span>
                      {item.pg}
                    </div>
                    <div className="p-val-box">
                      <span>E</span>
                      {item.pe}
                    </div>
                    <div className="p-val-box loss">
                      <span>P</span>
                      {item.pp}
                    </div>
                  </div>
                  <div className="p-h2h-chevron">
                    {expandedOpponentId === item.opponentId ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {expandedOpponentId === item.opponentId && (
                <div className="p-card p-h2h-detail fade-in">
                  <div className="p-h2h-detail-grid">
                    <div className="p-h2h-detail-section">
                      <h4>Estadísticas</h4>
                      <div className="p-h2h-stats-row">
                        <div className="p-stat-item">
                          <span className="p-label">Win Rate</span>
                          <span className="p-value">{item.winRatio}%</span>
                        </div>
                        <div className="p-stat-item">
                          <span className="p-label">Pts F/C</span>
                          <span className="p-value">
                            {item.totalPointsFor}-{item.totalPointsAgainst}
                          </span>
                        </div>
                      </div>
                      <div className="p-h2h-last-five">
                        <span className="p-label">Racha:</span>
                        <div className="p-circles-row">
                          {item.lastResults.map((r, i) => (
                            <div
                              key={i}
                              className={`p-res-circle p-res-${r.res}`}
                            >
                              {r.res}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-h2h-detail-section">
                      <h4>Desafíos</h4>
                      <table className="p-h2h-subtable">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>G-P</th>
                            <th>Max F</th>
                            <th>Max C</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(item.challenges).map(
                            ([type, data]) => (
                              <tr key={type}>
                                <td>
                                  <strong>{type}</strong>
                                </td>
                                <td>
                                  {data.wins}-{data.losses}
                                </td>
                                <td className="text-win">+{data.maxDiffFor}</td>
                                <td className="text-loss">
                                  -{data.maxDiffAgainst}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProdeH2H;
