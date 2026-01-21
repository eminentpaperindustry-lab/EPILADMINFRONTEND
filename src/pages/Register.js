import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const res = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/adminauth/admin/register`, {
        name,
        mobile,
        password,
        department,
      });

      setMsg(`Registered Successfully! Your EmployeeID: ${res.data.EmployeeID}`);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-10 w-96">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Create Account
        </h2>

        {error && (
          <div className="text-red-500 text-center mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {msg && (
          <div className="text-green-600 text-center mb-4 text-sm font-medium">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="text-gray-700 font-medium">Full Name</label>
          <input
            type="text"
            placeholder="Enter full name"
            className="w-full border border-gray-300 p-2 rounded mb-4 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="text-gray-700 font-medium">Mobile</label>
          <input
            type="text"
            placeholder="Enter mobile number"
            className="w-full border border-gray-300 p-2 rounded mb-4 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />

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
          <label className="text-gray-700 font-medium">Department</label>
          <input
            type="text"
            placeholder="Enter department"
            className="w-full border border-gray-300 p-2 rounded mb-6 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md text-lg font-semibold hover:bg-green-700 transition duration-200 flex justify-center"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-5 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
