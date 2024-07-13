import React from "react";
import { Route, Routes } from "react-router-dom";

import PodridaHomePanel from "../Podrida/PodridaHome/PodridaHomePanel";
import PodridaGames from "./PodridaGames/PodridaGames";

const PodridaRoutes = () => {
  return (
    <>
      <Routes>
        <Route>
          <Route path="/" Component={PodridaHomePanel} />

          <Route path="/games/*">
            <Route index Component={PodridaGames} />
            <Route path=":id/details" Component={PodridaGames} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default PodridaRoutes;
