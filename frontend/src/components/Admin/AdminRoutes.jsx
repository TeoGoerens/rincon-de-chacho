import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import FootballCategoriesIndex from "../Chachos/FootballCategories/FootballCategoriesIndex";
import FootballCategoriesCreate from "../Chachos/FootballCategories/FootballCategoriesCreate";
import FootballCategoriesUpdate from "../Chachos/FootballCategories/FootballCategoriesUpdate";
import PlayersIndex from "../Chachos/Players/PlayersIndex";
import PlayersCreate from "../Chachos/Players/PlayersCreate";
import PlayersUpdate from "../Chachos/Players/PlayersUpdate";
import TeamsIndex from "../Chachos/Teams/TeamsIndex";
import TeamsCreate from "../Chachos/Teams/TeamsCreate";
import TeamsUpdate from "../Chachos/Teams/TeamsUpdate";
import TournamentsIndex from "../Chachos/Tournaments/TournamentsIndex";
import TournamentsCreate from "../Chachos/Tournaments/TournamentsCreate";
import TournamentsUpdate from "../Chachos/Tournaments/TournamentsUpdate";
import TournamentRoundsIndex from "../Chachos/TournamentRounds/TournamentRoundsIndex";
import TournamentRoundsCreate from "../Chachos/TournamentRounds/TournamentRoundsCreate";
import TournamentRoundsDetail from "../Chachos/TournamentRounds/TournamentRoundsDetail";
import TournamentRoundsUpdate from "../Chachos/TournamentRounds/TournamentRoundsUpdate";

const AdminRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="users" element={<h1>Admin Users WIP</h1>} />
        <Route path="prode" element={<h1>Admin Prode WIP</h1>} />
        <Route path="cronicas" element={<h1>Admin Cronicas WIP</h1>} />

        <Route path="chachos/*">
          <Route index Component={AdminPanel} />
          {/* Players routes */}
          <Route path="players" Component={PlayersIndex} />
          <Route path="players/create" Component={PlayersCreate} />
          <Route path="players/update/:id" Component={PlayersUpdate} />
          {/* Teams routes */}
          <Route path="teams" Component={TeamsIndex} />
          <Route path="teams/create" Component={TeamsCreate} />
          <Route path="teams/update/:id" Component={TeamsUpdate} />
          {/* Football Categories routes */}
          <Route
            path="football-categories"
            Component={FootballCategoriesIndex}
          />
          <Route
            path="football-categories/create"
            Component={FootballCategoriesCreate}
          />
          <Route
            path="football-categories/update/:id"
            Component={FootballCategoriesUpdate}
          />
          {/* Tournaments routes */}
          <Route path="tournaments" Component={TournamentsIndex} />
          <Route path="tournaments/create" Component={TournamentsCreate} />
          <Route path="tournaments/update/:id" Component={TournamentsUpdate} />
          {/* Tournament Rounds routes */}
          <Route path="tournament-rounds" Component={TournamentRoundsIndex} />
          <Route
            path="tournament-rounds/create"
            Component={TournamentRoundsCreate}
          />
          <Route
            path="tournament-rounds/view/:id"
            Component={TournamentRoundsDetail}
          />{" "}
          <Route
            path="tournament-rounds/update/:id"
            Component={TournamentRoundsUpdate}
          />
          <Route
            path="statistics"
            element={<h1>Admin Chachos Estadisticas</h1>}
          />
        </Route>
      </Routes>
    </>
  );
};

export default AdminRoutes;
