import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
export async function getToken() {
  const response = await axios.post(process.env.AUTH_URL, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    audience: process.env.AUDIENCE,
    grant_type: "client_credentials",
  });
  return response.data.access_token;
}
