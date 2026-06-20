// Import React dependencies
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./PodridaDetailStyles.css";

//Import React Query functions
import fetchPodridaPlayerById from "../../../../reactquery/podrida/fetchPodridaPlayerById";
import fetchPodridaPlayerProfile from "../../../../reactquery/podrida/fetchPodridaPlayerProfile";

const PodridaPlayerDetail = () => {
  const { id } = useParams();

  const {
    data: player,
    isLoading: isLoadingPlayer,
    isError: isErrorPlayer,
    error: playerError,
  } = useQuery({
    queryKey: ["fetchPodridaPlayerById", id],
    queryFn: () => fetchPodridaPlayerById(id),
  });

  const { data: profileData, isError: isErrorProfile } = useQuery({
    queryKey: ["fetchPodridaPlayerProfile", id],
    queryFn: () => fetchPodridaPlayerProfile(id),
    enabled: !!player,
  });

  const profile = profileData?.profile;

  return (
    <div className="pdf-page">
      <div className="pdf-header">
        <div className="pdf-header-text">
          <div className="pdf-eyebrow">
            <span className="pdf-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pdf-title">Detalle del jugador</h1>
        </div>
        <Link className="pdf-back-link" to="/admin/podrida/jugadores">
          Volver
        </Link>
      </div>

      {isErrorPlayer ? (
        <p className="pdf-error-banner">
          {playerError?.message || "Ocurrió un error al cargar el jugador."}
        </p>
      ) : isLoadingPlayer ? (
        <p className="pdf-state">Cargando jugador...</p>
      ) : (
        <>
          <div className="pdf-card">
            <h3 className="pdf-card-title">{player.name}</h3>
            <span className="pdf-record-value">{player.email}</span>
          </div>

          {isErrorProfile || !profile ? (
            <p className="pdf-state">
              Este jugador todavía no tiene partidas registradas.
            </p>
          ) : (
            <>
              <div className="pdf-card">
                <h3 className="pdf-card-title">Estadísticas</h3>
                <div className="pdf-ranking-row">
                  <span className="pdf-ranking-name">Posición en el ranking</span>
                  <span className="pdf-ranking-score">
                    {profileData.rank}° de {profileData.totalPlayers}
                  </span>
                </div>
                <div className="pdf-ranking-row">
                  <span className="pdf-ranking-name">Partidas jugadas</span>
                  <span className="pdf-ranking-score">{profile.played}</span>
                </div>
                <div className="pdf-ranking-row">
                  <span className="pdf-ranking-name">Puntos</span>
                  <span className="pdf-ranking-score">{profile.points}</span>
                </div>
                <div className="pdf-ranking-row">
                  <span className="pdf-ranking-name">Promedio por partida</span>
                  <span className="pdf-ranking-score">{profile.average}</span>
                </div>
              </div>

              <div className="pdf-records-grid">
                <div className="pdf-record-card">
                  <span className="pdf-record-label">Primeros puestos</span>
                  <span className="pdf-record-value">{profile.firsts}</span>
                </div>
                <div className="pdf-record-card">
                  <span className="pdf-record-label">Últimos puestos</span>
                  <span className="pdf-record-value">{profile.lasts}</span>
                </div>
                <div className="pdf-record-card">
                  <span className="pdf-record-label">Highlights</span>
                  <span className="pdf-record-value">{profile.highlights}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PodridaPlayerDetail;
