import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import "../styles/ProdeUserSideStyles.css"; // Reutilizamos estilos

import fetchProdeRecords from "../../../reactquery/prode/fetchProdeRecords";
import fetchAllProdeTournaments from "../../../reactquery/prode/fetchAllProdeTournaments";

const rankIcon = (idx) => {
  if (idx === 0) return "🥇";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return "•";
};

const ProdeRecords = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  // Queries
  const { data: tournaments } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["fetchProdeRecords", selectedTournamentId],
    queryFn: () => fetchProdeRecords(selectedTournamentId),
  });

  // Filtramos solo torneos finalizados para el selector (o todos si querés)
  const finishedTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(
      (t) => t.status === "finished" || t.status === "active",
    );
  }, [tournaments]);

  if (isLoading)
    return <div className="prode-user-home container">Cargando Records...</div>;

  return (
    <div className="prode-user-home container">
      {/* HEADER CON SELECTOR */}
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">Salón de la Fama</span>
          <h1 className="p-main-title">Récords & Estadísticas</h1>

          <div className="p-filter-box" style={{ marginTop: "1rem" }}>
            <select
              className="p-select"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              <option value="">🌎 Historia Completa (All-Time)</option>
              {finishedTournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.year})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-outline" to="/prode">
            Volver al Home
          </Link>
        </div>
      </header>

      <div className="p-main-grid">
        <div className="p-main-col">
          {/* SECCIÓN DE PODIOS PRINCIPALES */}
          <div className="p-records-podiums-grid">
            {/* 1. MÁS GANADORES (Solo si es histórico) */}
            {!selectedTournamentId && (
              <section className="p-card p-stat-card">
                <h3 className="p-card-title">🏆 Más Ganadores</h3>
                <div className="p-stat-list-container">
                  {records?.topChampions?.length > 0 ? (
                    records.topChampions.map((item, i) => (
                      <div key={i} className="p-stat-player-row">
                        <span>
                          {rankIcon(i)} {item.name}
                        </span>
                        <span className="p-val-box win">
                          {item.count} Títulos
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-match-info">Sin datos aún</p>
                  )}
                </div>
              </section>
            )}

            {/* 2. REY DE LA EFECTIVIDAD */}
            <section className="p-card p-stat-card">
              <h3 className="p-card-title">🔥 Rey de la Efectividad</h3>
              <div className="p-stat-list-container">
                {records?.efficiency?.slice(0, 3).map((item, i) => (
                  <div key={i} className="p-stat-player-row">
                    <span>
                      {rankIcon(i)} {item.name}
                    </span>
                    <span className="p-val-box win">{item.ratio}% G</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. REY DE LA INEFECTIVIDAD */}
            <section className="p-card p-stat-card">
              <h3 className="p-card-title">🧊 Rey de la Inefectividad</h3>
              <div className="p-stat-list-container">
                {records?.inefficiency?.slice(0, 3).map((item, i) => (
                  <div key={i} className="p-stat-player-row">
                    <span>
                      {rankIcon(i)} {item.name}
                    </span>
                    <span className="p-val-box loss">{item.ratio}% P</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SECCIÓN EXPERTOS POR DESAFÍO */}
          <h2 className="p-subtitle" style={{ margin: "2rem 0 1rem" }}>
            Expertos por Desafío (Victorias)
          </h2>
          <div className="p-challenges-stats-grid">
            {["GDT", "ARG", "MISC"].map((type) => (
              <div key={type} className="p-card p-stat-card">
                <div className="p-stat-header-mini">
                  <div className="p-stat-badge">{type}</div>
                  <div className="p-record-holder">
                    <span className="p-stat-title-label">
                      Récord:{" "}
                      <strong>{records?.maxScores?.[type]?.value}</strong>
                    </span>
                    <small className="p-record-name">
                      {records?.maxScores?.[type]?.player}
                    </small>
                  </div>
                </div>
                <div className="p-stat-list-container">
                  {records?.experts?.[type]?.map((player, i) => (
                    <div key={i} className="p-stat-player-row">
                      <span>
                        {rankIcon(i)} {player.name}
                      </span>
                      <span className="p-val-box win">
                        {player[`${type.toLowerCase()}Wins`]} Vict.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* TABLA HISTÓRICA ACUMULADA */}
          <section className="p-card" style={{ marginTop: "2rem" }}>
            <h2 className="p-card-title">
              Tabla Acumulada{" "}
              {selectedTournamentId ? "del Torneo" : "Histórica"}
            </h2>
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
                    <th>Base</th>
                    <th>Bonus</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {records?.historicalTable?.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-td-rank">{idx + 1}</td>
                      <td className="p-td-name">{row.name}</td>
                      <td>{row.pj}</td>
                      <td>{row.pg}</td>
                      <td>{row.pe}</td>
                      <td>{row.pp}</td>
                      <td>{row.basePoints}</td>
                      <td>{row.bonusPoints}</td>
                      <td className="p-td-total">{row.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ASIDE DE RÉCORDS ADICIONALES */}
        <aside className="p-side-col">
          <section className="p-side-section p-card">
            <div className="p-side-header">
              <h3>💎 Bonus Collectors</h3>
            </div>
            <div className="p-stat-list-container">
              {records?.bonusRank?.map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <span className="p-stat-name-small">
                    {i + 1}. {item.name}
                  </span>
                  <span className="p-val-box win">+{item.bonusPoints}</span>
                </div>
              ))}
            </div>
          </section>

          {!selectedTournamentId && (
            <section className="p-side-section p-card">
              <div className="p-side-header">
                <h3>🏚 Anti-Podio (Último Puesto)</h3>
              </div>
              <div className="p-stat-list-container">
                {records?.topLastPlaces?.length > 0 ? (
                  records.topLastPlaces.map((item, i) => (
                    <div key={i} className="p-stat-player-row">
                      <span className="p-stat-name-small">
                        {i + 1}. {item.name}
                      </span>
                      <span className="p-val-box loss">{item.count} veces</span>
                    </div>
                  ))
                ) : (
                  <p className="p-match-info">Nadie ha quedado último aún.</p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ProdeRecords;
