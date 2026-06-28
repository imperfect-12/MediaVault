import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getAllMedia } from "../api/media";
import MediaCard from "../components/MediaCard";
import MediaModal from "../components/MediaModal";
import { useAuth } from "../context/AuthContext";

const sections = [
  { type: "manga", title: "Manga & Manhwa", path: "/manga" },
  { type: "anime", title: "Anime", path: "/anime" },
  { type: "game", title: "Games", path: "/games" },
];

const filterOptions = [
  { value: "all", label: "All" },
  { value: "manga", label: "Manga" },
  { value: "anime", label: "Anime" },
  { value: "game", label: "Games" },
];

const HomePage = () => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [favouriteType, setFavouriteType] = useState("all");

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        setMedia(await getAllMedia());
      } catch (apiError) {
        setError(apiError?.response?.data?.message || "Could not load your library.");
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, []);

  const favourites = useMemo(
    () =>
      media.filter(
        (item) => item.isFavourite && (favouriteType === "all" || item.type === favouriteType),
      ),
    [media, favouriteType],
  );

  const counts = useMemo(
    () =>
      media.reduce(
        (acc, item) => ({
          ...acc,
          [item.type]: acc[item.type] + 1,
        }),
        { manga: 0, anime: 0, game: 0 },
      ),
    [media],
  );

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
      <section className="home-hero">
        <p className="eyebrow">Private media library</p>
        <h1>Your Library, {user?.username}</h1>
        <p>
          A dark shelf for the manga, manhwa, anime, and games you are reading,
          watching, playing, and finishing.
        </p>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="content-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Pinned shelf</p>
            <h2>Favourites</h2>
          </div>
          <div className="filter-pills" aria-label="Favourite type filters">
            {filterOptions.map((item) => (
              <button
                key={item.value}
                className={favouriteType === item.value ? "is-selected" : ""}
                type="button"
                onClick={() => setFavouriteType(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="section-loader">Loading your favourites...</div>
        ) : favourites.length ? (
          <div className="horizontal-row">
            {favourites.map((item) => (
              <MediaCard
                key={item._id}
                media={item}
                onUpdated={updateItem}
                onDeleted={deleteItem}
                onEdit={openEdit}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Star something to see it here.</div>
        )}
      </section>

      {sections.map((section) => {
        const items = media.filter((item) => item.type === section.type).slice(0, 4);

        return (
          <section className="content-section" key={section.type}>
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">{counts[section.type]} entries</p>
                <h2>{section.title}</h2>
              </div>
              <Link className="section-link" to={section.path}>
                See all
              </Link>
            </div>

            {items.length ? (
              <div className="media-grid preview-grid">
                {items.map((item) => (
                  <MediaCard
                    key={item._id}
                    media={item}
                    onUpdated={updateItem}
                    onDeleted={deleteItem}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">Nothing logged here yet.</div>
            )}
          </section>
        );
      })}

      <button className="floating-add" type="button" onClick={() => setModalOpen(true)}>
        +
      </button>

      {modalOpen && <MediaModal media={editingMedia} onClose={closeModal} onSaved={saveItem} />}
    </main>
  );
};

export default HomePage;
