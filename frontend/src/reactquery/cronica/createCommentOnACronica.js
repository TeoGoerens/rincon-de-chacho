import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createCommentOnACronica = async ({ cronicaId, comment }) => {
  // Retrieve jwt from the user
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  // Endpoint to create a comment
  const endpoint = `${baseURL}/api/cronica/comment/${cronicaId}`;

  // POST request to the server
  const response = await axios.post(
    endpoint,
    { comment: comment },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export default createCommentOnACronica;
