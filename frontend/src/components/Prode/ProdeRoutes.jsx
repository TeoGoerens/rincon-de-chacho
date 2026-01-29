import React from "react";
import { Route, Routes } from "react-router-dom";

import ProdeHome from "./pages/ProdeHome";
import ProdeReglas from "./pages/ProdeReglas";
import ProdeRecords from "./pages/ProdeRecords";
import ProdeH2H from "./pages/ProdeH2H";

const ProdeRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" Component={ProdeHome} />
        <Route path="/records" Component={ProdeRecords} />
        <Route path="/h2h" Component={ProdeH2H} />
        <Route path="/reglas" Component={ProdeReglas} />
      </Routes>
    </>
  );
};

export default ProdeRoutes;
