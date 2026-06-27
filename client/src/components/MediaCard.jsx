import { useState } from "react";

import { deleteMedia, updateMedia } from "../api/media";

const typeLabels = {
  movie: "Movie",
  anime: "Anime",
  game: "Game",
};

const statusLabels = {
  planning: "Planning",
  "in-progress": "In Progress",
  completed: "Completed",
  dropped: "Dropped",
  live: "Live",
};

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getThumbnailUrl = (url) => {
  if (!url || !url.includes("/upload/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/w_400,h_600,c_fill,g_auto/");
};

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M12 3.5l2.74 5.55 6.13.89-4.43 4.32 1.05 6.1L12 17.48l-5.49 2.88 1.05-6.1-4.43-4.32 6.13-.89L12 3.5z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const MediaCard = ({ media, onUpdated, onDeleted, onEdit }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleFavourite = async () => {
    const optimistic = { ...media, isFavourite: !media.isFavourite };
    onUpdated(optimistic);
    setError("");

    try {
      const updated = await updateMedia(media._id, {
        isFavourite: optimistic.isFavourite,
      });
      onUpdated(updated);
    } catch (apiError) {
      onUpdated(media);
      setError(apiError?.response?.data?.message || "Could not update favourite.");
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setIsMenuOpen(true);
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteMedia(media._id);
      onDeleted(media._id);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Could not delete entry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="media-card">
      <div className="poster-frame">
        {media.imageUrl ? (
          <img className="card-poster" src={getThumbnailUrl(media.imageUrl)} alt={media.name} />
        ) : (
          <div className="card-poster poster-placeholder">
            <span>{getInitials(media.name)}</span>
          </div>
        )}

        <span className={`status-dot ${media.status}`} title={statusLabels[media.status]} />

        <button
          className={`favourite-button ${media.isFavourite ? "is-active" : ""}`}
          type="button"
          aria-label={media.isFavourite ? "Remove from favourites" : "Add to favourites"}
          onClick={toggleFavourite}
        >
          <StarIcon filled={media.isFavourite} />
        </button>

        <button
          className="card-menu-button"
          type="button"
          aria-label="Open media options"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          ...
        </button>

        {isMenuOpen && (
          <div className="card-menu">
            <button type="button" onClick={() => onEdit(media)}>
              Edit
            </button>
            <button type="button" className="danger-text" disabled={busy} onClick={handleDelete}>
              {confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          </div>
        )}

        <div className="poster-overlay">
          <p>{media.description || "No description yet."}</p>
          <div className="overlay-meta">
            <span>{statusLabels[media.status]}</span>
            {media.rating ? <strong>{media.rating}/10</strong> : <span>Unrated</span>}
          </div>
        </div>
      </div>

      <div className="card-body">
        <h3>{media.name}</h3>
        <span className="type-badge">{typeLabels[media.type]}</span>
      </div>

      {error && <p className="inline-error">{error}</p>}
    </article>
  );
};

export default MediaCard;
