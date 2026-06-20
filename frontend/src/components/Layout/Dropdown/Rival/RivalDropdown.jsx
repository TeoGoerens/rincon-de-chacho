//Import React & Hooks
import React from "react";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./RivalDropdownStyle.css";

//Import React Query functions
import fetchAllTeams from "../../../../reactquery/chachos/fetchAllTeams";

const RivalDropdown = ({ field, form }) => {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchAllTeams,
  });

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
