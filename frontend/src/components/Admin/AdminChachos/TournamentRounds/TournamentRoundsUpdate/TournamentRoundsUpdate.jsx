//Import React & Hooks
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import helpers
import { formatDateForInput } from "../../../../../helpers/dateFormatter";

//Import components
import TournamentDropdown from "../../../../Layout/Dropdown/Tournament/TournamentDropdown";
import RivalDropdown from "../../../../Layout/Dropdown/Rival/RivalDropdown";
import PlayersToggleList from "../../../../Layout/ToggleList/PlayersToggleList";

//Import CSS & styles
import "../TournamentRoundsFormStyle.css";

//Import React Query functions
import fetchRoundById from "../../../../../reactquery/chachos/fetchRoundById";
import updateTournamentRound from "../../../../../reactquery/chachos/updateTournamentRound";

//Form schema
const formSchema = Yup.object({
  tournament: Yup.string().required("Seleccioná el torneo"),
  rival: Yup.string().required("Seleccioná el equipo rival"),
  match_date: Yup.date().required("Seleccioná la fecha del partido"),
  score_chachos: Yup.number().required(
    "Ingresá la cantidad de goles de Chachos"
  ),
  score_rival: Yup.string().required(
    "Ingresá la cantidad de goles del rival"
  ),
  players: Yup.array().required("Indicá quiénes jugaron el partido"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: roundData } = useQuery({
    queryKey: ["tournament-round", id],
    queryFn: () => fetchRoundById(id),
  });
  const tournamentRound = roundData?.tournamentRound;

  const tournament = tournamentRound?.tournament?._id;
  const rival = tournamentRound?.rival?._id;
  const match_date = tournamentRound?.match_date;
  const score_chachos = tournamentRound?.score_chachos;
  const score_rival = tournamentRound?.score_rival;
  const players = tournamentRound?.players;
  const initialSelectedPlayers = players?.map((player) => player._id) || [];

  //Define the array of selected players. No need to use Redux
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  useEffect(() => {
    setSelectedPlayers(initialSelectedPlayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentRound?.players]);

  const mutation = useMutation({
    mutationFn: updateTournamentRound,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-tournament-rounds"]);
      queryClient.invalidateQueries(["tournament-round", id]);
      navigate("/admin/chachos/tournament-rounds");
    },
  });

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
      mutation.mutate({
        id,
        tournament: values.tournament,
        rival: values.rival,
        match_date: values.match_date,
        score_chachos: values.score_chachos,
        score_rival: values.score_rival,
        players: selectedPlayers,
      });
    },
    validationSchema: formSchema,
  });

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Editar fecha</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/tournament-rounds">
          Volver
        </Link>
      </div>

      {mutation.isError ? (
        <p className="ctr-form-error-banner">
          {mutation.error?.response?.data?.message}
        </p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
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

        <div className="ctr-form-row">
          <div className="ctr-field">
            <label>Fecha</label>
            <input
              value={formatDateForInput(formik.values.match_date)}
              onChange={formik.handleChange("match_date")}
              onBlur={formik.handleBlur("match_date")}
              type="date"
              name="match_date"
            ></input>
            <div className="error-message">
              {formik.touched.match_date && formik.errors.match_date}
            </div>
          </div>
          <div className="ctr-field">
            <label>Goles Chachos</label>
            <input
              value={formik.values.score_chachos}
              onChange={formik.handleChange("score_chachos")}
              onBlur={formik.handleBlur("score_chachos")}
              type="number"
              min="0"
              name="score_chachos"
            ></input>
            <div className="error-message">
              {formik.touched.score_chachos && formik.errors.score_chachos}
            </div>
          </div>
          <div className="ctr-field">
            <label>Goles rival</label>
            <input
              value={formik.values.score_rival}
              onChange={formik.handleChange("score_rival")}
              onBlur={formik.handleBlur("score_rival")}
              type="number"
              min="0"
              name="score_rival"
            ></input>
            <div className="error-message">
              {formik.touched.score_rival && formik.errors.score_rival}
            </div>
          </div>
        </div>

        <PlayersToggleList
          selectedPlayers={selectedPlayers}
          setSelectedPlayers={setSelectedPlayers}
        />
        <div className="error-message">
          {formik.touched.players && formik.errors.players}
        </div>

        <button className="ctr-submit-btn" type="submit">
          Editar fecha
        </button>
      </form>
    </div>
  );
};

export default TournamentRoundsUpdate;
