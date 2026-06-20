// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaDetailStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import createPodridaPlayer from "../../../../reactquery/podrida/createPodridaPlayer";

const CreatePodridaPlayer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Definición de las variables que alimentarán el array que servirá de input para hacer un POST en el backend
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Mutación para crear jugador
  const mutation = useMutation({
    mutationFn: createPodridaPlayer,
    onSuccess: () => {
      toast.success("Jugador creado con éxito");
      queryClient.invalidateQueries(["fetchAllPodridaPlayers"]);
      navigate("/admin/podrida/jugadores");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el jugador");
    },
  });

  // Función que llamará el formulario una vez que se presione el Submit button
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Por favor completá todos los campos");
      return;
    }

    mutation.mutate({ name: name.trim(), email: email.trim().toLowerCase() });
  };

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
            <h1 className="pdf-title">Crear nuevo jugador</h1>
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
            {mutation.isPending ? "Creando..." : "Crear jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreatePodridaPlayer;
