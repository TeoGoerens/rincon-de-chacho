//Import React & Hooks
import { useState } from "react";
import { Link } from "react-router-dom";

//Import helpers

//Import components

//Import CSS & styles
import "./RecordsSlideStyle.css";

//Import Redux
import { useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

const RecordsSlide = ({ customClass, category, medal, character }) => {
  return (
    <>
      <div className="card-container">
        <div className={`face front front-${customClass}`}>
          <div className={`front-ribbon front-ribbon-${customClass}`}>
            <p>Girar</p>
          </div>
          <div className="front-img-container">
            <img src={character} alt="Card Image" />
            <div
              className={`front-img-container-background front-img-container-background-${customClass}`}
            ></div>
          </div>
          <div
            className={`front-data-container front-data-container-${customClass}`}
          >
            <img src={medal} alt="Medal Image" />
            <h4>{category}</h4>
            <h3>juan martin escriña</h3>
          </div>
        </div>
        <div className="face back">Hola</div>
      </div>
    </>
  );
};

export default RecordsSlide;
