//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import CSS & styles
import "../TournamentRoundsFormStyle.css";
import "./TournamentRoundsDetailStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";

//Import components
import DeleteButton from "../../../../Layout/Buttons/DeleteButton";

//Import React Query functions
import fetchRoundById from "../../../../../reactquery/chachos/fetchRoundById";
import fetchVotesByRound from "../../../../../reactquery/chachos/fetchVotesByRound";
import deleteVote from "../../../../../reactquery/chachos/deleteVote";
import consolidatePearls from "../../../../../reactquery/chachos/consolidatePearls";

//Definición de perlas (mismo mapeo de colores que el sitio público)
const PEARLS = [
  { key: "white_pearl", label: "Perla Blanca", colorVar: "var(--third-color)" },
  { key: "vanilla_pearl", label: "Perla Vainilla", colorVar: "var(--color-podrida)" },
  { key: "ocher_pearl", label: "Perla Ocre", colorVar: "var(--color-prode)" },
  { key: "black_pearl", label: "Perla Negra", colorVar: "var(--fourth-color)" },
];

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: roundData, error } = useQuery({
    queryKey: ["tournament-round", id],
    queryFn: () => fetchRoundById(id),
  });
  const tournamentRound = roundData?.tournamentRound;

  const { data: votesData } = useQuery({
    queryKey: ["votes-by-round", id],
    queryFn: () => fetchVotesByRound(id),
  });
  const votesByRound = votesData?.allVotesForRound;

  const deleteVoteMutation = useMutation({
    mutationFn: deleteVote,
    onSuccess: () => {
      queryClient.invalidateQueries(["votes-by-round", id]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Error al eliminar el voto");
    },
  });

  const consolidatePearlsMutation = useMutation({
    mutationFn: consolidatePearls,
    onSuccess: () => {
      queryClient.invalidateQueries(["tournament-round", id]);
      queryClient.invalidateQueries(["admin-tournament-rounds"]);
      toast.success("Perlas consolidadas correctamente");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Error al consolidar las perlas"
      );
    },
  });

  //Functions assigned to buttons
  const handleDelete = (voteId) => {
    deleteVoteMutation.mutate(voteId);
  };

  const handleConsolidatePearls = () => {
    consolidatePearlsMutation.mutate({
      tournamentRoundId: id,
      fullVotes: votesByRound,
    });
  };

  //Constant definitions to place in view
  const match_date = formatDate(tournamentRound?.match_date);
  const rival = tournamentRound?.rival?.name;
  const score_chachos = tournamentRound?.score_chachos;
  const score_rival = tournamentRound?.score_rival;

  const white_pearl = tournamentRound?.white_pearl;
  const vanilla_pearl = tournamentRound?.vanilla_pearl;
  const ocher_pearl = tournamentRound?.ocher_pearl;
  const black_pearl = tournamentRound?.black_pearl;

  //Mapa de ganadores consolidados por perla (round level)
  const roundPearlWinners = {
    white_pearl,
    vanilla_pearl,
    ocher_pearl,
    black_pearl,
  };

  return (
    <div className="ctrd-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de fecha</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/tournament-rounds">
          Volver a fechas
        </Link>
      </div>

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
      ) : tournamentRound?.length <= 0 ? (
        <p className="ctrd-state">No se encontraron fechas en la base de datos</p>
      ) : (
        <>
          <div className="ctrd-match-card">
            <div className="ctrd-match-top">
              <span className="ctrd-match-date">{match_date}</span>
              <span className="ctrd-match-score">
                {score_chachos} - {score_rival}
              </span>
            </div>
            <h2 className="ctrd-match-rival">vs {rival}</h2>
          </div>

          <div className="ctrd-pearls-grid">
            {PEARLS.map((pearl) => (
              <div
                className="ctrd-pearl-card"
                key={pearl.key}
                style={{ "--pearl-color": pearl.colorVar }}
              >
                <div className="ctrd-pearl-card-head">
                  <span className="ctrd-pearl-dot" />
                  <span className="ctrd-pearl-label">{pearl.label}</span>
                </div>
                <div className="ctrd-pearl-winners">
                  {roundPearlWinners[pearl.key]?.length > 0 ? (
                    roundPearlWinners[pearl.key].map((player) => (
                      <span key={player._id}>
                        {player.first_name} {player.last_name}
                      </span>
                    ))
                  ) : (
                    <span className="ctrd-pearl-empty">— Sin consolidar —</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="ctrd-votes-section">
        <div className="ctrd-votes-header">
          <h3 className="ctrd-votes-title">
            Votos totales{" "}
            <span className="ctrd-votes-count">
              ({votesByRound?.length ?? 0})
            </span>
          </h3>
          <button className="ctr-submit-btn" onClick={handleConsolidatePearls}>
            Consolidar perlas
          </button>
        </div>

        <div className="ctrd-votes-list">
          {votesByRound &&
            votesByRound.map((vote) => (
              <div className="ctrd-vote-card" key={vote._id}>
                <div className="ctrd-vote-card-head">
                  <span className="ctrd-vote-voter">
                    {vote.voter.first_name} {vote.voter.last_name}
                  </span>
                  <DeleteButton
                    onClick={handleDelete}
                    id={vote._id}
                    customCSSClass="ctrd-vote-delete"
                  />
                </div>

                <div className="ctrd-vote-pearls">
                  {PEARLS.map((pearl) => {
                    const votedPlayer = vote[pearl.key];
                    return (
                      <span
                        className="ctrd-vote-pearl-chip"
                        key={pearl.key}
                        style={{ "--pearl-color": pearl.colorVar }}
                      >
                        {votedPlayer?.first_name} {votedPlayer?.last_name}
                      </span>
                    );
                  })}
                </div>

                {vote.evaluation && (
                  <div className="ctrd-vote-evaluations">
                    {vote.evaluation.map((ev) => (
                      <span className="ctrd-eval-chip" key={ev._id}>
                        {ev.player.first_name} {ev.player.last_name}{" "}
                        <strong>{ev.points}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentRoundsDetail;
