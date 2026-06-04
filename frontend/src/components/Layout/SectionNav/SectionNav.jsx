import React from "react";
import { NavLink } from "react-router-dom";
import "./SectionNavStyles.css";

const SectionNav = ({ tabs, accentColor }) => {
  return (
    <div
      className="snav-outer"
      style={accentColor ? { "--snav-accent": accentColor } : undefined}
    >
      <nav className="snav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.exact}
            className={({ isActive }) =>
              `snav-tab${isActive ? " snav-tab--active" : ""}`
            }
          >
            {tab.icon && tab.icon}
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default SectionNav;
