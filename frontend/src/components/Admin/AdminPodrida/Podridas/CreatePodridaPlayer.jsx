// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./CreatePodridaPlayerStyles.css";

//Import React Query functions
import fetchAllPodridaPlayers from "../../../../reactquery/podrida/fetchAllPodridaPlayers";
import createPodridaMatch from "../../../../reactquery/podrida/createPodridaMatch";
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
      toast.error(`❌ Error al crear jugador: ${error.message || error}`);
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
      {mutation.isPending && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className={`container ${mutation.isPending ? "blurred" : ""}`}>
        <div className="create-podrida-head">
          <h2>Crear nuevo jugador</h2>
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
            {mutation.isPending ? "Creando..." : "Crear jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreatePodridaPlayer;
