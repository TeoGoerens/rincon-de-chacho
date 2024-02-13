//Import React & Hooks
import React, { useState } from "react";
import { Navigate } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import components
import TournamentDropdown from "../../../Layout/Dropdown/Tournament/TournamentDropdown";
import RivalDropdown from "../../../Layout/Dropdown/Rival/RivalDropdown";
import PlayersToggleList from "../../../Layout/ToggleList/PlayersToggleList";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createTournamentRoundAction } from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";

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
  players: Yup.array().min(
    1,
    "Por favor chacal indica quienes jugaron el partido"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsCreate = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Define the array of selected players. No need to use Redux
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  //Formik configuration
  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      //Dispatch the action
      values.players = selectedPlayers;
      dispatch(createTournamentRoundAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated)
    return <Navigate to="/admin/chachos/tournament-rounds" />;

  return (
    <>
      <h2>Crear fecha</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

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
          value={formik.values.match_date}
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

        <button type="submit">Crear fecha</button>
      </form>
    </>
  );
};

export default TournamentRoundsCreate;
