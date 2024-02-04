//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./TournamentDropdownStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTournamentsAction } from "../../../../redux/slices/tournaments/tournamentsSlices";

const TournamentDropdown = ({ field, form }) => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const tournaments = storeData.tournaments?.tournaments;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentsAction());
  }, [dispatch]);
  return (
    <>
      <label>Torneo</label>
      <select
        value={field.value}
        onChange={(e) => form.setFieldValue("tournament", e.target.value)}
        onBlur={field.onBlur}
        name="tournament"
      >
        <option value="" label="Selecciona un torneo" />
        {tournaments &&
          tournaments.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
      </select>
      <div>{form.touched["tournament"] && form.errors["tournament"]}</div>
    </>
  );
};

export default TournamentDropdown;
