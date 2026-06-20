// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaDetailStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchAllPodridaPlayers from "../../../../reactquery/podrida/fetchAllPodridaPlayers";
import fetchPodridaMatchById from "../../../../reactquery/podrida/fetchPodridaMatchById";
import updatePodridaMatch from "../../../../reactquery/podrida/updatePodridaMatch";

const UpdatePodrida = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Definición de las variables que alimentarán el array que servirá de input para hacer un POST en el backend
  const [date, setDate] = useState("");
  const [players, setPlayers] = useState([]);
  const [highlight, setHighlight] = useState({ player: "", score: "" });
  const [longestStreakOnTime, setLongestStreakOnTime] = useState({
    player: "",
    count: "",
  });
  const [longestStreakFailing, setLongestStreakFailing] = useState({
    player: "",
    count: "",
  });

  // Definición del Query para buscar todos los jugadores registrados
  const {
    data: allPlayers,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
  } = useQuery({
    queryKey: ["fetchAllPodridaPlayers"],
    queryFn: fetchAllPodridaPlayers,
  });

  // Traer los datos de la partida a editar
  const {
    data: matchData,
    isLoading: isLoadingMatch,
    isError: isErrorMatch,
  } = useQuery({
    queryKey: ["fetchPodridaMatchById", id],
    queryFn: () => fetchPodridaMatchById(id),
  });

  // Cargar datos una vez obtenidos
  useEffect(() => {
    if (matchData) {
      const m = matchData;
      setDate(m.date.slice(0, 10)); // formato yyyy-mm-dd
      setPlayers(
        m.players.map((p) => ({
          player: p.player._id,
          score: p.score,
        }))
      );
      setHighlight({
        player: m.highlight.player._id,
        score: m.highlight.score,
      });
      setLongestStreakOnTime({
        player: m.longestStreakOnTime.player._id,
        count: m.longestStreakOnTime.count,
      });
      setLongestStreakFailing({
        player: m.longestStreakFailing.player._id,
        count: m.longestStreakFailing.count,
      });
    }
  }, [matchData]);

  // Mutación para actualizar
  const mutation = useMutation({
    mutationFn: updatePodridaMatch,
    onSuccess: () => {
      toast.success("Partida actualizada con éxito");
      queryClient.invalidateQueries(["fetchAllPodridaMatches"]);
      navigate("/admin/podrida");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar la partida");
    },
  });

  // Funciones auxiliares para botones que permitirán manejar el form (agregado y eliminación de jugadores)
  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const handleAddPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, { player: "", score: "" }]);
    }
  };

  const handleRemovePlayer = () => {
    if (players.length > 5) {
      setPlayers(players.slice(0, -1));
    }
  };

  // Configuración de las opciones de jugadores para los menú desplegables del formulario
  const playerOptions = allPlayers || [];

  const matchPlayersOptions = players
    .map((p) => {
      const found = playerOptions.find((pl) => pl._id === p.player);
      return found ? { _id: found._id, name: found.name } : null;
    })
    .filter(Boolean);

  // Función que llamará el formulario una vez que se presione el Submit button
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones mínimas
    if (
      !date ||
      players.length < 5 ||
      players.some((p) => !p.player || !p.score || Number(p.score) < 0)
    ) {
      toast.error("Por favor completá todos los campos obligatorios con valores válidos");
      return;
    }

    const selectedPlayerIds = players.map((p) => p.player);
    if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
      toast.error("Un mismo jugador no puede estar repetido en la partida");
      return;
    }

    // Calcular posiciones en base a score (orden descendente)
    const sortedPlayers = [...players]
      .map((p) => ({ ...p, score: Number(p.score) }))
      .sort((a, b) => b.score - a.score);

    const playersWithPosition = sortedPlayers.map((p, idx) => ({
      player: p.player,
      score: p.score,
      position: idx + 1, // 1° = más puntos
    }));

    // Armado del objeto a enviar
    const matchData = {
      date,
      players: playersWithPosition,
      highlight: {
        player: highlight.player,
        score: Number(highlight.score),
      },
      longestStreakOnTime: {
        player: longestStreakOnTime.player,
        count: Number(longestStreakOnTime.count),
      },
      longestStreakFailing: {
        player: longestStreakFailing.player,
        count: Number(longestStreakFailing.count),
      },
    };

    // Envío
    mutation.mutate({ matchId: id, matchData });
  };

  if (isLoadingPlayers) {
    return (
      <div className="pdf-page">
        <p className="pdf-state">Cargando jugadores...</p>
      </div>
    );
  }

  if (isErrorPlayers) {
    return (
      <div className="pdf-page">
        <p className="pdf-error-banner">Ocurrió un error al cargar los jugadores.</p>
      </div>
    );
  }

  if (isLoadingMatch) {
    return (
      <div className="pdf-page">
        <p className="pdf-state">Cargando partida...</p>
      </div>
    );
  }

  if (isErrorMatch) {
    return (
      <div className="pdf-page">
        <p className="pdf-error-banner">Ocurrió un error al cargar la partida.</p>
      </div>
    );
  }

  return (
    <>
      {/* Spinner Overlay */}
      {mutation.isPending && <SpinnerOverlay />}

      <div className="pdf-page">
        <div className="pdf-header">
          <div className="pdf-header-text">
            <div className="pdf-eyebrow">
              <span className="pdf-eyebrow-dot" />
              Podrida
            </div>
            <h1 className="pdf-title">Actualizar partida</h1>
          </div>
          <Link className="pdf-back-link" to="/admin/podrida">
            Volver
          </Link>
        </div>

        <form className="pdf-form" onSubmit={handleSubmit}>
          <div className="pdf-field">
            <label>Fecha de la partida</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <h3 className="pdf-card-title">Jugadores</h3>
          {players.map((playerData, idx) => (
            <div key={idx} className="pdf-player-row">
              <div className="pdf-field">
                <label>Jugador {idx + 1}</label>
                <select
                  value={playerData.player}
                  onChange={(e) =>
                    handlePlayerChange(idx, "player", e.target.value)
                  }
                  required
                >
                  <option value="">Seleccionar jugador</option>
                  {playerOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pdf-field">
                <label>Puntaje</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Puntaje"
                  value={playerData.score}
                  onChange={(e) =>
                    handlePlayerChange(idx, "score", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          ))}

          <div className="pdf-player-actions">
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
            >
              <i className="fa-solid fa-plus"></i> Agregar jugador
            </button>

            <button
              type="button"
              onClick={handleRemovePlayer}
              disabled={players.length <= 5}
            >
              <i className="fa-solid fa-minus"></i> Quitar jugador
            </button>
          </div>

          <h3 className="pdf-card-title">Highlight</h3>
          <div className="pdf-player-row">
            <div className="pdf-field">
              <label>Jugador</label>
              <select
                value={highlight.player}
                onChange={(e) =>
                  setHighlight({ ...highlight, player: e.target.value })
                }
                required
              >
                <option value="">Seleccionar jugador</option>
                {matchPlayersOptions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pdf-field">
              <label>Puntaje</label>
              <input
                type="number"
                min="0"
                placeholder="Puntaje"
                value={highlight.score}
                onChange={(e) =>
                  setHighlight({ ...highlight, score: e.target.value })
                }
                required
              />
            </div>
          </div>

          <h3 className="pdf-card-title">Racha cumpliendo</h3>
          <div className="pdf-player-row">
            <div className="pdf-field">
              <label>Jugador</label>
              <select
                value={longestStreakOnTime.player}
                onChange={(e) =>
                  setLongestStreakOnTime({
                    ...longestStreakOnTime,
                    player: e.target.value,
                  })
                }
                required
              >
                <option value="">Seleccionar jugador</option>
                {matchPlayersOptions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pdf-field">
              <label>Cantidad</label>
              <input
                type="number"
                min="0"
                placeholder="Cantidad"
                value={longestStreakOnTime.count}
                onChange={(e) =>
                  setLongestStreakOnTime({
                    ...longestStreakOnTime,
                    count: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <h3 className="pdf-card-title">Racha sin cumplir</h3>
          <div className="pdf-player-row">
            <div className="pdf-field">
              <label>Jugador</label>
              <select
                value={longestStreakFailing.player}
                onChange={(e) =>
                  setLongestStreakFailing({
                    ...longestStreakFailing,
                    player: e.target.value,
                  })
                }
                required
              >
                <option value="">Seleccionar jugador</option>
                {matchPlayersOptions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pdf-field">
              <label>Cantidad</label>
              <input
                type="number"
                min="0"
                placeholder="Cantidad"
                value={longestStreakFailing.count}
                onChange={(e) =>
                  setLongestStreakFailing({
                    ...longestStreakFailing,
                    count: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="pdf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Cargando..." : "Actualizar partida"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdatePodrida;
