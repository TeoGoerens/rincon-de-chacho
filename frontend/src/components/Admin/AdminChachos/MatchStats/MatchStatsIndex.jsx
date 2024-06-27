//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import components
import CreateStatsButton from "../../../Layout/Buttons/CreateStatsButton";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";
import AdminMenu from "../../AdminMenu";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTournamentRoundsAction } from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { deleteMatchStatsForARoundAction } from "../../../../redux/slices/match-stats/matchStatsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const tournamentRounds = storeData.tournamentRounds?.tournamentRounds;
  const { appError, serverError } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentRoundsAction());
  }, [dispatch, tournamentRounds]);

  const handleDelete = (id) => {
    dispatch(deleteMatchStatsForARoundAction(id));
  };

  return (
    <>
      <AdminMenu />

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
            {tournamentRounds?.map((round) => (
              <tr key={round._id}>
                <td>
                  <p>{formatDate(round.match_date)}</p>
                </td>
                <td>
                  <p>{round.rival?.name}</p>
                </td>
                <td>
                  <p>
                    {round.score_chachos} - {round.score_rival}
                  </p>
                </td>
                <td className="icon-container">
                  {round.complete_stats === false ? (
                    <CreateStatsButton
                      to={`/admin/chachos/match-stats/create/${round._id}`}
                    />
                  ) : (
                    <>
                      {" "}
                      <ViewButton
                        to={`/admin/chachos/match-stats/view/${round._id}`}
                      />
                      <EditButton
                        to={`/admin/chachos/match-stats/update/${round._id}`}
                      />
                      <DeleteButton onClick={handleDelete} id={round._id} />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default MatchStatsIndex;
