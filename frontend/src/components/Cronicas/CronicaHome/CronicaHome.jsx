//Import React & Hooks
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./CronicaHomeStyles.css";

//Import helpers

//Import components
import photoLake from "../../../assets/photos/cronicas/bosque.jpg";
import imageTrophy from "../../../assets/images/cronicas/trophy.png";
import ImagePencil from "../../../assets/images/cronicas/pencil.png";
import ImageEnvelope from "../../../assets/images/cronicas/envelope.png";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaHome = () => {
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
            <Link to="/cronicas/1" className="cronica-read-btn">
              Leer más
            </Link>
          </div>
        </article>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Los desafios del año 2022</h3>
                <span className="cronica-year">2022</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Locuras sin limite</h3>
                <span className="cronica-year">2021</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Un mundo virtual y encierros</h3>
                <span className="cronica-year">2020</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>La ultima joda bien vivida</h3>
                <span className="cronica-year">2019</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Euforia mundialista. Yo te sigo adonde vayas</h3>
                <span className="cronica-year">2018</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Fin de ciclo. Abriendo el abanico de posibilidades</h3>
                <span className="cronica-year">2017</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
          <article>
            <div className="cronica-image">
              <img src={photoLake} alt="Foto crónica" />
            </div>
            <div className="cronica-details">
              <div className="cronica-details-title">
                <h3>Que estas esperando para hacer tu movida?</h3>
                <span className="cronica-year">2016</span>
              </div>

              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Impedit, ratione. Necessitatibus corporis sit vel neque eligendi
                qui doloribus asperiores fuga?
              </p>
              <div className="cronica-icons">
                <div className="cronica-icons-content">
                  <i class="fa-regular fa-calendar-days"></i>
                  <p>20/10/2023</p>
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
        </div>
      </section>
    </div>
  );
};

export default CronicaHome;
