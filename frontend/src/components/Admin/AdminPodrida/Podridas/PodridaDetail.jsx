// Import React dependencies
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./PodridaDetailStyles.css";
import { formatDate } from "../../../../helpers/dateFormatter";

//Import React Query functions
import fetchPodridaMatchById from "../../../../reactquery/podrida/fetchPodridaMatchById";

const PodridaDetail = () => {
  const { id } = useParams();

  const { data: match, isLoading, isError, error } = useQuery({
    queryKey: ["fetchPodridaMatchById", id],
    queryFn: () => fetchPodridaMatchById(id),
  });

  const rankedPlayers = [...(match?.players ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="pdf-page">
      <div className="pdf-header">
        <div className="pdf-header-text">
          <div className="pdf-eyebrow">
            <span className="pdf-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pdf-title">Detalle de la partida</h1>
        </div>
        <Link className="pdf-back-link" to="/admin/podrida">
          Volver
        </Link>
      </div>

      {isError ? (
        <p className="pdf-error-banner">
          {error?.message || "Ocurrió un error al cargar la partida."}
        </p>
      ) : isLoading ? (
        <p className="pdf-state">Cargando partida...</p>
      ) : (
        <>
          <div className="pdf-match-summary">
            <span>{formatDate(match.date)}</span>
          </div>

          <div className="pdf-card">
            <h3 className="pdf-card-title">Resultados</h3>
            {rankedPlayers.map((p) => (
              <div className="pdf-ranking-row" key={p.player._id}>
                <span className="pdf-ranking-position">{p.position}°</span>
                <span className="pdf-ranking-name">{p.player.name}</span>
                <span className="pdf-ranking-score">{p.score}</span>
              </div>
            ))}
          </div>

          <div className="pdf-records-grid">
            <div className="pdf-record-card">
              <span className="pdf-record-label">Highlight</span>
              <span className="pdf-record-name">{match.highlight.player.name}</span>
              <span className="pdf-record-value">{match.highlight.score} puntos</span>
            </div>
            <div className="pdf-record-card">
              <span className="pdf-record-label">Racha cumpliendo</span>
              <span className="pdf-record-name">
                {match.longestStreakOnTime.player.name}
              </span>
              <span className="pdf-record-value">
                {match.longestStreakOnTime.count} partidas
              </span>
            </div>
            <div className="pdf-record-card">
              <span className="pdf-record-label">Racha sin cumplir</span>
              <span className="pdf-record-name">
                {match.longestStreakFailing.player.name}
              </span>
              <span className="pdf-record-value">
                {match.longestStreakFailing.count} partidas
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PodridaDetail;
