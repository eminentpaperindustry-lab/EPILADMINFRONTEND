import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import AuthContext from "./AuthContext";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://epilbackend.onrender.com/api/delegation", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (data) => {
    const res = await axios.post("https://epilbackend.onrender.com/api/delegation", data, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTasks(prev => [{ ...data, TaskID: res.data.TaskID, Status: "Pending" }, ...prev]);
  };

  const markDone = async (taskId) => {
    await axios.patch(`https://epilbackend.onrender.com/api/delegation/done/${taskId}`, {}, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTasks(prev => prev.map(t => t.TaskID === taskId ? { ...t, Status: "Done" } : t));
  };

  const deleteTask = async (taskId) => {
    await axios.delete(`https://epilbackend.onrender.com/api/delegation/${taskId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTasks(prev => prev.filter(t => t.TaskID !== taskId));
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, fetchTasks, createTask, markDone, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
