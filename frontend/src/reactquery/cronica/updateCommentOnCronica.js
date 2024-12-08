import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateCommentOnCronica = async ({ commentId, comment }) => {
  // Retrieve jwt from the user
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  // Endpoint to create a comment
  const endpoint = `${baseURL}/api/cronica/comment/${commentId}`;

  // POST request to the server
  const response = await axios.put(
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

export default updateCommentOnCronica;
