//Import React & Hooks
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./CronicaHomeStyles.css";

//Import React Query functions
import fetchAllCronicas from "../../../reactquery/fetchAllCronicas.js";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter";

//Import components
import photoLake from "../../../assets/photos/cronicas/bosque.jpg";
import imageTrophy from "../../../assets/images/cronicas/trophy.png";
import ImagePencil from "../../../assets/images/cronicas/pencil.png";
import ImageEnvelope from "../../../assets/images/cronicas/envelope.png";

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaHome = () => {
  // Utilizar React Query para manejar el estado de la petición de Cronicas
  const {
    data: cronicasData,
    isLoading: isLoadingCronicas,
    isError: isErrorCronicas,
    error: errorCronicas,
  } = useQuery({
    queryKey: ["fetchAllCronicas"],
    queryFn: fetchAllCronicas,
  });

  // Manejar estados de carga y error de ambas queries
  if (isLoadingCronicas) return <p>Cargando crónicas...</p>;
  if (isErrorCronicas) return <p>Error en crónicas: {errorCronicas.message}</p>;

  return (
    <div className="container">
      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Title ---------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-title">
        <h1>
          Las Crónicas de <span>Chacho</span>
        </h1>
        <h3>Un recorrido único a través de los años</h3>
        <div className="cronica-title-border"></div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Newest --------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-newest">
        {cronicasData?.cronicas?.length > 0 ? (
          <article>
            <div className="cronica-image">
              <span>
                <i className="fa-solid fa-arrow-trend-up"></i> Destacado
              </span>
              <img
                src={
                  cronicasData.cronicas[0]?.heroImage ||
                  "/path/to/default-image.jpg"
                }
                alt={cronicasData.cronicas[0]?.title || "Imagen no disponible"}
              />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>{cronicasData.cronicas[0]?.title}</h3>
                <span className="cronica-year">
                  {cronicasData.cronicas[0]?.year}
                </span>
              </div>

              <p>{cronicasData.cronicas[0]?.subtitle}</p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i className="fa-regular fa-calendar-days"></i>
                  <p>{formatDate(cronicasData.cronicas[0]?.publishedDate)}</p>
                </div>
                <div className="cronica-icons-content">
                  <i class="fa-solid fa-eye"></i>
                  <p>{cronicasData.cronicas[0]?.views}</p>
                </div>
                <div className="cronica-icons-content">
                  <i class="fa-solid fa-heart"></i>
                  <p>{cronicasData.cronicas[0]?.likes?.length}</p>
                </div>
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-comment"></i>
                  <p>{cronicasData.cronicas[0]?.commentCount}</p>
                </div>
              </div>
              <Link
                to={`/cronicas/${cronicasData.cronicas[0]?._id}`}
                className="cronica-read-btn"
              >
                Leer más
              </Link>
            </div>
          </article>
        ) : (
          <p>No hay cronicas recientes disponibles</p>
        )}
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Interactive ---------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-interactive">
        <h2>No dejes de ser parte</h2>
        <div className="cronica-interactive-content">
          <div className="cronica-interactive-content-card">
            <img src={imageTrophy} alt="Trofeo" />
            <h3>Ranking de aportes</h3>
            <p>
              Cada una de tus participaciones es muy valiosa para la página.
              Sumá puntos y ganá importantes premios
            </p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Mirá
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <img src={ImagePencil} alt="Lapiz" />
            <h3>Tu contribución suma</h3>
            <p>
              Ya sean anécdotas para incluir en la próxima crónica, solicitadas
              o nominaciones... Asegurate de dejar tu huella
            </p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Participá
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <img src={ImageEnvelope} alt="Sobre" />
            <h3>Opiná y votá</h3>
            <p>
              Valorá las propuestas ajenas, deja tu like o apela al derecho a
              replica y respondé encuestas para hacer la próxima crónica más
              colaborativa
            </p>
            <Link to="/photo-gallery" className="cronica-interactive-btn">
              Votá
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Older ---------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-older">
        <h2>Crónicas pasadas</h2>
        <div className="cronica-older-filter">
          <select
          /*  value={filterYear} */
          /* onChange={(e) => setFilterYear(e.target.value)} */
          >
            <option value="All">Todos los años</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            {/* Añade más años según necesites */}
          </select>

          <div className="cronica-older-filter-search-bar">
            <input
              type="text"
              placeholder="Buscar por título..."
              /*  value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} */
            />
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        <div className="cronica-older-content">
          {cronicasData?.cronicas?.slice(1).map((cronica) => (
            <article key={cronica._id}>
              <div className="cronica-image">
                <img src={cronica.heroImage} alt={cronica.title} />
              </div>
              <div className="cronica-details">
                <div className="cronica-details-title">
                  <h3>{cronica.title}</h3>
                  <span className="cronica-year">{cronica.year}</span>
                </div>

                <p>{cronica.subtitle}</p>
                <div className="cronica-icons">
                  <div className="cronica-icons-content">
                    <i className="fa-regular fa-calendar-days"></i>
                    <p>{formatDate(cronica.publishedDate)}</p>
                  </div>
                  <div className="cronica-icons-content">
                    <i className="fa-solid fa-eye"></i>
                    <p>{cronica.views}</p>
                  </div>
                  <div className="cronica-icons-content">
                    <i className="fa-solid fa-heart"></i>
                    <p>{cronica.likes.length}</p>
                  </div>
                  <div className="cronica-icons-content">
                    <i className="fa-regular fa-comment"></i>
                    <p>{cronica.commentCount}</p>
                  </div>
                </div>
                <Link
                  to={`/cronicas/${cronica._id}`}
                  className="cronica-read-btn"
                >
                  Leer más
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CronicaHome;
