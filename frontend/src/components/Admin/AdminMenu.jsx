import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

const ADMIN_TABS = [
  { label: "Usuarios",  to: "/admin/users"    },
  { label: "Podrida",   to: "/admin/podrida"  },
  { label: "Prode",     to: "/admin/prode"    },
  { label: "Crónicas",  to: "/admin/cronicas" },
  { label: "Chachos",   to: "/admin/chachos"  },
];

const AdminMenu = () => (
  <SectionNav tabs={ADMIN_TABS} accentColor="var(--third-color)" />
);

export default AdminMenu;
