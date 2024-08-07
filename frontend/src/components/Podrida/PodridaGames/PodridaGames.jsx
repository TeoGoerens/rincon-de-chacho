//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./PodridaGamesStyles.css";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter";

//Import components
import PodridaMenu from "../PodridaMenu";
import VoteButton from "../../Layout/Buttons/VoteButton";
import ViewResultsButton from "../../Layout/Buttons/ViewResultsButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTournamentRoundsAction } from "../../../redux/slices/tournament-rounds/tournamentRoundsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const PodridaGames = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const tournamentRounds = storeData.tournamentRounds?.tournamentRounds;
  const { appError, serverError, isDeleted, isEdited } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentRoundsAction());
  }, [dispatch, isDeleted, isEdited]);

  return (
    <>
      <PodridaMenu />

      <div className="container chachos-tournament-rounds-container">
        <h2>Historial de fechas</h2>
        {appError || serverError ? (
          <h5>{appError}</h5>
        ) : tournamentRounds?.length <= 0 ? (
          <h3>No se encontraron fechas en la base de datos</h3>
        ) : (
          <div className="chachos-tournament-rounds-main-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rival</th>
                  <th>Resultado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournamentRounds?.map((tournamentRound) => (
                  <tr key={tournamentRound._id}>
                    <td>
                      <p>{formatDate(tournamentRound.match_date)}</p>
                    </td>
                    <td>
                      <p>{tournamentRound.rival?.name}</p>
                    </td>
                    <td>
                      <p>
                        {tournamentRound.score_chachos} -{" "}
                        {tournamentRound.score_rival}
                      </p>
                    </td>
                    <td className="icon-container">
                      {tournamentRound.open_for_vote ? (
                        <VoteButton to={`${tournamentRound.id}/vote`} />
                      ) : (
                        <ViewResultsButton
                          to={`${tournamentRound.id}/results`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default PodridaGames;
