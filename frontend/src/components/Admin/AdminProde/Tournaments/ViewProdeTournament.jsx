import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import fetchProdeTournamentSummary from "../../../../reactquery/prode/fetchProdeTournamentSummary";

const ViewProdeTournament = () => {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fetchProdeTournamentSummary", id],
    queryFn: () => fetchProdeTournamentSummary(id),
    enabled: !!id,
  });

  const tournament = data?.tournament;
  const summary = data?.summary;

  const months = useMemo(() => tournament?.months || [], [tournament]);
  const standings = useMemo(() => summary?.table || [], [summary]);

  if (isLoading) {
    return (
      <div className="prode-page">
        <p>Cargando torneo...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="prode-page">
        <p>❌ Error: {error?.message || "No se pudo cargar el torneo"}</p>

        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          Volver
        </Link>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="prode-page">
        <p>❌ No se encontró el torneo.</p>

        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Ver torneo</h2>

        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          <i className="fa-solid fa-arrow-left"></i>
          Volver
        </Link>
      </div>

      {/* META */}
      <div className="prode-form" style={{ gap: "0.8rem" }}>
        <div>
          <strong>Nombre:</strong> {tournament.name}
        </div>

        <div>
          <strong>Año:</strong> {tournament.year}
        </div>

        <div>
          <strong>Estado:</strong>{" "}
          <span className={`prode-status prode-status-${tournament.status}`}>
            {tournament.status}
          </span>
        </div>

        <div>
          <strong>Meses:</strong>
          <div
            className="prode-pills-container"
            style={{ marginTop: "0.35rem" }}
          >
            {months.length === 0 && (
              <span className="prode-help">Sin meses.</span>
            )}
            {months.map((m) => (
              <span key={m} className="prode-pill">
                {m}
              </span>
            ))}
          </div>
        </div>

        <hr className="prode-divider" />

        {/* Champion / Last */}
        <div className="prode-grid-2">
          <div>
            <strong>🏅Campeón:</strong> {tournament?.champion?.name || "—"}
          </div>

          <div>
            <strong>☠️Último:</strong> {tournament?.lastPlace?.name || "—"}
          </div>
        </div>

        {/* Monthly winners */}
        <div style={{ marginTop: "0.2rem" }}>
          <strong>Ganadores de la comida gratis:</strong>

          {Array.isArray(tournament.monthlyWinners) &&
          tournament.monthlyWinners.length > 0 ? (
            <div
              className="prode-table-wrapper"
              style={{ marginTop: "0.5rem" }}
            >
              <table className="prode-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Top 4</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.monthlyWinners.map((mw) => (
                    <tr key={mw.month}>
                      <td>{mw.month}</td>
                      <td>
                        {(mw?.winnerPlayerIds || [])
                          .map((p) => p?.name || "—")
                          .join(" · ")}
                      </td>
                      <td>{mw.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="prode-help" style={{ marginTop: "0.35rem" }}>
              Todavía no hay ganadores mensuales cargados.
            </p>
          )}
        </div>
      </div>

      {/* Standings */}
      <div style={{ marginTop: "1rem" }}>
        <div className="prode-head">
          <h3 className="prode-title">Tabla de posiciones</h3>
        </div>

        <div className="prode-table-wrapper">
          <table className="prode-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>Puntos base</th>
                <th>Bonus</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {standings.length === 0 && (
                <tr>
                  <td colSpan="9">
                    No hay standings (¿fechas played cargadas?)
                  </td>
                </tr>
              )}

              {standings.map((row, idx) => (
                <tr key={row.playerId || `${row.name}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{row.playerName || row.name || "—"}</td>

                  <td>{row.played ?? 0}</td>
                  <td>{row.wins ?? 0}</td>
                  <td>{row.draws ?? 0}</td>
                  <td>{row.losses ?? 0}</td>

                  <td>{row.basePoints ?? 0}</td>
                  <td>{row.bonusPoints ?? 0}</td>
                  <td>
                    <strong>{row.totalPoints ?? 0}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="prode-help">
          Nota: si el torneo no está en <strong>finished</strong>, igual podés
          ver el resumen. Campeón/Último se “congelan” recién cuando lo cerrás.
        </p>
      </div>
    </div>
  );
};

export default ViewProdeTournament;
