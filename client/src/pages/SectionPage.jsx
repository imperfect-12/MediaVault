import { useEffect, useMemo, useState } from "react";

import { getAllMedia } from "../api/media";
import MediaCard from "../components/MediaCard";
import MediaModal from "../components/MediaModal";

const sorters = {
  recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  favourites: (a, b) => Number(b.isFavourite) - Number(a.isFavourite),
};

const SectionPage = ({ type, title, subtitle }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        setMedia(await getAllMedia(type));
      } catch (apiError) {
        setError(apiError?.response?.data?.message || `Could not load ${title.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [type, title]);

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...media]
      .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      .sort(sorters[sort]);
  }, [media, query, sort]);

  const updateItem = (updated) => {
    setMedia((current) => current.map((item) => (item._id === updated._id ? updated : item)));
  };

  const deleteItem = (id) => {
    setMedia((current) => current.filter((item) => item._id !== id));
  };

  const saveItem = (saved) => {
    setMedia((current) => {
      const exists = current.some((item) => item._id === saved._id);
      return exists
        ? current.map((item) => (item._id === saved._id ? saved : item))
        : [saved, ...current];
    });
    setEditingMedia(null);
  };

  const openEdit = (item) => {
    setEditingMedia(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMedia(null);
  };

  return (
    <main className="app-main">
      <section className="page-header">
        <div>
          <p className="eyebrow">{media.length} entries</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="primary-button compact" type="button" onClick={() => setModalOpen(true)}>
          + Add
        </button>
      </section>

      <section className="toolbar sticky-toolbar">
        <label className="search-field">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
          />
        </label>

        <label className="sort-field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Recently Added</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Rating</option>
            <option value="favourites">Favourites First</option>
          </select>
        </label>
      </section>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="section-loader">Loading {title.toLowerCase()}...</div>
      ) : filteredMedia.length ? (
        <section className="media-grid">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item._id}
              media={item}
              onUpdated={updateItem}
              onDeleted={deleteItem}
              onEdit={openEdit}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state illustrated">
          <div className="empty-illustration">
            <span />
            <span />
            <span />
          </div>
          <p>No entries match this shelf yet.</p>
        </section>
      )}

      {modalOpen && (
        <MediaModal media={editingMedia} defaultType={type} onClose={closeModal} onSaved={saveItem} />
      )}
    </main>
  );
};

export default SectionPage;
