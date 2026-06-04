import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const uploadProfilePicture = async ({ id, file }) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token inválido. Por favor iniciá sesión nuevamente.");

  const formData = new FormData();
  formData.append("profile_picture", file);

  const response = await axios.put(
    `${baseURL}/api/users/${id}/profile-picture`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export default uploadProfilePicture;
