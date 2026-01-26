import React from "react";
import { Route, Routes } from "react-router-dom";

import ProdeHome from "./pages/ProdeHome";
import ProdePlayer from "./pages/ProdePlayer";
import ProdeRecords from "./pages/ProdeRecords";
import ProdeH2H from "./pages/ProdeH2H";

const ProdeRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" Component={ProdeHome} />
        <Route path="/records" Component={ProdeRecords} />
        <Route path="/h2h" Component={ProdeH2H} />
        <Route path="/jugador/:playerId" Component={ProdePlayer} />
      </Routes>
    </>
  );
};

export default ProdeRoutes;
