import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

//Admin USERS Components
import AdminUsersPanel from "./AdminUsers/AdminUsersPanel";

//Admin PRODE Components
import AdminProdePanel from "./AdminProde/AdminProdePanel";
import ProdeTournamentsIndex from "./AdminProde/Tournaments/ProdeTournamentsIndex";
import CreateProdeTournament from "./AdminProde/Tournaments/CreateProdeTournament";
import UpdateProdeTournament from "./AdminProde/Tournaments/UpdateProdeTournament";
import ProdePlayersIndex from "./AdminProde/Players/ProdePlayersIndex";
import CreateProdePlayer from "./AdminProde/Players/CreateProdePlayer";
import UpdateProdePlayer from "./AdminProde/Players/UpdateProdePlayer";
import ProdeMatchdaysIndex from "./AdminProde/Matchdays/ProdeMatchdaysIndex";
import CreateProdeMatchday from "./AdminProde/Matchdays/CreateProdeMatchday";
import UpdateProdeMatchday from "./AdminProde/Matchdays/UpdateProdeMatchday";

//Admin PODRIDA Components
import AdminPodridaPanel from "./AdminPodrida/AdminPodridaPanel";
import PodridaIndex from "./AdminPodrida/Podridas/PodridaIndex";
import CreatePodrida from "./AdminPodrida/Podridas/CreatePodrida";
import UpdatePodrida from "./AdminPodrida/Podridas/UpdatePodrida";
import PodridaDetail from "./AdminPodrida/Podridas/PodridaDetail";
import PodridaPlayerIndex from "./AdminPodrida/Podridas/PodridaPlayerIndex";
import CreatePodridaPlayer from "./AdminPodrida/Podridas/CreatePodridaPlayer";
import UpdatePodridaPlayer from "./AdminPodrida/Podridas/UpdatePodridaPlayer";
import PodridaPlayerDetail from "./AdminPodrida/Podridas/PodridaPlayerDetail";

//Admin CRONICAS Components
import AdminCronicasPanel from "./AdminCronicas/AdminCronicasPanel";
import CronicaIndex from "./AdminCronicas/Cronicas/CronicaIndex";

//Admin CHACHOS Components
import AdminChachosPanel from "./AdminChachos/AdminChachosPanel";
import FootballCategoriesIndex from "./AdminChachos/FootballCategories/FootballCategoriesIndex";
import FootballCategoriesCreate from "./AdminChachos/FootballCategories/FootballCategoriesCreate";
import FootballCategoriesUpdate from "./AdminChachos/FootballCategories/FootballCategoriesUpdate";
import FootballCategoriesDetail from "./AdminChachos/FootballCategories/FootballCategoriesDetail";
import PlayersIndex from "./AdminChachos/Players/PlayersIndex";
import PlayersCreate from "./AdminChachos/Players/PlayersCreate/PlayersCreate";
import PlayersUpdate from "./AdminChachos/Players/PlayersUpdate/PlayersUpdate";
import PlayersDetail from "./AdminChachos/Players/PlayersDetail/PlayersDetail";
import TeamsIndex from "./AdminChachos/Teams/TeamsIndex";
import TeamsCreate from "./AdminChachos/Teams/TeamsCreate";
import TeamsUpdate from "./AdminChachos/Teams/TeamsUpdate";
import TeamsDetail from "./AdminChachos/Teams/TeamsDetail";
import TournamentsIndex from "./AdminChachos/Tournaments/TournamentsIndex";
import TournamentsCreate from "./AdminChachos/Tournaments/TournamentsCreate";
import TournamentsUpdate from "./AdminChachos/Tournaments/TournamentsUpdate";
import TournamentsDetail from "./AdminChachos/Tournaments/TournamentsDetail";
import TournamentRoundsIndex from "./AdminChachos/TournamentRounds/TournamentRoundsIndex";
import TournamentRoundsCreate from "./AdminChachos/TournamentRounds/TournamentRoundsCreate/TournamentRoundsCreate";
import TournamentRoundsDetail from "./AdminChachos/TournamentRounds/TournamentRoundsDetail/TournamentRoundsDetail";
import TournamentRoundsUpdate from "./AdminChachos/TournamentRounds/TournamentRoundsUpdate/TournamentRoundsUpdate";
import MatchStatsIndex from "./AdminChachos/MatchStats/MatchStatsIndex";
import MatchStatsCreate from "./AdminChachos/MatchStats/MatchStatsCreate/MatchStatsCreate";
import MatchStatsUpdate from "./AdminChachos/MatchStats/MatchStatsUpdate/MatchStatsUpdate";
import MatchStatsDetail from "./AdminChachos/MatchStats/MatchStatsDetail/MatchStatsDetail";
import CreateCronica from "./AdminCronicas/Cronicas/CreateCronica";
import UpdateCronica from "./AdminCronicas/Cronicas/UpdateCronica";

const AdminRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="users" element={<AdminUsersPanel />} />

        {/* --------------- ADMIN PRODE --------------- */}
        <Route path="prode/*" element={<AdminProdePanel />}>
          <Route index element={<ProdeTournamentsIndex />} />
          <Route path="torneos/crear" element={<CreateProdeTournament />} />
          <Route
            path="torneos/editar/:id"
            element={<UpdateProdeTournament />}
          />

          <Route path="jugadores" element={<ProdePlayersIndex />} />
          <Route path="jugadores/crear" element={<CreateProdePlayer />} />
          <Route
            path="jugadores/editar/:id"
            element={<UpdateProdePlayer />}
          />

          <Route path="fechas" element={<ProdeMatchdaysIndex />} />
          <Route path="fechas/crear" element={<CreateProdeMatchday />} />
          <Route
            path="fechas/editar/:id"
            element={<UpdateProdeMatchday />}
          />
        </Route>
        {/* --------------- ADMIN PODRIDA --------------- */}

        <Route path="podrida/*" element={<AdminPodridaPanel />}>
          {/* Rutas de partidas */}
          <Route index element={<PodridaIndex />} />
          <Route path="crear" element={<CreatePodrida />} />
          <Route path="editar/:id" element={<UpdatePodrida />} />
          <Route path="ver/:id" element={<PodridaDetail />} />

          {/* Rutas de jugadores */}
          <Route path="jugadores" element={<PodridaPlayerIndex />} />
          <Route path="jugadores/crear" element={<CreatePodridaPlayer />} />
          <Route
            path="jugadores/editar/:id"
            element={<UpdatePodridaPlayer />}
          />
          <Route path="jugadores/ver/:id" element={<PodridaPlayerDetail />} />
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
        <Route path="chachos/*" element={<AdminChachosPanel />}>
          <Route
            index
            element={<Navigate to="tournament-rounds" replace />}
          />
          {/* Players routes */}
          <Route path="players" element={<PlayersIndex />} />
          <Route path="players/create" element={<PlayersCreate />} />
          <Route path="players/update/:id" element={<PlayersUpdate />} />
          <Route path="players/view/:id" element={<PlayersDetail />} />
          {/* Teams routes */}
          <Route path="teams" element={<TeamsIndex />} />
          <Route path="teams/create" element={<TeamsCreate />} />
          <Route path="teams/update/:id" element={<TeamsUpdate />} />
          <Route path="teams/view/:id" element={<TeamsDetail />} />
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
          <Route
            path="football-categories/view/:id"
            element={<FootballCategoriesDetail />}
          />
          {/* Tournaments routes */}
          <Route path="tournaments" element={<TournamentsIndex />} />
          <Route path="tournaments/create" element={<TournamentsCreate />} />
          <Route
            path="tournaments/update/:id"
            element={<TournamentsUpdate />}
          />
          <Route path="tournaments/view/:id" element={<TournamentsDetail />} />
          {/* Tournament Rounds routes */}
          <Route path="tournament-rounds" element={<TournamentRoundsIndex />} />
          <Route
            path="tournament-rounds/create"
            element={<TournamentRoundsCreate />}
          />
          <Route
            path="tournament-rounds/view/:id"
            element={<TournamentRoundsDetail />}
          />
          <Route
            path="tournament-rounds/update/:id"
            element={<TournamentRoundsUpdate />}
          />
          {/* Match stats routes */}
          <Route path="match-stats" element={<MatchStatsIndex />} />
          <Route path="match-stats/create/:id" element={<MatchStatsCreate />} />
          <Route path="match-stats/update/:id" element={<MatchStatsUpdate />} />
          <Route path="match-stats/view/:id" element={<MatchStatsDetail />} />
        </Route>
      </Routes>
    </>
  );
};

export default AdminRoutes;
