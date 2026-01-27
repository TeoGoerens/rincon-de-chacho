import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import "../styles/ProdeUserSideStyles.css";

import fetchProdeH2H from "../../../reactquery/prode/fetchProdeH2H";
import fetchAllProdePlayers from "../../../reactquery/prode/fetchAllProdePlayers";

const ProdeH2H = () => {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [expandedOpponentId, setExpandedOpponentId] = useState(null);

  const { data: players } = useQuery({
    queryKey: ["fetchAllProdePlayers"],
    queryFn: fetchAllProdePlayers,
  });
  const { data: h2hData, isLoading } = useQuery({
    queryKey: ["fetchProdeH2H", selectedPlayerId],
    queryFn: () => fetchProdeH2H(selectedPlayerId),
    enabled: !!selectedPlayerId,
  });

  const toggleExpand = (id) =>
    setExpandedOpponentId(expandedOpponentId === id ? null : id);

  return (
    <div className="prode-user-home container">
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">Historial de Clásicos</span>
          <h1 className="p-main-title">Cara a Cara</h1>
          <div className="p-filter-box" style={{ marginTop: "1rem" }}>
            <select
              className="p-select"
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                setExpandedOpponentId(null);
              }}
            >
              <option value="">Seleccioná tu jugador...</option>
              {players?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-outline" to="/prode">
            Volver
          </Link>
        </div>
      </header>

      <div className="p-main-grid">
        <div className="p-main-col">
          {isLoading && <p>Buscando paternidades...</p>}
          {!selectedPlayerId && (
            <div
              className="p-card"
              style={{ textAlign: "center", padding: "3rem" }}
            >
              <p className="p-match-info">
                Elegí un jugador para ver el historial contra el resto.
              </p>
            </div>
          )}

          {h2hData?.map((item) => (
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
                    <span className="p-subtitle">Rival</span>
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
                <div className="p-card p-h2h-detail">
                  <div className="p-h2h-detail-grid">
                    <div className="p-h2h-detail-section">
                      <h4>Rendimiento</h4>
                      <div className="p-h2h-stats-row">
                        <div className="p-stat-item">
                          <span className="p-label">Efectividad</span>
                          <span className="p-value">{item.winRatio}%</span>
                        </div>
                        <div className="p-stat-item">
                          <span className="p-label">Pts F / C</span>
                          <span className="p-value">
                            {item.totalPointsFor} - {item.totalPointsAgainst}
                          </span>
                        </div>
                        <div className="p-stat-item">
                          <span className="p-label">Bonus F / C</span>
                          <span className="p-value">
                            +{item.bonusFor} / -{item.bonusAgainst}
                          </span>
                        </div>
                      </div>
                      <div className="p-h2h-last-five">
                        <span className="p-label">Últimos 5:</span>
                        <div className="p-circles-row">
                          {item.lastResults.map((r, i) => (
                            <div
                              key={i}
                              className={`p-res-circle p-res-${r.res}`}
                              title={`${r.tournament}`}
                            >
                              {r.res}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-h2h-detail-section">
                      <h4>Duelos por Desafío</h4>
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
                                  {data.wins} - {data.losses}
                                </td>
                                <td className="text-win">
                                  {data.maxDiffFor > 0
                                    ? `+${data.maxDiffFor}`
                                    : "—"}
                                </td>
                                <td className="text-loss">
                                  {data.maxDiffAgainst > 0
                                    ? `-${data.maxDiffAgainst}`
                                    : "—"}
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
