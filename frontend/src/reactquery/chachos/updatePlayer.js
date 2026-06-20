import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updatePlayer = async ({
  id,
  shirt,
  first_name,
  last_name,
  field_position,
  role,
  bio,
  interview,
}) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.put(
    `${baseURL}/api/chachos/player/${id}`,
    { shirt, first_name, last_name, field_position, role, bio, interview },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default updatePlayer;
