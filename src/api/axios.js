import axios from "axios";

const instance = axios.create({
  baseURL: "https://epilbackend.onrender.com/api", // your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token automatically if exists
instance.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
