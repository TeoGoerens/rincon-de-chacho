//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useParams } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import components
import AdminMenu from "../../../AdminMenu";

//Import CSS & styles
import "./MatchStatsUpdateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { createMatchStatAction } from "../../../../../redux/slices/match-stats/matchStatsSlices";

//Form schema
const formSchema = Yup.object({});

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const { appError, serverError } = storeData;
  const tournamentRound = storeData?.tournamentRound?.tournamentRound;
  const storeDataStats = useSelector((store) => store.stats);

  //Define the empty array matchStats
  const [matchStats, setMatchStats] = useState([]);

  //Define the array for errors on minutes played
  const [minutesPlayedErrors, setMinutesPlayedErrors] = useState([]);
  useEffect(() => {
    if (tournamentRound?.players) {
      setMinutesPlayedErrors(
        tournamentRound?.players?.map((player) => player._id)
      );
    } else {
      setMinutesPlayedErrors([]);
    }
  }, [tournamentRound?.players]);

  //Get tournament round information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
  }, [id]);

  //OnBlur function
  const handleBlur = (fieldName, playerId) => (event) => {
    //Tomo el valor proveniente del input
    const inputValue = event.target.value === "" ? 0 : event.target.value;

    //Tomo el array de playersId para ir limpiandolo a medida que cumpla con el requisito de minutos jugados
    const minutesPlayedErrorsSupport = minutesPlayedErrors;

    if (fieldName === "minutes_played") {
      if (
        inputValue > 90 ||
        inputValue <= 0 ||
        inputValue === null ||
        inputValue === ""
      ) {
      } else {
        const playerIndex = minutesPlayedErrorsSupport.indexOf(playerId);
        minutesPlayedErrorsSupport.splice(playerIndex, 1);
      }
    }

    setMinutesPlayedErrors(minutesPlayedErrorsSupport);

    if (minutesPlayedErrors.length > 0) {
      formik.errors.minutes_played =
        "Inserta un valor logico de minutos jugados";
    } else {
      delete formik.errors.minutes_played;
    }

    //Tomo referencia del array matchStat y copio su contenido en un array soporte
    let updatedMatchStats = matchStats;

    //Verifico si existe informacion del jugador en cuestion. En caso de existir, me devuelve el indice dentro del array donde figura el objeto. De lo contrario devuelve -1
    const existingPlayerIndex = matchStats.findIndex(
      (jugador) => jugador.playerId === playerId
    );

    if (existingPlayerIndex >= 0) {
      //Si el jugador existe crear/sobreescribir la propiedad con el valor que viene desde el input
      updatedMatchStats[existingPlayerIndex][fieldName] = inputValue;
    } else {
      //Si el jugador no existe, entonces creo un nuevo objeto donde se agreguen dos valores, el playerId y el valor asociado al campo en cuestion
      updatedMatchStats.push({ playerId: playerId, [fieldName]: inputValue });
    }

    setMatchStats(updatedMatchStats);
  };

  //Formik configuration
  const formik = useFormik({
    initialValues: { matchStats: [] },
    onSubmit: (values) => {
      values = matchStats;
      //Dispatch the action
      dispatch(createMatchStatAction(values));
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated category
  if (storeDataStats?.isCreated)
    return <Navigate to="/admin/chachos/match-stats" />;

  return (
    <>
      <AdminMenu />
      <div className="container update-match-stat-container">
        <div className="update-match-stat-title">
          <h2>Crear estadísticas para la fecha</h2>
          <Link className="return-link" to="/admin/chachos/match-stats">
            Volver
          </Link>
        </div>

        {appError || serverError ? (
          <h5 className="error-message">{appError}</h5>
        ) : null}

        <div className="update-match-stat-details">
          <h4>Detalles del partido:</h4>
          <div>
            <p>
              Fecha: <span>{formatDate(tournamentRound?.match_date)}</span>
            </p>
          </div>
          <div>
            <p>
              Torneo: <span>{tournamentRound?.tournament.name}</span>
            </p>
          </div>
          <div>
            <p>
              Rival: <span>{tournamentRound?.rival.name}</span>
            </p>
          </div>
          <div>
            <p>
              Resultado:{" "}
              <span>
                {tournamentRound?.score_chachos} -{" "}
                {tournamentRound?.score_rival}
              </span>
            </p>
          </div>
        </div>

        <form className="update-match-stat-form" onSubmit={formik.handleSubmit}>
          <h4>Estadísticas de los jugadores</h4>

          <div className="error-message">{formik.errors.minutes_played}</div>

          {tournamentRound?.players?.map((player) => (
            <div key={player._id} className="update-match-stat-form-player">
              <label>
                {player.first_name} {player.last_name}
              </label>

              <div className="update-match-stat-form-player-inputs">
                {/* Minutos jugados */}
                <div>
                  <p>Minutos:</p>
                  <input
                    onBlur={handleBlur("minutes_played", player._id)}
                    type="number"
                    name={`${player._id}.minutes_played`}
                  />
                </div>

                {/* Goles */}
                <div>
                  <p>Goles:</p>
                  <input
                    onBlur={handleBlur("goals", player._id)}
                    type="number"
                    name={`${player._id}.goals`}
                  />
                </div>

                {/* Asistencias */}
                <div>
                  <p>Asistencias:</p>
                  <input
                    onBlur={handleBlur("assists", player._id)}
                    type="number"
                    name={`${player._id}.assists`}
                  />
                </div>

                {/* Tarjetas amarillas */}
                <div>
                  <p>Amarillas:</p>
                  <input
                    onBlur={handleBlur("yellow_cards", player._id)}
                    type="number"
                    name={`${player._id}.yellow_cards`}
                  />
                </div>

                {/* Tarjetas rojas */}
                <div>
                  <p>Rojas:</p>
                  <input
                    onBlur={handleBlur("red_cards", player._id)}
                    type="number"
                    name={`${player._id}.red_cards`}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="submit">Actualizar estadísticas</button>
        </form>
      </div>
    </>
  );
};

export default MatchStatsUpdate;
