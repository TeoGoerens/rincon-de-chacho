//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsStyle.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import components
import CreateStatsButton from "../../../Layout/Buttons/CreateStatsButton";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

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

  //Select stats state from store
  const statsStoreData = useSelector((store) => store.stats);
  const { isDeleted } = statsStoreData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentRoundsAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deleteMatchStatsForARoundAction(id));
  };

  return (
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Estadísticas</h1>
          <p className="ctr-subtitle">
            {tournamentRounds
              ? `${tournamentRounds.length} fechas registradas`
              : "Cargando..."}
          </p>
        </div>
      </div>

      {appError || serverError ? (
        <p className="ctr-state">
          {appError} {serverError}
        </p>
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournamentRounds?.map((round) => (
                  <tr key={round._id}>
                    <td>
                      <span className="ctr-cell-date">
                        {formatDate(round.match_date)}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-rival">
                        {round.rival?.name}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-score">
                        {round.score_chachos} - {round.score_rival}
                      </span>
                    </td>
                    <td>
                      <div className="ctr-actions">
                        {round.complete_stats === false ? (
                          <CreateStatsButton
                            to={`/admin/chachos/match-stats/create/${round._id}`}
                          />
                        ) : (
                          <>
                            <ViewButton
                              to={`/admin/chachos/match-stats/view/${round._id}`}
                            />
                            <EditButton
                              to={`/admin/chachos/match-stats/update/${round._id}`}
                            />
                            <DeleteButton
                              onClick={handleDelete}
                              id={round._id}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="ctr-mobile-list">
            {tournamentRounds?.map((round) => (
              <div className="ctr-mobile-card" key={round._id}>
                <div className="ctr-mobile-row-top">
                  <span className="ctr-cell-rival">{round.rival?.name}</span>
                  <span className="ctr-cell-score">
                    {round.score_chachos} - {round.score_rival}
                  </span>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <span className="ctr-cell-date">
                    {formatDate(round.match_date)}
                  </span>
                  <div className="ctr-actions">
                    {round.complete_stats === false ? (
                      <CreateStatsButton
                        to={`/admin/chachos/match-stats/create/${round._id}`}
                      />
                    ) : (
                      <>
                        <ViewButton
                          to={`/admin/chachos/match-stats/view/${round._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/match-stats/update/${round._id}`}
                        />
                        <DeleteButton onClick={handleDelete} id={round._id} />
                      </>
                    )}
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

export default MatchStatsIndex;
