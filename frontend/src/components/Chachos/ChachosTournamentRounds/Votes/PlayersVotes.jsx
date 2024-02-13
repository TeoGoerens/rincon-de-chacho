//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";

//Import CSS & styles
import "./PlayersVotesStyles.css";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import {
  createVoteAction,
  getVoteByVoterandTournamentRoundAction,
  getVotesFromTournamentRoundAction,
} from "../../../../redux/slices/votes/votesSlices";

//Form schema
const formSchema = Yup.object({
  white_pearl: Yup.string().required(
    "Por favor chacal elegi a la perla blanca"
  ),
  vanilla_pearl: Yup.string().required(
    "Por favor chacal elegi a la perla vainilla"
  ),
  ocher_pearl: Yup.string().required("Por favor chacal elegi a la perla ocre"),
  black_pearl: Yup.string().required("Por favor chacal elegi a la perla negra"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersVotes = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
    dispatch(getVoteByVoterandTournamentRoundAction(id));
    dispatch(getVotesFromTournamentRoundAction(id));
  }, [dispatch, id]);

  //Formik configuration
  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      values.evaluation = playersEvaluation;
      //Dispatch the action
      dispatch(createVoteAction(values));
    },
    validationSchema: formSchema,
  });

  //Define the array that will have players' evaluation
  const [playersEvaluation, setPlayersEvaluation] = useState([]);

  //Select tournament round state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const tournamentRound = storeData.tournamentRound?.tournamentRound;
  const players = storeData?.tournamentRound?.tournamentRound?.players;

  //Select vote state from store
  const VotesStoreData = useSelector((store) => store.votes);
  const voteByVoterAndRound = VotesStoreData?.voteByVoterAndRound?.usersVote;

  console.log(voteByVoterAndRound);

  const { appError, serverError } = VotesStoreData;

  //Navigate to index in case there is an created vote
  if (VotesStoreData?.isCreated)
    return <Navigate to="/chachos/tournament-rounds" />;

  return (
    <>
      <h3>Votos para la fecha</h3>
      {appError || serverError ? <h5>{appError}</h5> : null}

      {voteByVoterAndRound ? (
        <>
          <h4>
            Tu voto ya fue registrado. Espera que se cierre la fecha para ver
            resultados
          </h4>
          <Link className="return-link" to="/chachos/tournament-rounds">
            Volver
          </Link>
        </>
      ) : (
        <>
          <p>Fecha: {formatDate(tournamentRound?.match_date)}</p>
          <p>Rival: {tournamentRound?.rival?.name}</p>
          <p>
            Resultado: {tournamentRound?.score_chachos} -{" "}
            {tournamentRound?.score_rival}
          </p>

          <form onSubmit={formik.handleSubmit}>
            <label>Puntajes</label>
            {players &&
              players.map((player) => (
                <div className="player-details" key={player._id}>
                  <p value={player._id}>
                    {player.first_name} {player.last_name}
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={
                      playersEvaluation.find(
                        (evaluation) => evaluation.player === player._id
                      )?.points || 0
                    }
                    onChange={(e) => {
                      const newPoints = parseInt(e.target.value, 10) || 0;
                      const updatedEvaluation = {
                        player: player._id,
                        points: newPoints,
                      };

                      setPlayersEvaluation((prevPlayersEvaluation) => {
                        const index = prevPlayersEvaluation.findIndex(
                          (evaluation) => evaluation.player === player._id
                        );

                        if (index !== -1) {
                          // Actualizar el objeto existente
                          const updatedArray = [...prevPlayersEvaluation];
                          updatedArray[index] = updatedEvaluation;
                          return updatedArray;
                        } else {
                          // Agregar el nuevo objeto al array
                          return [...prevPlayersEvaluation, updatedEvaluation];
                        }
                      });
                    }}
                    onBlur={formik.handleBlur("evaluation")}
                  />
                </div>
              ))}
            <div>{formik.touched.evaluation && formik.errors.evaluation}</div>

            <label>Perla Blanca</label>
            <select
              value={formik.values.white_pearl}
              onChange={formik.handleChange("white_pearl")}
              onBlur={formik.handleBlur("white_pearl")}
              name="white_pearl"
            >
              <option value="" label="Selecciona un jugador" />
              {players &&
                players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.first_name} {player.last_name}
                  </option>
                ))}
            </select>
            <div>{formik.touched.white_pearl && formik.errors.white_pearl}</div>
            <label>Perla Vainilla</label>
            <select
              value={formik.values.vanilla_pearl}
              onChange={formik.handleChange("vanilla_pearl")}
              onBlur={formik.handleBlur("vanilla_pearl")}
              name="vanilla_pearl"
            >
              <option value="" label="Selecciona un jugador" />
              {players &&
                players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.first_name} {player.last_name}
                  </option>
                ))}
            </select>
            <div>
              {formik.touched.vanilla_pearl && formik.errors.vanilla_pearl}
            </div>
            <label>Perla Ocre</label>
            <select
              value={formik.values.ocher_pearl}
              onChange={formik.handleChange("ocher_pearl")}
              onBlur={formik.handleBlur("ocher_pearl")}
              name="ocher_pearl"
            >
              <option value="" label="Selecciona un jugador" />
              {players &&
                players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.first_name} {player.last_name}
                  </option>
                ))}
            </select>
            <div>{formik.touched.ocher_pearl && formik.errors.ocher_pearl}</div>
            <label>Perla Negra</label>
            <select
              value={formik.values.black_pearl}
              onChange={formik.handleChange("black_pearl")}
              onBlur={formik.handleBlur("black_pearl")}
              name="black_pearl"
            >
              <option value="" label="Selecciona un jugador" />
              {players &&
                players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.first_name} {player.last_name}
                  </option>
                ))}
            </select>
            <div>{formik.touched.black_pearl && formik.errors.black_pearl}</div>

            <button type="submit">Crear voto</button>
          </form>
        </>
      )}
    </>
  );
};

export default PlayersVotes;
