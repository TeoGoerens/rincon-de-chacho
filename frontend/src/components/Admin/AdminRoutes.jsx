import React from "react";
import { Route, Routes } from "react-router-dom";

//Admin USERS Components
import AdminUsersPanel from "./AdminUsers/AdminUsersPanel";

//Admin PRODE Components
import AdminProdePanel from "./AdminProde/AdminProdePanel";

//Admin PODRIDA Components
import AdminPodridaPanel from "./AdminPodrida/AdminPodridaPanel";
import PodridaIndex from "./AdminPodrida/Podridas/PodridaIndex";
import CreatePodrida from "./AdminPodrida/Podridas/CreatePodrida";

//Admin CRONICAS Components
import AdminCronicasPanel from "./AdminCronicas/AdminCronicasPanel";
import CronicaIndex from "./AdminCronicas/Cronicas/CronicaIndex";

//Admin CHACHOS Components
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
import TournamentRoundsCreate from "./AdminChachos/TournamentRounds/TournamentRoundsCreate/TournamentRoundsCreate";
import TournamentRoundsDetail from "./AdminChachos/TournamentRounds/TournamentRoundsDetail/TournamentRoundsDetail";
import TournamentRoundsUpdate from "./AdminChachos/TournamentRounds/TournamentRoundsUpdate/TournamentRoundsUpdate";
import MatchStatsIndex from "./AdminChachos/MatchStats/MatchStatsIndex";
import MatchStatsCreate from "./AdminChachos/MatchStats/MatchStatsCreate/MatchStatsCreate";
import MatchStatsUpdate from "./AdminChachos/MatchStats/MatchStatsUpdate/MatchStatsUpdate";
import CreateCronica from "./AdminCronicas/Cronicas/CreateCronica";
import UpdateCronica from "./AdminCronicas/Cronicas/UpdateCronica";

const AdminRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="users" element={<AdminUsersPanel />} />

        {/* --------------- ADMIN PRODE --------------- */}

        <Route path="prode" element={<AdminProdePanel />} />
        {/* --------------- ADMIN PODRIDA --------------- */}

        <Route path="podrida/*" element={<AdminPodridaPanel />}>
          {/* Rutas de partidas */}
          <Route index element={<PodridaIndex />} />
          <Route path="crear" element={<CreatePodrida />} />
          <Route
            path="editar/:id"
            element={<h2>Aca estaria el dashboard de premios</h2>}
          />

          {/* Rutas de jugadores */}
          <Route
            path="jugadores"
            element={<h2>Aca estaria el dashboard de premios</h2>}
          />
          <Route
            path="jugadores/crear"
            element={<h2>Aca estaria el dashboard de premios</h2>}
          />
          <Route
            path="jugadores/editar/:id"
            element={<h2>Aca estaria el dashboard de premios</h2>}
          />
        </Route>

        {/* --------------- ADMIN CRONICAS --------------- */}

        <Route path="cronicas/crear" element={<CreateCronica />} />
        <Route path="cronicas/editar/:id" element={<UpdateCronica />} />

        <Route path="cronicas/*" element={<AdminCronicasPanel />}>
          {/* Ruta por defecto de cronicas */}
          <Route index element={<CronicaIndex />} />

          {/* Cronicas routes */}
          <Route
            path="premios"
            element={<h2>Aca estaria el dashboard de premios</h2>}
          />
          {/* Cronicas routes */}
          <Route
            path="solicitada"
            element={<h2>Aca estaria el dashboard de solicitada</h2>}
          />
          {/* Cronicas routes */}
          <Route
            path="pizarra"
            element={<h2>Aca estaria el dashboard de pizarra</h2>}
          />
        </Route>
        {/* --------------- ADMIN CHACHOS --------------- */}
        <Route path="chachos/*">
          <Route index element={<AdminChachosPanel />} />
          {/* Players routes */}
          <Route path="players" element={<PlayersIndex />} />
          <Route path="players/create" element={<PlayersCreate />} />
          <Route path="players/update/:id" element={<PlayersUpdate />} />
          {/* Teams routes */}
          <Route path="teams" element={<TeamsIndex />} />
          <Route path="teams/create" element={<TeamsCreate />} />
          <Route path="teams/update/:id" element={<TeamsUpdate />} />
          {/* Football Categories routes */}
          <Route
            path="football-categories"
            element={<FootballCategoriesIndex />}
          />
          <Route
            path="football-categories/create"
            element={<FootballCategoriesCreate />}
          />
          <Route
            path="football-categories/update/:id"
            element={<FootballCategoriesUpdate />}
          />
          {/* Tournaments routes */}
          <Route path="tournaments" element={<TournamentsIndex />} />
          <Route path="tournaments/create" element={<TournamentsCreate />} />
          <Route
            path="tournaments/update/:id"
            element={<TournamentsUpdate />}
          />
          {/* Tournament Rounds routes */}
          <Route path="tournament-rounds" element={<TournamentRoundsIndex />} />
          <Route
            path="tournament-rounds/create"
            element={<TournamentRoundsCreate />}
          />
          <Route
            path="tournament-rounds/view/:id"
            element={<TournamentRoundsDetail />}
          />{" "}
          <Route
            path="tournament-rounds/update/:id"
            element={<TournamentRoundsUpdate />}
          />
          {/* Interviews routes */}
          <Route path="match-stats" element={<MatchStatsIndex />} />
          <Route path="match-stats/create/:id" element={<MatchStatsCreate />} />
          <Route path="match-stats/update/:id" element={<MatchStatsUpdate />} />
        </Route>
      </Routes>
    </>
  );
};

export default AdminRoutes;
