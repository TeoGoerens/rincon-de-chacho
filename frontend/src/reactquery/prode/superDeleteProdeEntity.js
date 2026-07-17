import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Endpoints de SUPER ELIMINACIÓN (solo super admin): borran aunque haya
   datos asociados, en cascada. Un solo hook para las 5 entidades. */
const SUPER_DELETE_ENDPOINTS = {
  matchday: (id) => `/api/prode/matchday/${id}/super`,
  tournament: (id) => `/api/prode/tournament/${id}/super`,
  player: (id) => `/api/prode/player/${id}/super`,
  gdtUniverse: (id) => `/api/prode/gdt/universes/${id}/super`,
  gdtPlayer: (id) => `/api/prode/gdt/players/${id}/super`,
};

const superDeleteProdeEntity = async ({ kind, id }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }
  const buildEndpoint = SUPER_DELETE_ENDPOINTS[kind];
  if (!buildEndpoint) {
    throw new Error(`Entidad desconocida para super eliminación: ${kind}`);
  }

  try {
    const response = await axios.delete(`${baseURL}${buildEndpoint(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error en la super eliminación",
    );
  }
};

export default superDeleteProdeEntity;
