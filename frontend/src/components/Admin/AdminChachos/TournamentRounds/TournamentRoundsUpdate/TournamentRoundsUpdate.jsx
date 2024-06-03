//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import helpers
import { formatDateForInput } from "../../../../../helpers/dateFormatter";

//Import components
import TournamentDropdown from "../../../../Layout/Dropdown/Tournament/TournamentDropdown";
import RivalDropdown from "../../../../Layout/Dropdown/Rival/RivalDropdown";
import PlayersToggleList from "../../../../Layout/ToggleList/PlayersToggleList";
import AdminMenu from "../../../AdminMenu";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTournamentRoundAction,
  updateTournamentRoundAction,
} from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";

//Form schema
const formSchema = Yup.object({
  tournament: Yup.string().required(
    "Por favor chacal escribi el nombre del torneo"
  ),
  rival: Yup.string().required(
    "Por favor chacal escribi el nombre del equipo rival"
  ),
  match_date: Yup.date().required("Por favor chacal selecciona la fecha"),
  score_chachos: Yup.number().required(
    "Por favor chacal escribi la cantidad de goles que hizo Chachos"
  ),
  score_rival: Yup.string().required(
    "Por favor chacal esecribi la cantidad de goles que se comió Chachos"
  ),
  players: Yup.array().required(
    "Por favor chacal indica quienes jugaron el partido"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);

  const { appError, serverError, loading } = storeData;
  const tournament =
    storeData?.tournamentRound?.tournamentRound?.tournament?._id;
  const rival = storeData?.tournamentRound?.tournamentRound?.rival?._id;
  const match_date = storeData?.tournamentRound?.tournamentRound?.match_date;
  const score_chachos =
    storeData?.tournamentRound?.tournamentRound?.score_chachos;
  const score_rival = storeData?.tournamentRound?.tournamentRound?.score_rival;
  const players = storeData?.tournamentRound?.tournamentRound?.players;
  const initialSelectedPlayers = players?.map((player) => player._id) || [];

  //Define the array of selected players. No need to use Redux
  const [selectedPlayers, setSelectedPlayers] = useState(
    initialSelectedPlayers
  );
  useEffect(() => {
    setSelectedPlayers(initialSelectedPlayers);
  }, [loading]);

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      tournament,
      rival,
      match_date,
      score_chachos,
      score_rival,
      players,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        updateTournamentRoundAction({
          tournament: values.tournament,
          rival: values.rival,
          match_date: values.match_date,
          score_chachos: values.score_chachos,
          score_rival: values.score_rival,
          players: selectedPlayers,
          id,
        })
      );
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated category
  if (storeData?.isEdited)
    return <Navigate to="/admin/chachos/tournament-rounds" />;

  return (
    <>
      <AdminMenu />
      <h2>Editar fecha</h2>
      {appError || serverError ? (
        <h5>
          {appError} {serverError}
        </h5>
      ) : null}

      <form onSubmit={formik.handleSubmit}>
        <TournamentDropdown
          field={{
            value: formik.values.tournament,
            onBlur: formik.handleBlur("tournament"),
          }}
          form={formik}
        />
        <RivalDropdown
          field={{
            value: formik.values.rival,
            onBlur: formik.handleBlur("rival"),
          }}
          form={formik}
        />
        <label>Fecha</label>
        <input
          value={formatDateForInput(formik.values.match_date)}
          onChange={formik.handleChange("match_date")}
          onBlur={formik.handleBlur("match_date")}
          type="date"
          name="match_date"
        ></input>
        <div>{formik.touched.match_date && formik.errors.match_date}</div>
        <label>Goles Chachos</label>
        <input
          value={formik.values.score_chachos}
          onChange={formik.handleChange("score_chachos")}
          onBlur={formik.handleBlur("score_chachos")}
          type="number"
          min="0"
          name="score_chachos"
        ></input>
        <div>{formik.touched.score_chachos && formik.errors.score_chachos}</div>
        <label>Goles rival</label>
        <input
          value={formik.values.score_rival}
          onChange={formik.handleChange("score_rival")}
          onBlur={formik.handleBlur("score_rival")}
          type="number"
          min="0"
          name="score_rival"
        ></input>
        <div>{formik.touched.score_rival && formik.errors.score_rival}</div>

        <PlayersToggleList
          selectedPlayers={selectedPlayers}
          setSelectedPlayers={setSelectedPlayers}
        />
        <div>{formik.touched.players && formik.errors.players}</div>

        <button type="submit">Editar fecha</button>
      </form>
    </>
  );
};

export default TournamentRoundsUpdate;
