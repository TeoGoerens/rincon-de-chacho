import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import ProdeLanding from "./ProdeLanding";
import ProdeTorneo from "./ProdeTorneo";
import ProdeMatchdayPredictions from "./ProdeMatchdayPredictions";
import ProdeGdtDraft from "./ProdeGdtDraft";

const ProdeRoutes = () => (
  <Routes>
    <Route path="/" element={<ProdeLanding />} />
    <Route path="/torneo" element={<ProdeTorneo />} />
    <Route path="/fecha/:id" element={<ProdeMatchdayPredictions />} />
    <Route path="/gdt/:universeId" element={<ProdeGdtDraft />} />
    <Route path="*" element={<Navigate to="/prode" replace />} />
  </Routes>
);

export default ProdeRoutes;
