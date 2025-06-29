//Import React & Hooks
import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

//Import React Query functions
import fetchPodridaRecords from "../../../reactquery/podrida/fetchPodridaRecords";
import fetchLastPodridaMatch from "../../../reactquery/podrida/fetchLastPodridaMatch";
import fetchPodridaRanking from "../../../reactquery/podrida/fetchPodridaRanking";

//Import CSS & styles
import "./PodridaHomePanelStyles.css";

//Import helpers
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";
import { matchStatsSort } from "../../../helpers/matchStatsSort";

//Import components
import PodridaMenu from "../PodridaMenu";
import RecordsSlide from "../../Layout/Podrida/RecordsSlide/RecordsSlide";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getMatchStatsFilteredAction } from "../../../redux/slices/match-stats/matchStatsSlices";
import { getAllTournamentsAction } from "../../../redux/slices/tournaments/tournamentsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const PodridaHomePanel = () => {
  // Definición de la variable selectedYear para configurar el filtro anual
  const [selectedYear, setSelectedYear] = useState("all");

  // UseQuery de Podrida Records
  const {
    data: recordsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchPodridaRecords", selectedYear],
    queryFn: () =>
      fetchPodridaRecords(selectedYear === "all" ? "" : selectedYear),
  });

  // UseQuery de Podrida Last Match
  const {
    data: lastMatch,
    isLoading: isLoadingLastMatch,
    isError: isErrorLastMatch,
    error: errorLastMatch,
  } = useQuery({
    queryKey: ["fetchLastPodridaMatch"],
    queryFn: fetchLastPodridaMatch,
  });

  // UseQuery de Podrida Ranking
  const {
    data: rankingData,
    isLoading: isLoadingRanking,
    isError: isErrorRanking,
    error: rankingError,
  } = useQuery({
    queryKey: ["fetchPodridaRanking", selectedYear],
    queryFn: () => fetchPodridaRanking(selectedYear),
  });

  // Definición de variables adicionales
  if (isLoading) return <p>Cargando estadísticas...</p>;
  if (isError) return <p>Error al cargar: {error.message}</p>;

  const { availableYears, records } = recordsData;

  return (
    <>
      <PodridaMenu />
      <section className="container podrida-container">
        {/* Filtro */}
        <div className="filtro-container">
          <label htmlFor="year-select">Filtrar por año:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {["all", ...availableYears].map((year, idx) => (
              <option key={idx} value={year}>
                {year === "all" ? "Todos" : year}
              </option>
            ))}
          </select>
        </div>

        {/* Records */}
        <h3 className="section-title blue">🧠 Records históricos</h3>
        <div className="records-container">
          {records &&
            records.map((r, idx) => (
              <div className={`record-card ${r.type}`} key={idx}>
                <h4>{r.title}</h4>
                <p>
                  {r?.name} ({r?.value})
                </p>
              </div>
            ))}
        </div>

        {/* Última partida */}
        <h3 className="section-title yellow">🕹️ Última partida</h3>
        <div className="ultima-partida-container">
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(lastMatch?.lastMatch?.date).toLocaleDateString("es-AR")}
          </p>
          <ul>
            <li>
              <strong>Jugadores:</strong>{" "}
              {lastMatch?.lastMatch?.players
                .map((p) => p.player.name)
                .join(", ")}
            </li>
            <li>
              <strong>1° Puesto:</strong>{" "}
              {lastMatch?.lastMatch?.players[0].player.name} (
              {lastMatch?.lastMatch?.players[0].score} pts)
            </li>
            <li>
              <strong>2° Puesto:</strong>{" "}
              {lastMatch?.lastMatch?.players[1].player.name} (
              {lastMatch?.lastMatch?.players[1].score} pts)
            </li>
            <li>
              <strong>3° Puesto:</strong>{" "}
              {lastMatch?.lastMatch?.players[2].player.name} (
              {lastMatch?.lastMatch?.players[2].score} pts)
            </li>
            <li>
              <strong>Highlight:</strong>{" "}
              {lastMatch?.lastMatch?.highlight.player.name} (
              {lastMatch?.lastMatch?.highlight.score})
            </li>
            <li>
              <strong>Último:</strong>{" "}
              {
                lastMatch?.lastMatch?.players[
                  lastMatch?.lastMatch?.players.length - 1
                ].player.name
              }{" "}
              (
              {
                lastMatch?.lastMatch?.players[
                  lastMatch?.lastMatch?.players.length - 1
                ].score
              }{" "}
              pts)
            </li>
            <li>
              <strong>Racha + larga cumpliendo:</strong>{" "}
              {lastMatch?.lastMatch?.longestStreakOnTime.player.name} (
              {lastMatch?.lastMatch?.longestStreakOnTime.count})
            </li>
            <li>
              <strong>Racha + larga sin cumplir:</strong>{" "}
              {lastMatch?.lastMatch?.longestStreakFailing.player.name} (
              {lastMatch?.lastMatch?.longestStreakFailing.count})
            </li>
          </ul>
        </div>

        {/* Ranking */}
        <h3 className="section-title gray">📊 Ranking de puntaje</h3>
        <div className="ranking-container">
          <div className="emoji-legenda">
            <div>
              <span className="emoji">🎯</span> 1° puesto = +3 pts
            </div>
            <div>
              <span className="emoji">🥈</span> 2° puesto = +2 pts
            </div>
            <div>
              <span className="emoji">🥉</span> 3° puesto = +1 pt
            </div>
            <div>
              <span className="emoji">🌟</span> Highlight = +1 pt
            </div>
            <div>
              <span className="emoji">💀</span> Último puesto = -1 pt
            </div>
          </div>

          <div className="ranking-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Jugador</th>
                  <th>PJ</th>
                  <th title="1° puesto = 3 pts">🎯</th>
                  <th title="2° puesto = 2 pts">🥈</th>
                  <th title="3° puesto = 1 pt">🥉</th>
                  <th title="Highlight = 1 pt">🌟</th>
                  <th title="Último puesto = -1 pt">💀</th>
                  <th title="Puntaje total">Pts</th>
                  <th title="Promedio de puntos por partida">Avg</th>
                </tr>
              </thead>
              <tbody>
                {rankingData?.ranking?.map((j, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{j.name}</td>
                    <td>{j.played === 0 ? "-" : j.played}</td>
                    <td>{j.firsts === 0 ? "-" : j.firsts}</td>
                    <td>{j.seconds === 0 ? "-" : j.seconds}</td>
                    <td>{j.thirds === 0 ? "-" : j.thirds}</td>
                    <td>{j.highlights === 0 ? "-" : j.highlights}</td>
                    <td>{j.lasts === 0 ? "-" : j.lasts}</td>
                    <td>{j.points === 0 ? "-" : j.points}</td>
                    <td>{j.average === 0 ? "-" : j.average?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
};

export default PodridaHomePanel;
