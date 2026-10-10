import React from "react";
import { Route, Routes } from "react-router-dom";

import ChachosInicio from "./ChachosInicio/ChachosInicio";
import ChachosEstadisticas from "./ChachosEstadisticas/ChachosEstadisticas";
import ChachosTournamentRounds from "./ChachosTournamentRounds/ChachosTournamentRounds";
import VotesResults from "./ChachosTournamentRounds/VotesResults/VotesResults";
import ChachosSquad from "./ChachosSquad/ChachosSquad";
import ChachosSquadPlayerDetails from "./ChachosSquad/Details/ChachosSquadPlayerDetails";
import AnnouncementModal from "../Layout/AnnouncementModal/AnnouncementModal";

const ChachosRoutes = () => {
  return (
    <>
      <AnnouncementModal
        startDate="2026-10-10"
        endDate="2026-10-31"
        title="Cambiaron los resultados de las votaciones"
      >
        <p>
          Ahora vas a ver el top 5 de puntajes y las perlas blanca y vainilla
          de cada fecha, únicamente.
        </p>
        <p>
          Si jugaste ese partido, podés ver tu resultado completo de forma
          privada tocando "Ver mi resultado".
        </p>
      </AnnouncementModal>

      <Routes>
        <Route>
          <Route index Component={ChachosInicio} />
          <Route path="/historical-stats" Component={ChachosEstadisticas} />

          <Route path="/tournament-rounds/*">
            <Route index Component={ChachosTournamentRounds} />
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
