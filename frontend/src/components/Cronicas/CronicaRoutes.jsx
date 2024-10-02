import React from "react";
import { Route, Routes } from "react-router-dom";

import CronicaHome from "./CronicaHome/CronicaHome";
import CronicaDetail from "./CronicaDetail/CronicaDetail";

const CronicaRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" Component={CronicaHome} />
        <Route path="/:id" Component={CronicaDetail} />
      </Routes>
    </>
  );
};

export default CronicaRoutes;
