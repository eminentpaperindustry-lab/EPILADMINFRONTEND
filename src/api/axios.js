// import axios from "axios";

// const instance = axios.create({
//   baseURL: `${process.env.REACT_APP_BASE_URL}/api`, // your backend URL
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Add token automatically if exists
// instance.interceptors.request.use(config => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default instance;

import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST → token attach
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE → token expire handle
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // token clear
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // redirect to login
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default instance;

