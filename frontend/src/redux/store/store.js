import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "../slices/users/usersSlices";
import footballCategoriesSlices from "../slices/football-categories/footballCategoriesSlices";
import playersSlices from "../slices/players/playersSlices";
import teamsSlices from "../slices/teams/teamsSlices";
import tournamentsSlices from "../slices/tournaments/tournamentsSlices";
import tournamentRoundsSlices from "../slices/tournament-rounds/tournamentRoundsSlices";
import votesSlices from "../slices/votes/votesSlices";

const store = configureStore({
  reducer: {
    users: usersReducer,
    categories: footballCategoriesSlices,
    players: playersSlices,
    teams: teamsSlices,
    tournaments: tournamentsSlices,
    tournamentRounds: tournamentRoundsSlices,
    votes: votesSlices,
  },
});

export default store;
