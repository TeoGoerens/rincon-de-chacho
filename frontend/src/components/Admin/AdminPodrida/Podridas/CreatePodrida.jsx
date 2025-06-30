// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./CreatePodridaStyles.css";

//Import React Query functions
import fetchAllPodridaPlayers from "../../../../reactquery/podrida/fetchAllPodridaPlayers";
import createPodridaMatch from "../../../../reactquery/podrida/createPodridaMatch";

const CreatePodrida = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Definición de las variables que alimentarán el array que servirá de input para hacer un POST en el backend
  const [date, setDate] = useState("");
  const [players, setPlayers] = useState([
    { player: "", score: "" },
    { player: "", score: "" },
    { player: "", score: "" },
    { player: "", score: "" },
    { player: "", score: "" },
  ]);
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

  // Detalles de la mutation
  const mutation = useMutation({
    mutationFn: createPodridaMatch,
    onSuccess: (data) => {
      toast.success("Partida creada con éxito");
      queryClient.invalidateQueries(["fetchPodridaRecords"]);
      navigate("/admin/podrida");
    },
    onError: (error) => {
      toast.error(`❌ Error al crear la partida: ${error.message || error}`);
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
      players.some((p) => !p.player || !p.score)
    ) {
      toast.error("Por favor completá todos los campos obligatorios");
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
    mutation.mutate(matchData);
  };

  return (
    <>
      {/* Spinner Overlay */}
      {mutation.isPending && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className={`container ${mutation.isPending ? "blurred" : ""}`}>
        <div className="create-podrida-head">
          <h2>Crear nueva partida</h2>
          <Link className="back-btn" to="/admin/podrida">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </Link>
        </div>
        <form className="form-create-podrida" onSubmit={handleSubmit}>
          <label>Fecha de la partida:</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label>Jugadores:</label>
          {players.map((playerData, idx) => (
            <div key={idx} className="player-row">
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
              <input
                type="number"
                placeholder="Puntaje"
                value={playerData.score}
                onChange={(e) =>
                  handlePlayerChange(idx, "score", e.target.value)
                }
                required
              />
            </div>
          ))}

          <div className="player-actions">
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
            >
              ➕ Agregar jugador
            </button>

            <button
              type="button"
              onClick={() => handleRemovePlayer(players.length - 1)}
              disabled={players.length <= 5}
            >
              ➖ Quitar jugador
            </button>
          </div>

          <label>Highlight:</label>
          <div className="player-row">
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
            <input
              type="number"
              placeholder="Puntaje"
              value={highlight.score}
              onChange={(e) =>
                setHighlight({ ...highlight, score: e.target.value })
              }
              required
            />
          </div>

          <label>Racha cumpliendo:</label>
          <div className="player-row">
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
            <input
              type="number"
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

          <label>Racha sin cumplir:</label>
          <div className="player-row">
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
            <input
              type="number"
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

          <button
            type="submit"
            className="submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Cargando..." : "Crear partida"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreatePodrida;
