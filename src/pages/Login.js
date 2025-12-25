import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [employeeID, setEmployeeID] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If the user is already logged in, redirect them to the delegation page
  useEffect(() => {
    if (user) {
      navigate("/delegation");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(employeeID, password);
      navigate("/delegation"); // Redirect after successful login
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-10 w-96">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Admin Login</h2>

        {error && <div className="text-red-500 text-center mb-4 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="text-gray-700 font-medium">Employee ID</label>
          <input
            type="text"
            placeholder="Enter your Employee ID"
            value={employeeID}
            onChange={(e) => setEmployeeID(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded mb-4 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          />
{/* 
          <label className="text-gray-700 font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded mb-6 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          /> */}

                <label className="text-gray-700 font-medium">Password</label>
          <div className="relative mb-4 mt-1">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full border border-gray-300 p-2 rounded pr-10 focus:ring-2 focus:ring-blue-400 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 select-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-200 flex justify-center"
          >
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-5 text-sm">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
