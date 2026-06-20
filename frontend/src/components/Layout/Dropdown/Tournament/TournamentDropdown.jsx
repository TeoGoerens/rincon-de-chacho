//Import React & Hooks
import React from "react";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./TournamentDropdownStyle.css";

//Import React Query functions
import fetchAllTournaments from "../../../../reactquery/chachos/fetchAllTournaments";

const TournamentDropdown = ({ field, form }) => {
  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: fetchAllTournaments,
  });

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
      <div className="error-message">
        {form.touched["tournament"] && form.errors["tournament"]}
      </div>
    </>
  );
};

export default TournamentDropdown;
