//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./TournamentRoundsStyle.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";
import ToggleOpenForVote from "../../../Layout/Buttons/ToggleOpenForVote";
import AdminMenu from "../../AdminMenu";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deleteTournamentRoundAction,
  getAllTournamentRoundsAction,
  updateOpenForVoteAction,
} from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsIndex = () => {
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

  const handleDelete = (id) => {
    dispatch(deleteTournamentRoundAction(id));
  };

  const toggleOpenForVote = (id) => {
    dispatch(updateOpenForVoteAction(id));
  };

  return (
    <>
      <AdminMenu />
      <div className="container">
        <Link to="/admin/chachos/tournament-rounds/create">Crear fecha</Link>

        {appError || serverError ? (
          <h3>
            {appError} {serverError}
          </h3>
        ) : tournamentRounds?.length <= 0 ? (
          <h3>No se encontraron fechas en la base de datos</h3>
        ) : (
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
                    <ToggleOpenForVote
                      isOpen={tournamentRound.open_for_vote}
                      onClick={toggleOpenForVote}
                      id={tournamentRound._id}
                    />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default TournamentRoundsIndex;
