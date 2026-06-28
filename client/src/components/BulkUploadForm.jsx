import { useEffect, useRef, useState } from "react";

import { createMediaBulk } from "../api/media";
import { uploadImage } from "../api/upload";
import { useSettings } from "../context/SettingsContext";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 3;

const mediaTypes = [
  { value: "manga", label: "Manga/Manhwa" },
  { value: "anime", label: "Anime" },
  { value: "game", label: "Game" },
];

const getNameFromFile = (fileName) => fileName.replace(/\.[^/.]+$/, "");
const getFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const BulkUploadForm = ({ defaultType, onBusyChange, onClose, onSaved }) => {
  const { settings } = useSettings();
  const [batchType, setBatchType] = useState(defaultType || "manga");
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dragDepth = useRef(0);
  const nextId = useRef(0);
  const previewUrls = useRef(new Set());
  const fileInputRef = useRef(null);

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    [],
  );

  useEffect(() => {
    onBusyChange(uploading);
  }, [onBusyChange, uploading]);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) {
      return;
    }

    const existingKeys = new Set(items.map((item) => getFileKey(item.file)));
    const uniqueFiles = [];
    const rejected = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} is not an image`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} is larger than 10 MB`);
      } else if (!existingKeys.has(getFileKey(file))) {
        existingKeys.add(getFileKey(file));
        uniqueFiles.push(file);
      }
    }

    const availableSlots = Math.max(0, MAX_FILES - items.length);
    const accepted = uniqueFiles.slice(0, availableSlots);

    if (uniqueFiles.length > availableSlots) {
      rejected.push(`Only ${MAX_FILES} images can be uploaded at once`);
    }

    const newItems = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      nextId.current += 1;

      return {
        id: `${Date.now()}-${nextId.current}`,
        file,
        name: getNameFromFile(file.name),
        type: batchType,
        previewUrl,
        imageUrl: "",
        uploadStatus: "pending",
        uploadError: "",
      };
    });

    setItems((current) => [...current, ...newItems]);
    setError(rejected.length ? rejected.slice(0, 3).join(". ") : "");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const changeBatchType = (type) => {
    setBatchType(type);
    setItems((current) => current.map((item) => ({ ...item, type })));
  };

  const updateItem = (id, changes) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
    setSuccess("");
  };

  const removeItem = (id) => {
    setItems((current) =>
      current.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.previewUrl);
          previewUrls.current.delete(item.previewUrl);
          return false;
        }
        return true;
      }),
    );
    setError("");
    setSuccess("");
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
    if (!uploading) {
      addFiles(event.dataTransfer.files);
    }
  };

  const setItemStatus = (id, uploadStatus, uploadError = "", imageUrl) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              uploadStatus,
              uploadError,
              imageUrl: imageUrl === undefined ? item.imageUrl : imageUrl,
            }
          : item,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length) {
      setError("Choose at least one poster image.");
      return;
    }

    const invalidName = items.find((item) => !item.name.trim());
    if (invalidName) {
      setError("Every entry needs a name.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const queue = items.map((item) => ({ ...item, name: item.name.trim() }));
    const prepared = [];
    let cursor = 0;

    const worker = async () => {
      while (cursor < queue.length) {
        const index = cursor;
        cursor += 1;
        const item = queue[index];
        setItemStatus(item.id, "uploading");

        try {
          const imageUrl = item.imageUrl || (await uploadImage(item.file));
          prepared.push({
            id: item.id,
            previewUrl: item.previewUrl,
            payload: {
              name: item.name,
              type: item.type,
              imageUrl,
              status: "planning",
              rating: null,
              isFavourite: false,
            },
          });
          setItemStatus(item.id, "ready", "", imageUrl);
        } catch (uploadError) {
          setItemStatus(item.id, "failed", uploadError.message || "Upload failed.");
        }
      }
    };

    try {
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, () => worker()),
      );

      if (!prepared.length) {
        setError("None of the images could be uploaded. Review the errors and try again.");
        return;
      }

      const saved = await createMediaBulk(prepared.map((item) => item.payload));
      saved.forEach((item) => onSaved(item));

      const savedIds = new Set(prepared.map((item) => item.id));
      const failedCount = queue.length - prepared.length;

      prepared.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });

      if (failedCount) {
        setItems((current) => current.filter((item) => !savedIds.has(item.id)));
        setSuccess(`${saved.length} entries added. ${failedCount} failed and can be retried.`);
      } else {
        setItems([]);
        setSuccess(`${saved.length} entries were added to your library.`);
        if (!settings.reopenAddAfterSave) {
          onClose();
        }
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || apiError.message || "Could not save the entries.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="media-form bulk-upload-form" onSubmit={handleSubmit}>
      <fieldset disabled={uploading}>
        <legend>Type for this batch</legend>
        <div className="segmented-control">
          {mediaTypes.map((item) => (
            <button
              key={item.value}
              className={batchType === item.value ? "is-selected" : ""}
              type="button"
              onClick={() => changeBatchType(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label
        className={`bulk-drop-zone${isDragging ? " is-dragging" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || items.length >= MAX_FILES}
          onChange={(event) => addFiles(event.target.files)}
        />
        <strong>{isDragging ? "Drop the posters here" : "Drag posters here or choose images"}</strong>
        <small>Up to {MAX_FILES} images, 10 MB each. Names come from filenames.</small>
      </label>

      {items.length > 0 && (
        <section className="bulk-queue" aria-label="Bulk upload queue">
          <div className="bulk-queue-header">
            <strong>{items.length} poster{items.length === 1 ? "" : "s"} ready</strong>
            <span>Planning · Unrated</span>
          </div>

          <div className="bulk-items">
            {items.map((item) => (
              <article className="bulk-item" key={item.id}>
                <img src={item.previewUrl} alt="" />
                <label className="bulk-item-name">
                  <span>Name</span>
                  <input
                    required
                    type="text"
                    value={item.name}
                    disabled={uploading}
                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                  />
                  {item.uploadStatus !== "pending" && (
                    <small className={`bulk-status ${item.uploadStatus}`}>
                      {item.uploadStatus === "uploading" && "Uploading poster..."}
                      {item.uploadStatus === "ready" && "Ready to save"}
                      {item.uploadStatus === "failed" && (item.uploadError || "Upload failed")}
                    </small>
                  )}
                </label>
                <label className="bulk-item-type">
                  <span>Type</span>
                  <select
                    value={item.type}
                    disabled={uploading}
                    onChange={(event) => updateItem(item.id, { type: event.target.value })}
                  >
                    {mediaTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="icon-button bulk-remove"
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  disabled={uploading}
                  onClick={() => removeItem(item.id)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success" role="status">{success}</p>}

      <button className="primary-button" type="submit" disabled={uploading || !items.length}>
        {uploading ? "Uploading..." : items.length ? `Add ${items.length} to Library` : "Add to Library"}
      </button>
    </form>
  );
};

export default BulkUploadForm;
