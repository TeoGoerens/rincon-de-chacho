import React from "react";
import { Route, Routes } from "react-router-dom";

import CronicaHome from "./CronicaHome/CronicaHome";
import CronicaDetail from "./CronicaDetail/CronicaDetail";
import CurrentlyWorking from "../Layout/SoonTag/CurrentlyWorking";

const CronicaRoutes = () => {
  return (
    <>
      <Routes>
        {/* Ruta principal para CronicaHome */}
        <Route path="/" element={<CronicaHome />} />

        {/* Nuevas rutas específicas */}
        <Route path="premios" element={<CurrentlyWorking />} />
        <Route path="solicitada" element={<CurrentlyWorking />} />
        <Route path="pizarra" element={<CurrentlyWorking />} />

        {/* Ruta dinámica para CronicaDetail */}
        <Route path=":id" element={<CronicaDetail />} />
      </Routes>
    </>
  );
};

export default CronicaRoutes;
