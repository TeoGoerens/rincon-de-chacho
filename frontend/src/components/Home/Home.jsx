//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./HomeStyles.css";

//Import helpers

//Import components
import homeImageSource from "../../assets/photos/chacho-home.png";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const Home = () => {
  return (
    <div className="container home-container">
      <div className="home-text">
        <h2>Hola chacal,</h2>
        <h1>
          Bienvenido a{" "}
          <span className="home-text-brand">
            El Rincón de <span>Chacho</span>
          </span>
        </h1>
        <div className="home-image-container-mobile">
          <img
            src={homeImageSource}
            alt="Mobile Home"
            className="mobile-home-image"
          />
        </div>
        <h4>
          Este es un espacio que se está lanzando en 2024, con la intención de
          ser un lugar de encuentro <span>multipropósito</span>. Por ahora
          arrancamos con una visión más orientada a Chachos, pero será solamente
          hasta que la empresa de Teo (no la nombramos para no hacerle
          propaganda gratis) le dé más tiempo libre. En este sentido le damos
          las gracias a <span>Crisil Argentina.</span>
        </h4>
        <h4>
          ¿Qué vas a poder hacer por ahora? Votar perlas, ver quién ganó,
          quiénes vienen siendo los más votados en el año en cada categoría y
          ver algunas fotos...
        </h4>
        <Link to="/photo-gallery" className="home-btn">
          Vamos a la galería de fotos
        </Link>
      </div>
      <div className="home-image-container">
        <img src={homeImageSource} alt="Home" className="home-image" />
      </div>
    </div>
  );
};

export default Home;
