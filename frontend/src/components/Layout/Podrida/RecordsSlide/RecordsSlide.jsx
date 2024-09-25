//Import React & Hooks
import { useState } from "react";
import { Link } from "react-router-dom";

//Import helpers

//Import assets - CARDS
import cardTrophy from "../../../../assets/images/podrida/cards/gold-trophy.png";
import silverMedal from "../../../../assets/images/podrida/cards/silver-medal.png";
import diplomaPodium from "../../../../assets/images/podrida/cards/diploma.png";

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
        <div className="face back">
          <div className="back-title">
            <div className="back-title-main">
              <img src={character} alt="Trofeo" />
              <p>Ranking top 3</p>
              <img src={character} alt="Trofeo" />
            </div>
            <span>{category}</span>
          </div>
          <div className="back-container">
            <div className="back-container-player">
              <div className="back-container-player-image">
                <img src={cardTrophy} alt="Trofeo" />
              </div>
              <div className="back-container-player-content">
                <h4>Juan Martin BdQ</h4>
                <h6>1st place</h6>
                <span>10</span>
              </div>
            </div>
            <div className="back-container-player">
              <div className="back-container-player-image">
                <img src={silverMedal} alt="Medalla" />
              </div>
              <div className="back-container-player-content">
                <h4>Teo Goerens</h4>
                <h6>2nd place</h6>
                <span>9</span>
              </div>
            </div>
            <div className="back-container-player">
              <div className="back-container-player-image">
                <img src={diplomaPodium} alt="Diploma" />
              </div>
              <div className="back-container-player-content">
                <h4>Juan Martin Escrina</h4>
                <h6>3rd place</h6>
                <span>6</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecordsSlide;
