//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./RivalDropdownStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTeamsAction } from "../../../../redux/slices/teams/teamsSlices";

const RivalDropdown = ({ field, form }) => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.teams);
  const teams = storeData.teams?.rivalTeams;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTeamsAction());
  }, [dispatch]);
  return (
    <>
      <label>Rival</label>
      <select
        value={field.value}
        onChange={(e) => form.setFieldValue("rival", e.target.value)}
        onBlur={field.onBlur}
        name="rival"
      >
        <option value="" label="Selecciona un rival" />
        {teams &&
          teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
      </select>
      <div>{form.touched["team"] && form.errors["team"]}</div>
    </>
  );
};

export default RivalDropdown;
