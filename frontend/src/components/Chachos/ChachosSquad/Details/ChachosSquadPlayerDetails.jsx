//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./ChachosSquadPlayerDetailsStyles.css";

//Import components
import chachosSquadImages from "./ChachosSquadPlayerDetailsSupport";

//Import React Query functions
import fetchPlayerById from "../../../../reactquery/chachos/fetchPlayerById";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosSquadPlayerDetails = () => {
  //Get player id
  const { id } = useParams();

  const { data: selectedPlayer, error } = useQuery({
    queryKey: ["chachos-player", id],
    queryFn: () => fetchPlayerById(id),
  });

  const playerInfo = chachosSquadImages.find(
    (jugador) => jugador.shirt === selectedPlayer?.shirt
  );
  const imgSource = playerInfo?.img;

  return (
    <>
      <div className="container chachos-player-details-container">
        {error ? <h5>{error.message}</h5> : null}
        <div className="chachos-player-details-link">
          <Link className="return-link" to="/chachos/squad">
            Volver
          </Link>
        </div>

        <div className="chachos-player-details-content">
          <div className="chachos-player-details-title">
            <h6>Entrevista | Chachos</h6>
            <h2>
              Conociendo a{" "}
              <span>
                {selectedPlayer?.first_name} {selectedPlayer?.last_name}
              </span>
            </h2>
            <h4>{selectedPlayer?.bio}</h4>
          </div>

          <div className="chachos-player-details-image">
            <img src={imgSource} alt="Jugador" />
          </div>

          <div className="chachos-player-details-interview">
            <div
              dangerouslySetInnerHTML={{ __html: selectedPlayer?.interview }}
            />
          </div>

          {selectedPlayer?.shirt === 15 ? (
            <div className="chachos-player-details-others">
              <h4 className="chachos-player-details-others-title">
                Videos ilustrativos
              </h4>

              <iframe
                src="https://www.youtube.com/embed/LUID0jSh2Ic?si=AmlSjSn8iDr9_oPg"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>

              <iframe
                src="https://www.youtube.com/embed/TIC5RW2cxbs?si=JH46QZVrHmo-cKiI"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>

              <iframe
                src="https://www.youtube.com/embed/09sWYhMaL9Q?si=hFE_c9VWG_0wLrag"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          ) : null}

          {selectedPlayer?.shirt === 18 ? (
            <div className="chachos-player-details-others">
              <h4 className="chachos-player-details-others-title">
                La pistola desnuda
              </h4>

              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/0K8s9cNqZO4?si=Mjp6N68mpJZFAA8w"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          ) : null}

          {selectedPlayer?.shirt === 5 ? (
            <div className="chachos-player-details-others">
              <h4 className="chachos-player-details-others-title">
                Si sos un chacal vago, te dejamos la versión corta de la
                entrevista:
              </h4>

              <video width="400" controls>
                <source
                  src="https://rincon-de-chacho-assets.s3.us-east-2.amazonaws.com/chachos/videos/player-5.mp4"
                  type="video/mp4"
                />
              </video>
              <h4 className="chachos-player-details-others-title">
                Si te quedaste con ganas de más, acá tenés la entrevista entera:
              </h4>

              <video width="400" controls>
                <source
                  src="https://rincon-de-chacho-assets.s3.us-east-2.amazonaws.com/chachos/videos/player+5+(long).mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          ) : null}

          {selectedPlayer?.shirt === 19 ? (
            <div className="chachos-player-details-others">
              <h4 className="chachos-player-details-others-title">
                Tomate un rato para divertirte con la entrevista a nuestro
                capitán:
              </h4>

              <video width="400" controls>
                <source
                  src="https://rincon-de-chacho-assets.s3.us-east-2.amazonaws.com/chachos/videos/entrevista-german.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ChachosSquadPlayerDetails;
