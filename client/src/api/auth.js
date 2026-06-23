import api from "./axios";

export const loginRequest = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const registerRequest = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const logoutRequest = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};

export const getMeRequest = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};
