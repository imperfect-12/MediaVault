import { useEffect, useMemo, useState } from "react";

import { createMedia, updateMedia } from "../api/media";

const mediaTypes = [
  { value: "movie", label: "Movie/Series" },
  { value: "anime", label: "Anime" },
  { value: "game", label: "Game" },
];

const statuses = [
  { value: "planning", label: "Planning" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const liveStatus = { value: "live", label: "Live" };

const initialForm = (media, defaultType) => ({
  name: media?.name || "",
  type: media?.type || defaultType || "movie",
  description: media?.description || "",
  imageUrl: media?.imageUrl || "",
  status: media?.status || "planning",
  rating: media?.rating || "",
  isFavourite: Boolean(media?.isFavourite),
});

const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary cloud name and unsigned upload preset are required.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Image upload failed.");
  }

  return data.secure_url;
};

const MediaModal = ({ media, defaultType, onClose, onSaved }) => {
  const [form, setForm] = useState(() => initialForm(media, defaultType));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(media?.imageUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(media);
  const charsLeft = 300 - form.description.length;
  const availableStatuses = form.type === "game" ? [...statuses, liveStatus] : statuses;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!file) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const title = useMemo(() => (isEditing ? "Edit Entry" : "Add Entry"), [isEditing]);

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const setMediaType = (type) => {
    setForm((current) => ({
      ...current,
      type,
      status: type !== "game" && current.status === "live" ? "planning" : current.status,
    }));
  };

  const handleFile = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const imageUrl = file ? await uploadToCloudinary(file) : form.imageUrl;
      const payload = {
        ...form,
        imageUrl,
        rating: form.rating ? Number(form.rating) : null,
      };
      const saved = isEditing ? await updateMedia(media._id, payload) : await createMedia(payload);
      onSaved(saved);
      onClose();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || apiError.message || "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="media-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">MediaVault</p>
            <h2 id="media-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close modal" onClick={onClose}>
            x
          </button>
        </div>

        <form className="media-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Baldur's Gate 3"
            />
          </label>

          <fieldset>
            <legend>Type</legend>
            <div className="segmented-control">
              {mediaTypes.map((item) => (
                <button
                  key={item.value}
                  className={form.type === item.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => setMediaType(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Description</span>
            <textarea
              maxLength="300"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="What makes this one worth remembering?"
            />
            <small>{charsLeft} characters left</small>
          </label>

          <fieldset>
            <legend>Status</legend>
            <div className="segmented-control status-control">
              {availableStatuses.map((item) => (
                <button
                  key={item.value}
                  className={form.status === item.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => setField("status", item.value)}
                >
                  <span className={`status-dot ${item.value}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Rating</span>
            <div className="rating-row">
              <input
                type="range"
                min="1"
                max="10"
                value={form.rating || 1}
                onChange={(event) => setField("rating", event.target.value)}
              />
              <button type="button" className="rating-value" onClick={() => setField("rating", "")}>
                {form.rating ? `${form.rating}/10` : "Unrated"}
              </button>
            </div>
          </label>

          <label className="drop-zone">
            <span>Image</span>
            <input type="file" accept="image/*" onChange={handleFile} />
            {preview ? (
              <img src={preview} alt="Selected poster preview" />
            ) : (
              <strong>Drop in a poster image</strong>
            )}
          </label>

          <label className="switch-row">
            <span>Add to favourites</span>
            <input
              type="checkbox"
              checked={form.isFavourite}
              onChange={(event) => setField("isFavourite", event.target.checked)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add to Library"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MediaModal;
