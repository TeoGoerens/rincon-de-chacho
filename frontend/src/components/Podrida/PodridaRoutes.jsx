import React from "react";
import { Route, Routes } from "react-router-dom";

import PodridaHomePanel from "./PodridaHome/PodridaHomePanel";
import PodridaEstadisticas from "./PodridaEstadisticas/PodridaEstadisticas";
import PodridaJugadores from "./PodridaJugadores/PodridaJugadores";

const PodridaRoutes = () => (
  <Routes>
    <Route path="/"              element={<PodridaHomePanel />} />
    <Route path="/estadisticas"  element={<PodridaEstadisticas />} />
    <Route path="/jugadores"     element={<PodridaJugadores />} />
  </Routes>
);

export default PodridaRoutes;
