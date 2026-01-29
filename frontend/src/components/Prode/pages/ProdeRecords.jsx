import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../styles/ProdeUserSideStyles.css";
import fetchProdeRecords from "../../../reactquery/prode/fetchProdeRecords";
import fetchAllProdeTournaments from "../../../reactquery/prode/fetchAllProdeTournaments";

const rankIcon = (idx) => {
  if (idx === 0) return "🥇";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return `${idx + 1}.`;
};

const ProdeRecords = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const { data: tournaments } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["fetchProdeRecords", selectedTournamentId],
    queryFn: () => fetchProdeRecords(selectedTournamentId),
  });

  const finishedTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(
      (t) => t.status === "finished" || t.status === "active",
    );
  }, [tournaments]);

  if (isLoading)
    return (
      <div className="prode-user-home container">
        <div className="p-skeleton" style={{ height: "300px" }} />
      </div>
    );

  return (
    <div className="prode-user-home container">
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">PRODE de CHACHO</span>
          <h1 className="p-main-title">Records Históricos</h1>
          <select
            className="p-select"
            style={{ marginTop: "1rem" }}
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            <option value="">🌎 Todos los Tiempos</option>
            {finishedTournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.year})
              </option>
            ))}
          </select>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-outline" to="/prode">
            Home
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/h2h">
            H2H
          </Link>
          <Link className="p-btn p-btn-primary" to="/prode/records">
            Records
          </Link>
        </div>
      </header>

      <div className="p-main-grid">
        <div className="p-main-col">
          {/* TABLA GENERAL */}
          <section className="p-card">
            <h2 className="p-card-title">Tabla Acumulada General</h2>
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
                  {records?.historicalTable?.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-td-rank">{idx + 1}</td>
                      <td className="p-td-name">{row.name}</td>
                      <td>{row.pj}</td>
                      <td>{row.pg}</td>
                      <td>{row.pe}</td>
                      <td>{row.pp}</td>
                      <td>{row.totalBasePoints ?? row.basePoints ?? 0}</td>
                      <td>{row.totalBonusPoints ?? row.bonusPoints ?? 0}</td>
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

          {/* TOP 3 DESAFIOS */}
          <h2 className="p-card-title" style={{ marginTop: "1rem" }}>
            ⭐ Top 3 por Desafío
          </h2>
          <div className="p-challenges-stats-grid">
            {["GDT", "ARG", "MISC"].map((type) => (
              <section key={type} className="p-card p-stat-card">
                <h3 className="p-card-title">{type}</h3>
                <div className="p-stat-list-container">
                  {records?.experts?.[type]?.slice(0, 3).map((item, i) => (
                    <div key={i} className="p-stat-player-row">
                      <div className="p-player-info">
                        <span className="p-stat-name-medal">{rankIcon(i)}</span>
                        <div className="p-sub-stat">
                          <span>{item.name}</span>
                          {item.ratio}% efectividad
                        </div>
                      </div>
                      <span
                        className="p-val-box win"
                        style={{ fontSize: "1rem" }}
                      >
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* GANADORES MENSUALES */}
          <section className="p-card" style={{ marginTop: "1rem" }}>
            <h2 className="p-card-title">🗓️ Comidas Mensuales</h2>
            <div className="p-scroll-area" style={{ maxHeight: "300px" }}>
              <div className="p-monthly-grid">
                {records?.topMonthlyWinners?.map((item, i) => (
                  <div key={i} className="record-stat-player-row">
                    <span className="p-stat-name-small">{`${i + 1}º ${item.name}`}</span>
                    <span className="p-val-box win">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="p-side-col">
          {/* TITULOS */}
          <section className="p-card p-side-card">
            <h3 className="p-side-title">🏆 Campeones</h3>
            <div className="p-scroll-area">
              {records?.topChampions?.map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <span className="p-stat-name-small">{item.name}</span>
                  <span className="p-val-box win">{item.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ULTIMOS PUESTOS */}
          <section className="p-card p-side-card">
            <h3 className="p-side-title">📉 Últimos puestos</h3>
            <div className="p-scroll-area">
              {records?.topLastPlaces?.map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <span className="p-stat-name-small">{item.name}</span>
                  <span className="p-val-box loss">{item.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* EFICIENCIA */}
          <section className="p-card p-side-card">
            <h3 className="p-side-title">🔥 Top 3 Eficiencia</h3>
            <div className="p-scroll-area">
              {records?.efficiency?.slice(0, 3).map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <div className="p-player-info">
                    <span className="p-stat-name-small">{item.name}</span>
                    <span className="p-sub-stat">
                      PG {item.pg} / PE {item.pe} / PP {item.pp}
                    </span>
                  </div>
                  <span className="p-val-box win">{item.ratio}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* INEFICIENCIA */}
          <section className="p-card p-side-card">
            <h3 className="p-side-title">💀 Top 3 Ineficiencia</h3>
            <div className="p-scroll-area">
              {records?.inefficiency?.slice(0, 3).map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <div className="p-player-info">
                    <span className="p-stat-name-small">{item.name}</span>
                    <span className="p-sub-stat">
                      PG {item.pg} / PE {item.pe} / PP {item.pp}
                    </span>
                  </div>
                  <span className="p-val-box loss">{item.ratio}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* BONUS */}
          <section className="p-card p-side-card">
            <h3 className="p-side-title">⭐ Coleccionista de Bonus</h3>
            <div className="p-scroll-area">
              {records?.bonusRank?.map((item, i) => (
                <div key={i} className="p-stat-player-row">
                  <span className="p-stat-name-small">{item.name}</span>
                  <span className="p-val-box win">+{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProdeRecords;
