//Import React & Hooks
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./CronicaDetailStyles.css";

//Import helpers

//Import components
import photoLake from "../../../assets/photos/cronicas/bosque.jpg";
import authorPhoto from "../../../assets/photos/chacho-home.png";
import defaultUser from "../../../assets/photos/users/default-user.jpg";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaDetail = () => {
  const { id } = useParams();

  const [activeReplyId, setActiveReplyId] = useState(null);
  const toggleReply = (id) => {
    setActiveReplyId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="container">
      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Title ---------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-detail-title">
        <h1>
          Lorem ipsum dolor sit amet <span>{id}</span>
        </h1>
        <h3>Subtitulo de la cronica</h3>
        <div className="cronica-detail-title-border"></div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Detail --------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-detail">
        <article>
          <div className="cronica-detail-image">
            <span className="cronica-detail-year">Año 2023</span>
            <img src={photoLake} alt="Foto crónica" />
          </div>
        </article>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Information ---------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-author">
        <img src={authorPhoto} alt="Autor de la cronica" />
        <div className="cronica-author-details">
          <h4>Rafa Giaccio</h4>
          <div className="cronica-author-details-kpi">
            <div className="cronica-author-details-kpi-icon">
              <i class="fa-regular fa-calendar-days"></i>
              <p>Publicado el 20/10/2024</p>
            </div>
            <div className="cronica-author-details-kpi-icon to-hide">
              <i class="fa-solid fa-eye"></i>
              <p>126 vistas</p>
            </div>
            <div className="cronica-author-details-kpi-icon to-hide">
              <i class="fa-solid fa-clock"></i>
              <p>23 minutos de lectura</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Body ----------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-body">
        <article>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed id
          deserunt repellat consequuntur totam dolores magnam corporis amet
          dignissimos? Excepturi repudiandae assumenda quaerat hic quo nobis
          accusantium, ab animi nam possimus at aspernatur quas magni delectus
          adipisci cupiditate, placeat maiores ipsum dolorum? Consequatur qui
          odit, expedita dignissimos itaque a quam!
        </article>
        <article>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed id
          deserunt repellat consequuntur totam dolores magnam corporis amet
          dignissimos? Excepturi repudiandae assumenda quaerat hic quo nobis
          accusantium, ab animi nam possimus at aspernatur quas magni delectus
          adipisci cupiditate, placeat maiores ipsum dolorum? Consequatur qui
          odit, expedita dignissimos itaque a quam!
        </article>
        <article>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed id
          deserunt repellat consequuntur totam dolores magnam corporis amet
          dignissimos? Excepturi repudiandae assumenda quaerat hic quo nobis
          accusantium, ab animi nam possimus at aspernatur quas magni delectus
          adipisci cupiditate, placeat maiores ipsum dolorum? Consequatur qui
          odit, expedita dignissimos itaque a quam!
        </article>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ---------------- Comments -------------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-comments">
        <h4>4 comentarios</h4>

        {/* ---------------- Comentario -------------------------------------------------*/}
        <form className="cronica-comments-form" action="">
          <textarea
            name=""
            id=""
            placeholder="Agregá tu comentario..."
          ></textarea>
          <button type="submit">Publicar</button>
        </form>

        {/* ---------------- Todos los comentarios -------------------------------------------------*/}
        <div className="cronica-comments-details">
          <div className="cronica-comments-details-example">
            {/* ---------------- Cabezal del comentario -------------------------------------------------*/}
            <div className="cronica-comments-details-example-head">
              <div className="comment-author">
                <img src={defaultUser} alt="Autor del comentario" />
                <h4>Rafa Giaccio</h4>
              </div>

              <p>hace 3 horas</p>
            </div>

            {/* ---------------- Cuerpo del comentario -------------------------------------------------*/}
            <div className="cronica-comments-details-example-body">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quasi
                nesciunt repellat sunt. Harum fugit id, obcaecati provident
                sequi eaque non.
              </p>
            </div>

            {/* ---------------- Reacciones al comentario -------------------------------------------------*/}
            <div className="cronica-comments-details-example-buttons">
              <div className="comment-reaction">
                <button>
                  <i class="fa-solid fa-thumbs-up"></i>
                </button>
                <p>10</p>
              </div>
              <div className="comment-reaction">
                <button>
                  <i class="fa-regular fa-thumbs-down"></i>
                </button>
                <p>10</p>
              </div>
              <div className="comment-reaction">
                <button onClick={() => toggleReply(id)}>
                  <i class="fa-solid fa-reply"></i>
                </button>
                <p>
                  {activeReplyId === id
                    ? "Deshabilitar respuesta"
                    : "Habilitar respuesta"}
                </p>
              </div>
            </div>

            {/* ---------------- Mi respuesta al comentario -------------------------------------------------*/}
            {activeReplyId === id && (
              <div className="cronica-comments-details-example-myreply">
                <form action="">
                  <textarea
                    name=""
                    id=""
                    placeholder="Escribe tu respuesta..."
                  ></textarea>
                  <button type="submit">Responder</button>
                </form>
              </div>
            )}

            {/* ---------------- Respuestas generales -------------------------------------------------*/}
            <div className="cronica-comments-details-example-replies">
              <div className="cronica-comments-details-example-reply">
                <div className="cronica-comments-details-example-head">
                  <div className="comment-author">
                    <img src={defaultUser} alt="Autor del comentario" />
                    <h4>Rafa Giaccio Idoyaga Molina</h4>
                  </div>

                  <p>hace 3 horas</p>
                </div>
                <div className="cronica-comments-details-example-body">
                  <p>
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                    Laboriosam quaerat aut aspernatur facilis hic laudantium
                    sequi asperiores libero, dolore distinctio blanditiis minus,
                    nemo nobis, suscipit veritatis soluta dolores a dolor illum!
                    Maxime, enim. Veniam, dolorum.
                  </p>
                </div>
                <div className="cronica-comments-details-example-buttons">
                  <div className="comment-reaction">
                    <button>
                      <i class="fa-solid fa-thumbs-up"></i>
                    </button>
                    <p>10</p>
                  </div>
                  <div className="comment-reaction">
                    <button>
                      <i class="fa-regular fa-thumbs-down"></i>
                    </button>
                    <p>10</p>
                  </div>
                </div>
              </div>
              <div className="cronica-comments-details-example-reply">
                <div className="cronica-comments-details-example-head">
                  <div className="comment-author">
                    <img src={defaultUser} alt="Autor del comentario" />
                    <h4>Teo Goerens</h4>
                  </div>

                  <p>hace 3 horas</p>
                </div>
                <div className="cronica-comments-details-example-body">
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Nemo, officia.
                  </p>
                </div>
                <div className="cronica-comments-details-example-buttons">
                  <div className="comment-reaction">
                    <button>
                      <i class="fa-solid fa-thumbs-up"></i>
                    </button>
                    <p>10</p>
                  </div>
                  <div className="comment-reaction">
                    <button>
                      <i class="fa-regular fa-thumbs-down"></i>
                    </button>
                    <p>10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CronicaDetail;
