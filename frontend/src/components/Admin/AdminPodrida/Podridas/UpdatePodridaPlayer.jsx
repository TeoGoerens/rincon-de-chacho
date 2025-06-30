// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./UpdatePodridaPlayerStyles.css";

//Import React Query functions
import fetchPodridaPlayerById from "../../../../reactquery/podrida/fetchPodridaPlayerById";
import updatePodridaPlayer from "../../../../reactquery/podrida/updatePodridaPlayer";

const UpdatePodridaPlayer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Definición de variables
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Obtener datos del jugador
  const {
    data: playerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchPodridaPlayerById", id],
    queryFn: () => fetchPodridaPlayerById(id),
  });

  // Setear valores iniciales una vez que se cargue playerData
  useEffect(() => {
    if (playerData) {
      setName(playerData.name);
      setEmail(playerData.email);
    }
  }, [playerData]);

  // Mutation para actualizar jugador
  const mutation = useMutation({
    mutationFn: updatePodridaPlayer,
    onSuccess: () => {
      toast.success("✅ Jugador actualizado correctamente");
      queryClient.invalidateQueries(["fetchAllPodridaPlayers"]);
      navigate("/admin/podrida/jugadores");
    },
    onError: (error) => {
      toast.error(`❌ Error al actualizar el jugador: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    mutation.mutate({
      playerId: id,
      updateData: { name: name.trim(), email: email.trim().toLowerCase() },
    });
  };

  if (isLoading) return <p>Cargando jugador...</p>;
  if (isError) return <p>Error: {error.message}</p>;

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
          <h2>Actualizar jugador</h2>
          <Link className="back-btn" to="/admin/podrida/jugadores">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </Link>
        </div>

        <form className="form-create-podrida" onSubmit={handleSubmit}>
          <label>Nombre:</label>
          <input
            type="text"
            value={name}
            placeholder="Ej: Teo"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email:</label>
          <input
            type="email"
            value={email}
            placeholder="Ej: correo@dominio.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Cargando..." : "Actualizar partida"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdatePodridaPlayer;
