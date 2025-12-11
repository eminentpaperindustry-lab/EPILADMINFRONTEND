import axios from "axios";

const API = axios.create({
  baseURL: "https://epilbackend.onrender.com/api",
});

export default API;
