import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/";

/* 🌍 Public API (login, signup, plans) */
export const publicAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* 🔐 Protected API (dashboard, billing, subscriptions) */
export const authAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* Attach JWT automatically */
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
