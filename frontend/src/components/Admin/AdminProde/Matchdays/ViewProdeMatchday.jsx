import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import fetchProdeMatchdayById from "../../../../reactquery/prode/fetchProdeMatchdayById";

const ViewProdeMatchday = () => {
  const { id } = useParams(); // ✅ :id

  const {
    data: matchday,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchProdeMatchdayById", id],
    queryFn: () => fetchProdeMatchdayById(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="prode-page">
        <p>Cargando fecha...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="prode-page">
        <p>❌ Error: {error?.message || "No se pudo cargar la fecha"}</p>
        <Link className="back-btn" to="/admin/prode/fechas">
          <i className="fa-solid fa-arrow-left"></i> Volver
        </Link>
      </div>
    );
  }

  const tournamentName = matchday?.tournament?.name
    ? `${matchday.tournament.name} (${matchday.tournament.year})`
    : "—";

  const updatedAtStr = matchday?.updatedAt
    ? new Date(matchday.updatedAt).toLocaleString("es-AR")
    : "-";

  const duels = Array.isArray(matchday?.duels) ? matchday.duels : [];

  return (
    <div className="prode-page">
      <div className="prode-form-head">
        <h2 className="prode-title">Ver fecha</h2>

        <Link className="back-btn" to="/admin/prode/fechas">
          <i className="fa-solid fa-arrow-left"></i> Volver
        </Link>
      </div>

      {/* Meta */}
      <div className="prode-form">
        <div className="prode-view-grid">
          <div>
            <span className="prode-view-label">Torneo</span>
            <div className="prode-view-value">{tournamentName}</div>
          </div>

          <div>
            <span className="prode-view-label">Ronda</span>
            <div className="prode-view-value">
              {matchday?.roundNumber ?? "-"}
            </div>
          </div>

          <div>
            <span className="prode-view-label">Mes</span>
            <div className="prode-view-value">{matchday?.month ?? "-"}</div>
          </div>

          <div>
            <span className="prode-view-label">Estado</span>
            <div className="prode-view-value">
              <span className={`prode-status prode-status-${matchday?.status}`}>
                {matchday?.status || "-"}
              </span>
            </div>
          </div>

          <div>
            <span className="prode-view-label">Última actualización</span>
            <div className="prode-view-value">{updatedAtStr}</div>
          </div>
        </div>

        <p className="prode-help" style={{ marginTop: "0.8rem" }}>
          Vista de solo lectura: Para editar información de la fecha o cargar
          duelos referirse a la sección correspondiente.
        </p>
      </div>

      {/* Full */}
      <div className="prode-form" style={{ marginTop: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Duelos</h3>

        {duels.length === 0 ? (
          <p className="prode-help">No hay duelos cargados.</p>
        ) : (
          duels.map((d, idx) => {
            const playerA = d.playerA?.name || String(d.playerA || "");
            const playerB = d.playerB?.name || String(d.playerB || "");

            const pointsA = d?.points?.playerA ?? 0;
            const pointsB = d?.points?.playerB ?? 0;
            const bonusA = d?.points?.bonusA ?? 0;
            const bonusB = d?.points?.bonusB ?? 0;

            return (
              <div key={idx} className="prode-view-card">
                <div className="prode-view-card-head">
                  <strong>
                    {playerA} vs {playerB}
                  </strong>

                  <div className="prode-view-card-meta">
                    <span className="prode-pill">
                      duelResult: {d?.duelResult ?? "-"}
                    </span>
                    <span className="prode-pill">
                      pts: A {pointsA}+{bonusA} / B {pointsB}+{bonusB}
                    </span>
                  </div>
                </div>

                <div
                  className="prode-table-wrapper"
                  style={{ marginTop: "0.5rem" }}
                >
                  <table className="prode-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Score A</th>
                        <th>Score B</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d?.challenges || []).map((c, i) => (
                        <tr key={i}>
                          <td>{c?.type ?? "-"}</td>
                          <td>{c?.scoreA ?? "-"}</td>
                          <td>{c?.scoreB ?? "-"}</td>
                          <td>{c?.result ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ViewProdeMatchday;
