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
      toast.success("Jugador actualizado correctamente");
      queryClient.invalidateQueries(["fetchAllPodridaPlayers"]);
      navigate("/admin/podrida/jugadores");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar el jugador");
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

  if (isLoading) {
    return (
      <div className="pdf-page">
        <p className="pdf-state">Cargando jugador...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pdf-page">
        <p className="pdf-error-banner">{error?.message || "Ocurrió un error al cargar el jugador."}</p>
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
            <h1 className="pdf-title">Actualizar jugador</h1>
          </div>
          <Link className="pdf-back-link" to="/admin/podrida/jugadores">
            Volver
          </Link>
        </div>

        <form className="pdf-form" onSubmit={handleSubmit}>
          <div className="pdf-field">
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              placeholder="Ej: Teo"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="pdf-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              placeholder="Ej: correo@dominio.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="pdf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Cargando..." : "Actualizar jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdatePodridaPlayer;
