//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../PlayersFormStyle.css";

//Import React Query functions
import fetchPlayerById from "../../../../../reactquery/chachos/fetchPlayerById";

//Etiquetas en español para posición y rol
import { POSITION_LABEL, ROLE_LABEL } from "../../../../../helpers/playerLabels";

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersDetail = () => {
  const { id } = useParams();

  const { data: player, error } = useQuery({
    queryKey: ["chachos-player", id],
    queryFn: () => fetchPlayerById(id),
  });

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de jugador</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/players">
          Volver
        </Link>
      </div>

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
      ) : (
        <div className="plfd-card">
          <div className="plfd-head">
            <span className="plfd-shirt">#{player?.shirt}</span>
            <h2 className="plfd-name">
              {player?.first_name} {player?.last_name}
            </h2>
          </div>

          <div className="plfd-meta">
            <span className="plfd-chip">
              {POSITION_LABEL[player?.field_position] ??
                player?.field_position}
            </span>
            <span className="plfd-chip">
              {ROLE_LABEL[player?.role] ?? player?.role}
            </span>
          </div>

          <div>
            <span className="plfd-section-title">Bio</span>
            {player?.bio ? (
              <p className="plfd-bio">{player.bio}</p>
            ) : (
              <p className="plfd-empty">Sin bio registrada</p>
            )}
          </div>

          <div>
            <span className="plfd-section-title">Entrevista</span>
            {player?.interview ? (
              <div
                className="plfd-interview"
                dangerouslySetInnerHTML={{ __html: player.interview }}
              />
            ) : (
              <p className="plfd-empty">Sin entrevista registrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersDetail;
