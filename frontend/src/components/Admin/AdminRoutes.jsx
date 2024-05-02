import React from "react";
import { Route, Routes } from "react-router-dom";

import AdminHomePanel from "./AdminHome/AdminHomePanel";
import AdminChachosPanel from "./AdminChachos/AdminChachosPanel";
import FootballCategoriesIndex from "./AdminChachos/FootballCategories/FootballCategoriesIndex";
import FootballCategoriesCreate from "./AdminChachos/FootballCategories/FootballCategoriesCreate";
import FootballCategoriesUpdate from "./AdminChachos/FootballCategories/FootballCategoriesUpdate";
import PlayersIndex from "./AdminChachos/Players/PlayersIndex";
import PlayersCreate from "./AdminChachos/Players/PlayersCreate/PlayersCreate";
import PlayersUpdate from "./AdminChachos/Players/PlayersUpdate/PlayersUpdate";
import TeamsIndex from "./AdminChachos/Teams/TeamsIndex";
import TeamsCreate from "./AdminChachos/Teams/TeamsCreate";
import TeamsUpdate from "./AdminChachos/Teams/TeamsUpdate";
import TournamentsIndex from "./AdminChachos/Tournaments/TournamentsIndex";
import TournamentsCreate from "./AdminChachos/Tournaments/TournamentsCreate";
import TournamentsUpdate from "./AdminChachos/Tournaments/TournamentsUpdate";
import TournamentRoundsIndex from "./AdminChachos/TournamentRounds/TournamentRoundsIndex";
import TournamentRoundsCreate from "./AdminChachos/TournamentRounds/TournamentRoundsCreate";
import TournamentRoundsDetail from "./AdminChachos/TournamentRounds/TournamentRoundsDetail";
import TournamentRoundsUpdate from "./AdminChachos/TournamentRounds/TournamentRoundsUpdate";
import InterviewsIndex from "./AdminChachos/Interviews/InterviewsIndex";
import InterviewsCreate from "./AdminChachos/Interviews/InterviewsCreate/InterviewsCreate";
import InterviewsUpdate from "./AdminChachos/Interviews/InterviewsUpdate/InterviewsUpdate";

const AdminRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" Component={AdminHomePanel} />
        <Route path="users" element={<h1>Admin Users WIP</h1>} />
        <Route path="prode" element={<h1>Admin Prode WIP</h1>} />
        <Route path="cronicas" element={<h1>Admin Cronicas WIP</h1>} />

        <Route path="chachos/*">
          <Route index Component={AdminChachosPanel} />
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
          {/* Interviews routes */}
          <Route path="interviews" Component={InterviewsIndex} />
          <Route path="interviews/create" Component={InterviewsCreate} />
          <Route path="interviews/update/:id" Component={InterviewsUpdate} />
        </Route>
      </Routes>
    </>
  );
};

export default AdminRoutes;
