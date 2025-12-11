// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { AuthProvider } from "./context/AuthContext";
// import "./index.css"; // Tailwind CSS

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// );


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./index.css"; // Tailwind CSS

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
