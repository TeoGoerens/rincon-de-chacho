//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import CSS & styles
import "./TournamentRoundsStyle.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import React Query functions
import fetchAllTournamentRoundsAdmin from "../../../../reactquery/chachos/fetchAllTournamentRoundsAdmin";
import deleteTournamentRound from "../../../../reactquery/chachos/deleteTournamentRound";
import toggleOpenForVote from "../../../../reactquery/chachos/toggleOpenForVote";
import fetchVotesByRound from "../../../../reactquery/chachos/fetchVotesByRound";
import consolidatePearls from "../../../../reactquery/chachos/consolidatePearls";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";
import ToggleOpenForVote from "../../../Layout/Buttons/ToggleOpenForVote";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsIndex = () => {
  const queryClient = useQueryClient();

  const { data: tournamentRounds, error } = useQuery({
    queryKey: ["admin-tournament-rounds"],
    queryFn: fetchAllTournamentRoundsAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournamentRound,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-tournament-rounds"]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Error al eliminar la fecha");
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const toggleOpenForVoteMutation = useMutation({
    mutationFn: (tournamentRoundId) =>
      toggleOpenForVote({ tournamentRoundId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["admin-tournament-rounds"]);

      if (data?.failedEmails?.length > 0) {
        toast.warning(
          `No se pudo notificar a: ${data.failedEmails.join(", ")}`
        );
      } else {
        toast.success("Se notificó a todos los usuarios registrados");
      }
    },
    onError: (error) => {
      toast.error(`Error al cambiar el estado de la fecha: ${error.message}`);
    },
  });

  const handleToggleOpenForVote = async (id) => {
    const round = tournamentRounds?.find((r) => r._id === id);
    const isClosing = round?.open_for_vote === true;

    //Al cerrar la votación, consolidar las perlas automáticamente antes de
    //avisarle a los usuarios que los resultados están disponibles
    if (isClosing) {
      try {
        const votesPayload = await queryClient.fetchQuery({
          queryKey: ["votes-by-round", id],
          queryFn: () => fetchVotesByRound(id),
        });

        if (votesPayload?.allVotesForRound?.length > 0) {
          await consolidatePearls({
            tournamentRoundId: id,
            fullVotes: votesPayload.allVotesForRound,
          });
        }
      } catch (error) {
        toast.warning(
          "No se pudieron consolidar las perlas automáticamente. Podés hacerlo manualmente desde el detalle de la fecha."
        );
      }
    }

    toggleOpenForVoteMutation.mutate(id);
  };

  return (
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Fechas</h1>
          <p className="ctr-subtitle">
            {tournamentRounds
              ? `${tournamentRounds.length} fechas registradas`
              : "Cargando..."}
          </p>
        </div>
        <Link className="ctr-create-btn" to="/admin/chachos/tournament-rounds/create">
          Crear fecha
        </Link>
      </div>

      {error ? (
        <p className="ctr-state">{error.message}</p>
      ) : tournamentRounds?.length <= 0 ? (
        <p className="ctr-state">No se encontraron fechas en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="ctr-table-wrap ctr-desktop-only">
            <table className="ctr-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rival</th>
                  <th>Resultado</th>
                  <th>Votación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournamentRounds?.map((tournamentRound) => (
                  <tr key={tournamentRound._id}>
                    <td>
                      <span className="ctr-cell-date">
                        {formatDate(tournamentRound.match_date)}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-rival">
                        {tournamentRound.rival?.name}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-score">
                        {tournamentRound.score_chachos} -{" "}
                        {tournamentRound.score_rival}
                      </span>
                    </td>
                    <td>
                      <ToggleOpenForVote
                        isOpen={tournamentRound.open_for_vote}
                        onClick={handleToggleOpenForVote}
                        id={tournamentRound._id}
                        customCSSClass="ctr-toggle-vote"
                      />
                    </td>
                    <td>
                      <div className="ctr-actions">
                        <ViewButton
                          to={`/admin/chachos/tournament-rounds/view/${tournamentRound._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/tournament-rounds/update/${tournamentRound._id}`}
                        />
                        <DeleteButton
                          onClick={handleDelete}
                          id={tournamentRound._id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="ctr-mobile-list">
            {tournamentRounds?.map((tournamentRound) => (
              <div className="ctr-mobile-card" key={tournamentRound._id}>
                <div className="ctr-mobile-row-top">
                  <span className="ctr-cell-rival">
                    {tournamentRound.rival?.name}
                  </span>
                  <span className="ctr-cell-score">
                    {tournamentRound.score_chachos} -{" "}
                    {tournamentRound.score_rival}
                  </span>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <span className="ctr-cell-date">
                    {formatDate(tournamentRound.match_date)}
                  </span>
                  <ToggleOpenForVote
                    isOpen={tournamentRound.open_for_vote}
                    onClick={handleToggleOpenForVote}
                    id={tournamentRound._id}
                    customCSSClass="ctr-toggle-vote ctr-toggle-vote--mobile"
                  />
                  <div className="ctr-actions">
                    <ViewButton
                      to={`/admin/chachos/tournament-rounds/view/${tournamentRound._id}`}
                    />
                    <EditButton
                      to={`/admin/chachos/tournament-rounds/update/${tournamentRound._id}`}
                    />
                    <DeleteButton
                      onClick={handleDelete}
                      id={tournamentRound._id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentRoundsIndex;
