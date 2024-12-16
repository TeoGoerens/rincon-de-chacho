//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

//Import CSS & styles
import "./CronicaDetailStyles.css";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter.js";

//Import React Query functions
import { getUserId } from "../../../reactquery/getUserInformation.js";
import { getUserRole } from "../../../reactquery/getUserInformation.js";
import fetchCronicaById from "../../../reactquery/cronica/fetchCronicaById.js";
import fetchAllCommentsFromACronica from "../../../reactquery/cronica/fetchAllCommentsFromACronica.js";
import updateCronicaLikesById from "../../../reactquery/cronica/updateCronicaLikesById.js";
import createCommentOnACronica from "../../../reactquery/cronica/createCommentOnACronica.js";
import createReplyOnAComment from "../../../reactquery/cronica/createReplyOnAComment.js";
import updateCommentLike from "../../../reactquery/cronica/updateCommentLike.js";
import updateCommentDislike from "../../../reactquery/cronica/updateCommentDislike.js";
import updateReplyLike from "../../../reactquery/cronica/updateReplyLike.js";
import updateReplyDislike from "../../../reactquery/cronica/updateReplyDislike.js";
import deleteCommentFromCronica from "../../../reactquery/cronica/deleteCommentFromCronica.js";
import deleteReplyFromComment from "../../../reactquery/cronica/deleteReplyFromComment.js";
import updateCommentOnCronica from "../../../reactquery/cronica/updateCommentOnCronica.js";
import updateReplyOnComment from "../../../reactquery/cronica/updateReplyOnComment.js";

