import React from "react";
import { Link } from "react-router-dom";

const AdminMenu = () => {
  return (
    <>
      <Link to="/admin/users">Usuarios</Link>
      <Link to="/admin/prode">Prode</Link>
      <Link to="/admin/cronicas">Cronicas</Link>
      <Link to="/admin/chachos">Chachos</Link>
    </>
  );
};

export default AdminMenu;
