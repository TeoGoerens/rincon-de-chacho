import React from "react";
import { Outlet } from "react-router-dom";
import AdminMenu from "../AdminMenu";

const AdminProdePanel = () => {
  return (
    <>
      <AdminMenu />
      <div>
        <Outlet />
      </div>
    </>
  );
};

export default AdminProdePanel;
