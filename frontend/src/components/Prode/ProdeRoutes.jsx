import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import ProdeLanding from "./ProdeLanding";
import ProdeMatchdayPredictions from "./ProdeMatchdayPredictions";

const ProdeRoutes = () => (
  <Routes>
    <Route path="/" element={<ProdeLanding />} />
    <Route path="/fecha/:id" element={<ProdeMatchdayPredictions />} />
    <Route path="*" element={<Navigate to="/prode" replace />} />
  </Routes>
);

export default ProdeRoutes;
