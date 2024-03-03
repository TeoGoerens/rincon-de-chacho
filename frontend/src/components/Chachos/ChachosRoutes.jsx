import React from "react";
import { Route, Routes } from "react-router-dom";

import ChachosHomePanel from "./ChachosHome/ChachosHomePanel";
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
          <Route path="/" Component={ChachosHomePanel} />

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
