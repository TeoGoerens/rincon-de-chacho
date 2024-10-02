//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./CronicaHomeStyles.css";

//Import helpers

//Import components
import photoLake from "../../../assets/photos/cronicas/bosque.jpg";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaHome = () => {
  return (
    <div className="container">
      <section className="cronica-title">
        <h1>
          Las Crónicas de <span>Chacho</span>
        </h1>
        <h3>Un recorrido único a través de los años</h3>
        <div className="cronica-title-border"></div>
      </section>
      <section className="cronica-newest">
        <article>
          <div className="cronica-image">
            <span>
              <i class="fa-solid fa-arrow-trend-up"></i> Destacado
            </span>
            <img src={photoLake} alt="Foto crónica" />
          </div>
          <div className="cronica-details">
            <div className="cronica-details-title">
              <h3>Título de la crónica Lorem ipsum</h3>
              <span className="cronica-year">2023</span>
            </div>

            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit,
              ratione. Necessitatibus corporis sit vel neque eligendi qui
              doloribus asperiores fuga?
            </p>
            <div className="cronica-icons">
              <div className="cronica-icons-content">
                <i class="fa-regular fa-calendar-days"></i>
                <p>20/10/2024</p>
              </div>
              <div className="cronica-icons-content">
                <i class="fa-solid fa-eye"></i>
                <p>126</p>
              </div>
              <div className="cronica-icons-content">
                <i class="fa-solid fa-heart"></i>
                <p>23</p>
              </div>
              <div className="cronica-icons-content">
                <i class="fa-regular fa-comment"></i>
                <p>65</p>
              </div>
            </div>
            <Link to="/photo-gallery" className="cronica-read-btn">
              Leer más
            </Link>
          </div>
        </article>
      </section>
      <section className="cronica-interactive">
        <h2>No dejes de ser parte</h2>
        <div className="cronica-interactive-content">
          <div className="cronica-interactive-content-card">
            <i class="fa-regular fa-comment"></i>
            <h3>Ranking de aportes</h3>
            <p>Ver como estas de acuerdo a tu participación y contribuciones</p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Ver
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <i class="fa-regular fa-comment"></i>
            <h3>Tu contribución suma</h3>
            <p>
              Compartí anécdotas para incluir en la próxima crónica, mandá una
              solicitada o nominá a algún miembro del grupo para los premios de
              fin de año
            </p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Participá
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <i class="fa-regular fa-comment"></i>
            <h3>Opiná y votá</h3>
            <p>Ver como estas de acuerdo a tu participación y contribuciones</p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Votá
            </Link>
          </div>
        </div>
      </section>
      <section className="cronica-older"></section>
    </div>
  );
};

export default CronicaHome;
