//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./CronicaDetailStyles.css";

//Import helpers

//Import components

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaDetail = () => {
  const { id } = useParams();
  return <div>CronicaDetail {id}</div>;
};

export default CronicaDetail;
