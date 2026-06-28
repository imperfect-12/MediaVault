import { useEffect, useMemo, useRef, useState } from "react";

import { createMedia, updateMedia } from "../api/media";
import { uploadImage } from "../api/upload";
import { useSettings } from "../context/SettingsContext";
import BulkUploadForm from "./BulkUploadForm";

const mediaTypes = [
  { value: "manga", label: "Manga/Manhwa" },
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

const getNameFromFile = (fileName) => fileName.replace(/\.[^/.]+$/, "");

const initialForm = (media, defaultType) => ({
  name: media?.name || "",
  type: media?.type || defaultType || "manga",
  description: media?.description || "",
  imageUrl: media?.imageUrl || "",
  status: media?.status || "planning",
  rating: media?.rating || "",
  isFavourite: Boolean(media?.isFavourite),
});

const MediaModal = ({ media, defaultType, onClose, onSaved }) => {
  const { settings } = useSettings();
  const [mode, setMode] = useState("single");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [form, setForm] = useState(() => initialForm(media, defaultType));
  const [file, setFile] = useState(null);
  const [useImageName, setUseImageName] = useState(
    () => !media && settings.useImageNameByDefault,
  );
  const [preview, setPreview] = useState(media?.imageUrl || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef(null);

  const isEditing = Boolean(media);
  const charsLeft = 300 - form.description.length;
  const availableStatuses = form.type === "game" ? [...statuses, liveStatus] : statuses;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !bulkBusy) {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [bulkBusy, onClose]);

  useEffect(() => {
    if (!file) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const title = useMemo(
    () => (isEditing ? "Edit Entry" : mode === "bulk" ? "Bulk Add" : "Add Entry"),
    [isEditing, mode],
  );

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

  const selectFile = (selected) => {
    if (!selected) {
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setError("Please choose an image file for the poster.");
      return;
    }

    setFile(selected);
    if (useImageName) {
      setField("name", getNameFromFile(selected.name));
    }
    setError("");
    setSuccess("");
  };

  const handleFile = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (!Array.from(event.dataTransfer.types).includes("Files")) {
      return;
    }

    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleUseImageName = (event) => {
    const checked = event.target.checked;
    setUseImageName(checked);

    if (checked && file) {
      setField("name", getNameFromFile(file.name));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const imageUrl = file ? await uploadImage(file) : form.imageUrl;
      const payload = {
        ...form,
        imageUrl,
        rating: form.rating ? Number(form.rating) : null,
      };
      const saved = isEditing ? await updateMedia(media._id, payload) : await createMedia(payload);
      onSaved(saved);

      if (!isEditing && settings.reopenAddAfterSave) {
        setForm(initialForm(null, defaultType));
        setFile(null);
        setPreview("");
        setUseImageName(settings.useImageNameByDefault);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSuccess(`${saved.name} was added. Ready for another entry.`);
      } else {
        onClose();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || apiError.message || "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={bulkBusy ? undefined : onClose}>
      <div
        className={`media-modal${mode === "bulk" ? " bulk-mode" : ""}`}
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
          <button
            className="icon-button"
            type="button"
            aria-label="Close modal"
            disabled={bulkBusy}
            onClick={onClose}
          >
            x
          </button>
        </div>

        {!isEditing && (
          <div className="modal-mode-tabs" role="tablist" aria-label="Add entry mode">
            <button
              className={mode === "single" ? "is-selected" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              disabled={bulkBusy}
              onClick={() => setMode("single")}
            >
              Single entry
            </button>
            <button
              className={mode === "bulk" ? "is-selected" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "bulk"}
              onClick={() => setMode("bulk")}
            >
              Bulk upload
            </button>
          </div>
        )}

        {!isEditing && mode === "bulk" ? (
          <BulkUploadForm
            defaultType={defaultType}
            onBusyChange={setBulkBusy}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
        <form className="media-form" onSubmit={handleSubmit}>
          <div className="name-field">
            <div className="name-field-header">
              <label htmlFor="media-name">Name</label>
              <label className="filename-checkbox">
                <input
                  type="checkbox"
                  checked={useImageName}
                  onChange={handleUseImageName}
                />
                <span>Use image filename</span>
              </label>
            </div>
            <input
              id="media-name"
              required
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Baldur's Gate 3"
              readOnly={useImageName}
            />
          </div>

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

          <label
            className={`drop-zone${isDragging ? " is-dragging" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span>Image</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} />
            {preview ? (
              <div className="poster-preview">
                <img src={preview} alt="Selected poster preview" />
                <strong>{isDragging ? "Drop to replace the poster" : "Drop another image to replace it"}</strong>
              </div>
            ) : (
              <strong>{isDragging ? "Drop the poster here" : "Drag and drop a poster image here"}</strong>
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
          {success && <p className="form-success" role="status">{success}</p>}

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add to Library"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default MediaModal;