//Import components
import authorPhoto from "../../../assets/photos/chacho-home.png";
import defaultUser from "../../../assets/photos/users/default-user.jpg";
import DeleteButton from "../../Layout/Buttons/DeleteButton.jsx";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaDetail = () => {
  // Informacion del query string acerca del id de la cronica
  const { id } = useParams();

  // React Query para invalidar o refrescar queries
  const queryClient = useQueryClient();

  // Definicion de variables
  const [liked, setLiked] = useState(false); // Permite activar LIKE a la cronica
  const [activeReplyId, setActiveReplyId] = useState(null); // Permita activar & habilitar la respuesta a un comentario
  const [newComment, setNewComment] = useState(""); // Estado para el nuevo comentario
  const [newReply, setNewReply] = useState(""); // Estado para la nueva respuesta
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedReply, setEditedReply] = useState("");
  const userId = getUserId();
  const userIsAdmin = getUserRole();

  // Query para obtener la crónica
  const {
    data: cronicaData,
    isLoading: isLoadingCronica,
    isError: isErrorCronica,
    error: cronicaError,
  } = useQuery({
    queryKey: ["fetchCronicaById", id],
    queryFn: () => fetchCronicaById(id),
  });

  // Efecto para setear el "liked" cuando llega la data
  useEffect(() => {
    if (
      cronicaData?.cronica?.likes &&
      Array.isArray(cronicaData.cronica.likes)
    ) {
      setLiked(cronicaData.cronica.likes.includes(userId));
    }
  }, [cronicaData, userId]);

  // Query para obtener comentarios
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isError: isErrorComments,
    error: commentsError,
  } = useQuery({
    queryKey: ["fetchAllCommentsFromACronica", id],
    queryFn: () => fetchAllCommentsFromACronica(id),
  });

  // Mutación para actualizar likes
  const likeMutation = useMutation({
    mutationFn: () => updateCronicaLikesById(id),
    onSuccess: (updatedCronica) => {
      // Si el endpoint retorna la cronica actualizada
      if (updatedCronica && Array.isArray(updatedCronica.likes)) {
        setLiked(updatedCronica.likes.includes(userId));
      }
      // Invalida la query para re-fetch si lo deseas
      queryClient.invalidateQueries(["fetchCronicaById", id]);
    },
    onError: (error) => {
      console.error("Error al actualizar los likes:", error.message);
    },
  });

  // Mutacion para crear comentario
  const commentMutation = useMutation({
    mutationFn: ({ cronicaId, comment }) =>
      createCommentOnACronica({ cronicaId, comment }),
    onSuccess: () => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
      setNewComment(""); // Limpia el campo una vez publicado el comentario
    },
    onError: (error) => {
      console.error("Error al crear el comentario:", error.message);
    },
  });

  // Mutacion para crear reply
  const replyMutation = useMutation({
    mutationFn: ({ commentId, reply }) =>
      createReplyOnAComment({ commentId, reply }),
    onSuccess: () => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
      setNewReply(""); // Limpia el campo una vez publicado el comentario
    },
    onError: (error) => {
      console.error("Error al crear la respuesta:", error.message);
    },
  });

  // Mutación para actualizar likes en comentarios
  const commentLikeMutation = useMutation({
    mutationFn: (commentId) => updateCommentLike(commentId),
    onSuccess: (updatedComment) => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error(
        "Error al actualizar los likes del comentario:",
        error.message
      );
    },
  });

  // Mutación para actualizar dislikes en comentarios
  const commentDislikeMutation = useMutation({
    mutationFn: (commentId) => updateCommentDislike(commentId),
    onSuccess: (updatedComment) => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error(
        "Error al actualizar los dislikes del comentario:",
        error.message
      );
    },
  });

  // Mutación para actualizar likes en replies
  const replyLikeMutation = useMutation({
    mutationFn: (commentId, replyId) => updateReplyLike(commentId, replyId),
    onSuccess: (updatedReply) => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error(
        "Error al actualizar los likes de la respuesta:",
        error.message
      );
    },
  });

  // Mutación para actualizar dislikes en replies
  const replyDislikeMutation = useMutation({
    mutationFn: (commentId, replyId) => updateReplyDislike(commentId, replyId),
    onSuccess: (updatedReply) => {
      // Invalida la query de comentarios para recargar la lista
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error(
        "Error al actualizar los dislikes de la respuesta:",
        error.message
      );
    },
  });

  // Mutación para eliminar un comentario
  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId }) => deleteCommentFromCronica({ commentId }),
    onSuccess: () => {
      // Una vez borrado, invalida la query para refrescar la lista de comentarios
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error("Error al eliminar el comentario:", error.message);
    },
  });

  // Mutación para eliminar una respuesta
  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentId, replyId }) =>
      deleteReplyFromComment({ commentId, replyId }),
    onSuccess: () => {
      // Una vez borrado, invalida la query para refrescar la lista de comentarios
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error("Error al eliminar el comentario:", error.message);
    },
  });

  // Mutación para actualizar un comentario
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, comment }) =>
      updateCommentOnCronica({ commentId, comment }),
    onSuccess: () => {
      // Una vez borrado, invalida la query para refrescar la lista de comentarios
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error("Error al actualizar el comentario:", error.message);
    },
  });

  // Mutación para actualizar una reply
  const updateReplyMutation = useMutation({
    mutationFn: ({ commentId, replyId, reply }) =>
      updateReplyOnComment({ commentId, replyId, reply }),
    onSuccess: () => {
      // Una vez borrado, invalida la query para refrescar la lista de comentarios
      queryClient.invalidateQueries(["fetchAllCommentsFromACronica", id]);
    },
    onError: (error) => {
      console.error("Error al actualizar la reply:", error.message);
    },
  });

  // Evaluacion de estados durante carga y error
  if (isLoadingCronica || isLoadingComments) return <p>Cargando...</p>;
  if (isErrorCronica || isErrorComments)
    return <p>Error: {cronicaError?.message || commentsError?.message}</p>;

  // Definicion de funciones para botones
  const toggleLiked = () => {
    likeMutation.mutate(); // Ejecuta la mutación al hacer clic
  };

  const toggleReply = (commentId) => {
    setActiveReplyId((prevId) => (prevId === commentId ? null : commentId));
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return; // Evita enviar comentarios vacíos
    commentMutation.mutate({ cronicaId: id, comment: newComment });
  };

  const handleReplySubmit = (e, commentId) => {
    e.preventDefault();
    if (!newReply.trim()) return; // Evita enviar comentarios vacíos
    replyMutation.mutate({ commentId: commentId, reply: newReply });
    setActiveReplyId(null);
  };

  // Redefinicion de variables para simplicidad en el codigo
  const cronica = cronicaData?.cronica || {};
  const comments = commentsData?.commentsByCronica || [];

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
              <p>{cronica.likes?.length}</p>
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
      <section
        className="cronica-body"
        dangerouslySetInnerHTML={{ __html: cronica.body }}
      ></section>

      {cronica.images && cronica.images.length > 0 && (
        <section className="cronica-images">
          <h3>Imágenes adicionales</h3>
          <div className="cronica-images-content">
            {cronica.images.map((img, index) => (
              <figure key={index}>
                <img src={img.url} alt={img.caption} />
                <figcaption>{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {cronica.audios && cronica.audios.length > 0 && (
        <section className="cronica-audios">
          <h3>Audios</h3>
          <div className="cronica-audios-content">
            {cronica.audios.map((audio, index) => (
              <figure key={index}>
                <audio controls>
                  <source src={audio.url} type="audio/mpeg" />
                  Tu navegador no soporta el elemento audio.
                </audio>
                <figcaption>{audio.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {cronica.videos && cronica.videos.length > 0 && (
        <section className="cronica-videos">
          <h3>Videos</h3>
          <div className="cronica-videos-content">
            {cronica.videos.map((video, index) => (
              <figure key={index}>
                <video controls width="320" height="240">
                  <source src={video.url} type="video/mp4" />
                  Tu navegador no soporta el elemento video.
                </video>
                <figcaption>{video.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* ---------------- Comments -------------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-comments">
        <h4>{cronica.commentCount} comentarios</h4>

        {/* ---------------- Comentario -------------------------------------------------*/}
        <form className="cronica-comments-form" onSubmit={handleCommentSubmit}>
          <textarea
            placeholder="Agregá tu comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button type="submit" disabled={commentMutation.isLoading}>
            {commentMutation.isLoading ? "Publicando..." : "Publicar"}
          </button>
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
                {editingCommentId === comment._id ? (
                  <textarea
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <p>{comment.comment}</p>
                )}
              </div>

              {/* ---------------- Reacciones al comentario -------------------------------------------------*/}
              <div className="cronica-comments-details-example-buttons">
                <div className="comment-reaction">
                  <button
                    onClick={() =>
                      commentLikeMutation.mutate({ commentId: comment._id })
                    }
                    className={
                      comment.likes.includes(userId) ? "btn-like-active" : ""
                    }
                  >
                    <i className="fa-solid fa-thumbs-up"></i>
                    <p>{comment.likes.length}</p>
                  </button>
                </div>
                <div className="comment-reaction">
                  <button
                    onClick={() =>
                      commentDislikeMutation.mutate({ commentId: comment._id })
                    }
                    className={
                      comment.dislikes.includes(userId) ? "btn-like-active" : ""
                    }
                  >
                    <i className="fa-regular fa-thumbs-down"></i>
                    <p>{comment.dislikes.length}</p>
                  </button>
                </div>
                <div className="comment-reaction">
                  <button onClick={() => toggleReply(comment._id)}>
                    <i
                      className={`fa-solid fa-reply ${
                        activeReplyId === comment._id
                          ? "non-reply-btn"
                          : "reply-btn"
                      }`}
                    ></i>
                    <p
                      className={
                        activeReplyId === comment._id
                          ? "non-reply-btn"
                          : "reply-btn"
                      }
                    >
                      {activeReplyId === comment._id
                        ? "Deshabilitar respuesta"
                        : "Habilitar respuesta"}
                    </p>
                  </button>
                </div>

                {comment.userId._id === userId && (
                  <div className="comment-reaction editing-btn-menu">
                    {editingCommentId === comment._id ? (
                      <>
                        <button
                          className="editing-btn-menu-save"
                          onClick={() => {
                            // Guardar cambios
                            updateCommentMutation.mutate({
                              commentId: comment._id,
                              comment: editedComment,
                            });
                            setEditingCommentId(null);
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          className="editing-btn-menu-cancel"
                          onClick={() => {
                            // Cancelar edición
                            setEditingCommentId(null);
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCommentId(comment._id);
                          setEditedComment(comment.comment);
                        }}
                      >
                        <i className="fa-solid fa-pen editing-btn"></i>
                      </button>
                    )}
                  </div>
                )}
                {editingCommentId === comment._id
                  ? null
                  : (comment.userId._id === userId || userIsAdmin === true) && (
                      <div className="comment-reaction">
                        {/* Botón para eliminar el comentario */}
                        <DeleteButton
                          customCSSClass="delete-btn-custom"
                          onClick={deleteCommentMutation.mutate}
                          id={{ commentId: comment._id }}
                        />
                      </div>
                    )}
              </div>

              {/* ---------------- Mi respuesta al comentario -------------------------------------------------*/}
              {activeReplyId === comment._id && (
                <div className="cronica-comments-details-example-myreply">
                  <form onSubmit={(e) => handleReplySubmit(e, comment._id)}>
                    <textarea
                      placeholder="Escribe tu respuesta..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                    ></textarea>
                    <button type="submit" disabled={replyMutation.isLoading}>
                      {replyMutation.isLoading
                        ? "Respondiendo..."
                        : "Responder"}
                    </button>
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

                      <p className="response-date">{formatDate(reply.date)}</p>
                    </div>
                    <div className="cronica-comments-details-example-body">
                      {editingReplyId === reply._id ? (
                        <textarea
                          value={editedReply}
                          onChange={(e) => {
                            setEditedReply(e.target.value);
                          }}
                          autoFocus
                        />
                      ) : (
                        <p>{reply.reply}</p>
                      )}
                    </div>
                    <div className="cronica-comments-details-example-buttons">
                      <div className="comment-reaction">
                        <button
                          onClick={() =>
                            replyLikeMutation.mutate({
                              commentId: comment._id,
                              replyId: reply._id,
                            })
                          }
                          className={
                            reply.likes.includes(userId)
                              ? "btn-like-active"
                              : ""
                          }
                        >
                          <i className="fa-solid fa-thumbs-up"></i>
                          <p>{reply.likes.length}</p>
                        </button>
                      </div>
                      <div className="comment-reaction">
                        <button
                          onClick={() =>
                            replyDislikeMutation.mutate({
                              commentId: comment._id,
                              replyId: reply._id,
                            })
                          }
                          className={
                            reply.dislikes.includes(userId)
                              ? "btn-like-active"
                              : ""
                          }
                        >
                          <i className="fa-regular fa-thumbs-down"></i>
                          <p>{reply.dislikes.length}</p>
                        </button>
                      </div>

                      {reply.userId._id === userId && (
                        <>
                          {editingReplyId === reply._id ? (
                            <>
                              <div className="comment-reaction">
                                <button
                                  className="editing-btn-menu-save"
                                  onClick={() => {
                                    // Guardar cambios a través de la mutación
                                    updateReplyMutation.mutate({
                                      commentId: comment._id,
                                      replyId: reply._id,
                                      reply: editedReply,
                                    });
                                    setEditingReplyId(null); // Cerrar el textarea de inmediato
                                  }}
                                >
                                  Guardar
                                </button>
                              </div>
                              <div className="comment-reaction">
                                <button
                                  className="editing-btn-menu-cancel"
                                  onClick={() => {
                                    // Cancelar edición
                                    setEditingReplyId(null);
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="comment-reaction">
                              <button
                                onClick={() => {
                                  setEditingReplyId(reply._id);
                                  setEditedReply(reply.reply);
                                }}
                              >
                                <i className="fa-solid fa-pen editing-btn"></i>
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {editingReplyId === reply._id
                        ? null
                        : (reply.userId._id === userId ||
                            userIsAdmin === true) && (
                            <div className="comment-reaction">
                              {/* Botón para eliminar el comentario */}
                              <DeleteButton
                                customCSSClass="delete-btn-custom"
                                onClick={deleteReplyMutation.mutate}
                                id={{
                                  commentId: comment._id,
                                  replyId: reply._id,
                                }}
                              />
                            </div>
                          )}
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
