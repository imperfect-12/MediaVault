import api from "./axios";

export const getAllMedia = async (type) => {
  const res = await api.get("/media", {
    params: type ? { type } : undefined,
  });
  return res.data.media;
};

export const createMedia = async (data) => {
  const res = await api.post("/media", data);
  return res.data.media;
};

export const updateMedia = async (id, data) => {
  const res = await api.patch(`/media/${id}`, data);
  return res.data.media;
};

export const deleteMedia = async (id) => {
  const res = await api.delete(`/media/${id}`);
  return res.data;
};
