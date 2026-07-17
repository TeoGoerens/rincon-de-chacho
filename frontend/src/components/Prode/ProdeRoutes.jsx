import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import ProdeInicio from "./ProdeInicio";
import ProdeTorneo from "./ProdeTorneo";
import ProdeRecords from "./ProdeRecords";
import ProdeH2H from "./ProdeH2H";
import ProdeReglas from "./ProdeReglas";
import ProdeMatchdayPredictions from "./ProdeMatchdayPredictions";
import ProdeGdtDraft from "./ProdeGdtDraft";

const ProdeRoutes = () => (
  <Routes>
    <Route path="/" element={<ProdeInicio />} />
    <Route path="/torneo" element={<ProdeTorneo />} />
    <Route path="/records" element={<ProdeRecords />} />
    <Route path="/h2h" element={<ProdeH2H />} />
    <Route path="/reglas" element={<ProdeReglas />} />
    <Route path="/fecha/:id" element={<ProdeMatchdayPredictions />} />
    <Route path="/gdt/:universeId" element={<ProdeGdtDraft />} />
    <Route path="*" element={<Navigate to="/prode" replace />} />
  </Routes>
);

export default ProdeRoutes;
