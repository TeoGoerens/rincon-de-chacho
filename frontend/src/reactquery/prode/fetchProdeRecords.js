import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeRecords = async (tournamentId = null) => {
  const token = getUserJWT();
  if (!token) throw new Error("No token found");

  const url = tournamentId
    ? `${baseURL}/api/prode/records?tournamentId=${tournamentId}`
    : `${baseURL}/api/prode/records`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export default fetchProdeRecords;
