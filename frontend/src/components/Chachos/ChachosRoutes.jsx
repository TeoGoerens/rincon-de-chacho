import React from "react";
import { Route, Routes } from "react-router-dom";

import ChachosInicio from "./ChachosInicio/ChachosInicio";
import ChachosEstadisticas from "./ChachosEstadisticas/ChachosEstadisticas";
import ChachosTournamentRounds from "./ChachosTournamentRounds/ChachosTournamentRounds";
import PlayersVotes from "./ChachosTournamentRounds/Votes/PlayersVotes";
import VotesResults from "./ChachosTournamentRounds/VotesResults/VotesResults";
import ChachosSquad from "./ChachosSquad/ChachosSquad";
import ChachosSquadPlayerDetails from "./ChachosSquad/Details/ChachosSquadPlayerDetails";

const ChachosRoutes = () => {
  return (
    <>
      <Routes>
        <Route>
          <Route index Component={ChachosInicio} />
          <Route path="/historical-stats" Component={ChachosEstadisticas} />

          <Route path="/tournament-rounds/*">
            <Route index Component={ChachosTournamentRounds} />
            <Route path=":id/vote" Component={PlayersVotes} />

            <Route path=":id/results" Component={VotesResults} />
          </Route>

          <Route path="/squad/*">
            <Route index Component={ChachosSquad} />
            <Route path=":id" Component={ChachosSquadPlayerDetails} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default ChachosRoutes;
