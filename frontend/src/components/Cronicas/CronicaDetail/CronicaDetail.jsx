//Import React & Hooks
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./CronicaDetailStyles.css";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter.js";

//Import React Query functions
import fetchCronicaById from "../../../reactquery/fetchCronicaById.js";
import fetchAllCommentsFromACronica from "../../../reactquery/fetchAllCommentsFromACronica.js";

//Import components
import photoLake from "../../../assets/photos/cronicas/bosque.jpg";
import authorPhoto from "../../../assets/photos/chacho-home.png";
import defaultUser from "../../../assets/photos/users/default-user.jpg";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaDetail = () => {
  // Informacion del query string acerca del id de la cronica
  const { id } = useParams();

  // Funcionalidad de LIKE en la cronica
  const [liked, setLiked] = useState(false);
  const toggleLiked = () => {
    setLiked(!liked);
  };

  // Funcionalidad para habilitar la respuesta a un comentario dado
  const [activeReplyId, setActiveReplyId] = useState(null);
  const toggleReply = (commentId) => {
    setActiveReplyId((prevId) => (prevId === commentId ? null : commentId));
  };

  // Query para obtener los datos de la crónica
  const {
    data: cronicaData,
    isLoading: isLoadingCronica,
    isError: isErrorCronica,
    error: cronicaError,
  } = useQuery({
    queryKey: ["fetchCronicaById", id],
    queryFn: () => fetchCronicaById(id),
  });

  // Query para obtener los comentarios de la crónica
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isError: isErrorComments,
    error: commentsError,
  } = useQuery({
    queryKey: ["fetchAllCommentsFromACronica", id],
    queryFn: () => fetchAllCommentsFromACronica(id),
  });

  if (isLoadingCronica || isLoadingComments) return <p>Cargando...</p>;
  if (isErrorCronica || isErrorComments)
    return <p>Error: {cronicaError?.message || commentsError?.message}</p>;

  const cronica = cronicaData?.cronica || {};
  const comments = commentsData?.commentsByCronica || [];

  console.log(cronica);
  console.log(comments);

  return (
    <div className="container">
      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Title ---------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-detail-title">
        <Link className="back-btn" to="/cronicas">
          <i class="fa-solid fa-arrow-left"></i> Volver a crónicas
        </Link>
        <h1>
          <span>{cronica.title}</span>
        </h1>

        <div className="cronica-detail-title-border"></div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Detail --------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-detail">
        <article>
          <div className="cronica-detail-image">
            <span className="cronica-detail-year">{cronica.year}</span>
            <img src={cronica.heroImage} alt={cronica.title} />
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
              <i className="fa-regular fa-calendar-days"></i>
              <p>Publicado el {formatDate(cronica.publishedDate)}</p>
            </div>
            <div className="cronica-author-details-kpi-icon to-hide">
              <i className="fa-solid fa-eye"></i>
              <p>{cronica.views}</p>
            </div>
            <div className="cronica-author-details-kpi-icon to-hide">
              <i className="fa-solid fa-heart"></i>
              <p>{cronica.likes.length}</p>
            </div>
          </div>
          <div className="cronica-like-btn">
            <button
              onClick={toggleLiked}
              className={liked ? "liked-btn" : "non-liked-btn"}
            >
              <i
                className={
                  liked
                    ? "fa-solid fa-heart liked-btn"
                    : "fa-solid fa-heart-crack non-liked-btn"
                }
              ></i>
              {liked ? "¡Me gusta!" : "¿Me gusta?"}
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Body ----------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-body">{cronica.body}</section>

      {/* -------------------------------------------------------------------------- */}
      {/* ---------------- Comments -------------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-comments">
        <h4>{cronica.commentCount} comentarios</h4>

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
          {comments.map((comment) => (
            <div className="cronica-comments-details-example" key={comment._id}>
              {/* ---------------- Cabezal del comentario -------------------------------------------------*/}
              <div className="cronica-comments-details-example-head">
                <div className="comment-author">
                  <img
                    src={comment.userId.profile_picture || defaultUser}
                    alt={`${comment.userId.first_name} ${comment.userId.last_name}`}
                  />
                  <div className="comment-author-name">
                    <h4>{`${comment.userId.first_name} ${comment.userId.last_name}`}</h4>
                    <p>{comment.userId.email}</p>
                  </div>
                </div>

                <p>{formatDate(comment.date)}</p>
              </div>

              {/* ---------------- Cuerpo del comentario -------------------------------------------------*/}
              <div className="cronica-comments-details-example-body">
                <p>{comment.comment}</p>
              </div>

              {/* ---------------- Reacciones al comentario -------------------------------------------------*/}
              <div className="cronica-comments-details-example-buttons">
                <div className="comment-reaction">
                  <button>
                    <i className="fa-solid fa-thumbs-up"></i>
                    <p>{comment.likes.length}</p>
                  </button>
                </div>
                <div className="comment-reaction">
                  <button>
                    <i className="fa-regular fa-thumbs-down"></i>
                    <p>{comment.dislikes.length}</p>
                  </button>
                </div>
                <div className="comment-reaction">
                  <button onClick={() => toggleReply(id)}>
                    <i className="fa-solid fa-reply"></i>
                    <p>
                      {activeReplyId === id
                        ? "Deshabilitar respuesta"
                        : "Habilitar respuesta"}
                    </p>
                  </button>
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
                {comment.replies.map((reply) => (
                  <div
                    className="cronica-comments-details-example-reply"
                    key={reply._id}
                  >
                    <div className="cronica-comments-details-example-head">
                      <div className="comment-author">
                        <img
                          src={reply.userId.profile_picture || defaultUser}
                          alt={`${reply.userId.first_name} ${reply.userId.last_name}`}
                        />
                        <div className="comment-author-name">
                          <h4>{`${reply.userId.first_name} ${reply.userId.last_name}`}</h4>
                          <p>{reply.userId.email}</p>
                        </div>
                      </div>

                      <p>{formatDate(reply.date)}</p>
                    </div>
                    <div className="cronica-comments-details-example-body">
                      <p>{reply.reply}</p>
                    </div>
                    <div className="cronica-comments-details-example-buttons">
                      <div className="comment-reaction">
                        <button>
                          <i className="fa-solid fa-thumbs-up"></i>
                          <p>{reply.likes.length}</p>
                        </button>
                      </div>
                      <div className="comment-reaction">
                        <button>
                          <i className="fa-regular fa-thumbs-down"></i>
                          <p>{reply.dislikes.length}</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CronicaDetail;
