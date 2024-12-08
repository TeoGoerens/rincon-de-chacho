//Import React & Hooks
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

//Import CSS & styles
import "./CronicaHomeStyles.css";

//Import React Query functions
import fetchAllCronicas from "../../../reactquery/cronica/fetchAllCronicas";
import updateCronicaViewsById from "../../../reactquery/cronica/updateCronicaViewsById";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter";

//Import components
import imageTrophy from "../../../assets/images/cronicas/trophy.png";
import ImagePencil from "../../../assets/images/cronicas/pencil.png";
import ImageEnvelope from "../../../assets/images/cronicas/envelope.png";
import CurrentlyWorking from "../../Layout/SoonTag/CurrentlyWorking";

//----------------------------------------
//COMPONENT
//----------------------------------------

const CronicaHome = () => {
  const navigate = useNavigate();

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

  const { mutate: incrementViews } = useMutation({
    mutationFn: (id) => updateCronicaViewsById(id),
    onSuccess: (updatedCronica) => {
      // Una vez incrementadas las views con éxito, navegas al detalle
      navigate(`/cronicas/${updatedCronica.cronicaUpdated._id}`);
    },
    onError: (error) => {
      console.error("Error al actualizar las vistas:", error.message);
    },
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
              <button
                className="cronica-read-btn"
                onClick={() => incrementViews(cronicasData.cronicas[0]?._id)}
              >
                Leer más
              </button>
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
            <h3>Los Premios de Chacho</h3>
            <p>
              Nominá al más pollerudo del año, al borracho o al lírico. Además,
              mirá quiénes fueron los históricos ganadores
            </p>
            <Link to="/cronicas/premios" className="cronica-interactive-btn">
              Nominá
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <img src={ImagePencil} alt="Lapiz" />
            <h3>Solicitada Especial</h3>
            <p>
              Dejá tu huella en la crónica del próximo año pidiéndole a Chacho
              que tenga presente acontencimientos memorables
            </p>
            <Link to="/cronicas/solicitada" className="cronica-interactive-btn">
              Participá
            </Link>
          </div>
          <div className="cronica-interactive-content-card">
            <img src={ImageEnvelope} alt="Sobre" />
            <h3>La Pizarra Digital</h3>
            <p>
              Consultá quiénes son los soldados que nunca fallan a eventos
              especiales como cumpleaños o viajes con amigos
            </p>
            <Link to="/cronicas/pizarra" className="cronica-interactive-btn">
              Mirá
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* ----------------Cronica Older ---------------------------------------------*/}
      {/* -------------------------------------------------------------------------- */}
      <section className="cronica-older">
        <h2>Crónicas pasadas</h2>

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
                <button
                  onClick={() => incrementViews(cronica._id)}
                  className="cronica-read-btn"
                >
                  Leer más
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CronicaHome;
