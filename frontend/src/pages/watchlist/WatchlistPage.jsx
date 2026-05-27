import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../../components/layout/SiteNavbar";
import bookmarkIcon from "../../assets/icon/bookmark-icon.svg";
import checkIcon from "../../assets/icon/check-icon.svg";
import clockIcon from "../../assets/icon/clock-icon.svg";
import closeIcon from "../../assets/icon/close-icon.svg";
import facebookIcon from "../../assets/icon/facebook-icon.svg";
import filterIcon from "../../assets/icon/sliders-horizontal-icon.svg";
import searchIcon from "../../assets/icon/search-line-icon.svg";
import starIcon from "../../assets/icon/star-icon.svg";
import twitterIcon from "../../assets/icon/twitter-icon.svg";
import youtubeIcon from "../../assets/icon/youtube-icon.svg";
import {
  deleteWatchlistItem,
  fetchWatchlist,
  addWatchlistItem,
  mapMovieToWatchlistPayload,
  mapSeriesToWatchlistPayload,
  updateWatchlistItemStatus,
} from "../../utils/watchlist";
import "./WatchlistPage.css";

const readStoredJson = (key, fallbackValue) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const getStoredUser = () => readStoredJson("user", null);

const getLegacyWatchlistItems = () => {
  const user = getStoredUser();
  const userId = user?.id_user || "guest";
  const movies = readStoredJson(`flix_movie_watchlist_${userId}`, []);
  const series = readStoredJson(`flix_tv_watchlist_${userId}`, []);

  return [
    ...movies.map((item) => ({ mediaType: "movie", item })),
    ...series.map((item) => ({ mediaType: "tv", item })),
  ].filter(({ item }) => Number.isInteger(Number(item?.id)));
};

const syncLegacyWatchlist = async (token) => {
  const legacyItems = getLegacyWatchlistItems();

  if (legacyItems.length === 0) {
    return false;
  }

  const results = await Promise.allSettled(
    legacyItems.map(({ mediaType, item }) =>
      addWatchlistItem({
        token,
        payload:
          mediaType === "tv"
            ? mapSeriesToWatchlistPayload(item)
            : mapMovieToWatchlistPayload(item),
      }),
    ),
  );

  return results.some((result) => result.status === "fulfilled");
};

const normalizeItem = (item, mediaType) => ({
  ...item,
  mediaType: item.mediaType || item.media_type || mediaType,
  title: item.title || item.name || item.original_name || "Untitled",
  poster: item.poster || item.poster_url || "https://placehold.co/300x450/141414/ffffff?text=FLIX",
  year: item.year || item.release_date?.slice?.(0, 4) || item.releaseLabel?.slice?.(0, 4) || "-",
  rating: item.rating || "-",
  overview: item.overview || "Deskripsi belum tersedia.",
});

function WatchlistCard({ item, watched, onOpen, onToggleWatched, onRemove }) {
  return (
    <article className="watchlist-card">
      <button
        className="watchlist-card__poster"
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Buka detail ${item.title}`}
      >
        <img src={item.poster} alt={item.title} />
        <span className={watched ? "is-watched" : ""}>
          {watched ? "Sudah Ditonton" : "Belum Ditonton"}
        </span>
      </button>

      <div className="watchlist-card__body">
        <p>{item.mediaType === "tv" ? "TV Series" : "Film"}</p>
        <h3>{item.title}</h3>
        <div className="watchlist-card__meta">
          <span>{item.year}</span>
          <span>
            <img src={starIcon} alt="" />
            {item.rating}
          </span>
        </div>
      </div>

      <div className="watchlist-card__actions">
        <button
          type="button"
          onClick={() => onToggleWatched(item)}
          className={watched ? "is-active" : ""}
        >
          <img src={watched ? checkIcon : clockIcon} alt="" />
          {watched ? "Sudah ditonton" : "Tandai ditonton"}
        </button>
        <button type="button" onClick={() => onRemove(item)} aria-label="Hapus dari watchlist">
          <img src={closeIcon} alt="" />
        </button>
      </div>
    </article>
  );
}

function WatchlistPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!token) {
        setWatchlistItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        const data = await fetchWatchlist({ token });
        const didSyncLegacy = await syncLegacyWatchlist(token);
        const latestData = didSyncLegacy ? await fetchWatchlist({ token }) : data;

        setWatchlistItems(latestData.items.map((item) => normalizeItem(item)));
      } catch (error) {
        setErrorMessage(error.message || "Gagal memuat watchlist");
        setWatchlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [token]);

  const watchedCount = watchlistItems.filter((item) => item.status === "watched").length;
  const unwatchedCount = watchlistItems.length - watchedCount;

  const visibleItems = watchlistItems.filter((item) => {
    const itemWatched = item.status === "watched";
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "watched" && itemWatched) ||
      (activeTab === "unwatched" && !itemWatched);
    const matchesMedia = mediaFilter === "all" || item.mediaType === mediaFilter;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return matchesTab && matchesMedia && matchesSearch;
  });

  const removeItem = async (item) => {
    if (!token || !item.id_watchlist) {
      return;
    }

    await deleteWatchlistItem({ token, idWatchlist: item.id_watchlist });
    setWatchlistItems((current) =>
      current.filter((watchlistItem) => watchlistItem.id_watchlist !== item.id_watchlist),
    );
  };

  const toggleWatched = async (item) => {
    if (!token || !item.id_watchlist) {
      return;
    }

    const nextStatus = item.status === "watched" ? "pending" : "watched";
    const updatedItem = await updateWatchlistItemStatus({
      token,
      idWatchlist: item.id_watchlist,
      status: nextStatus,
    });

    setWatchlistItems((current) =>
      current.map((watchlistItem) =>
        watchlistItem.id_watchlist === item.id_watchlist
          ? normalizeItem(updatedItem)
          : watchlistItem,
      ),
    );
  };

  const openDetail = (item) => {
    navigate(item.mediaType === "tv" ? `/tv-series/${item.id}` : `/movie/${item.id}`);
  };

  const tabs = [
    { key: "all", label: "Semua", count: watchlistItems.length },
    { key: "unwatched", label: "Belum Ditonton", count: unwatchedCount },
    { key: "watched", label: "Sudah Ditonton", count: watchedCount },
  ];

  return (
    <main className="watchlist-page">
      <SiteNavbar mode="fixed" />

      <section className="watchlist-hero">
        <div className="watchlist-eyebrow">
          <span />
          My Collection
        </div>
        <h1>
          Watchlist <strong>Saya</strong>
        </h1>
        <p>Film &amp; series yang ingin kamu tonton.</p>

        <div className="watchlist-dashboard">
          <div className="watchlist-stat-card">
            <strong>{watchlistItems.length}</strong>
            <span>Film Tersimpan</span>
            <img src={bookmarkIcon} alt="" />
          </div>
          <div className="watchlist-stat-card">
            <strong>{watchedCount}</strong>
            <span>Sudah Ditonton</span>
            <img src={checkIcon} alt="" />
          </div>
          <div className="watchlist-stat-card">
            <strong>{unwatchedCount}</strong>
            <span>Belum Ditonton</span>
            <img src={clockIcon} alt="" />
          </div>

          <div className="watchlist-tools">
            <label>
              <img src={searchIcon} alt="" />
              <input
                type="search"
                placeholder="Cari Film di Watchlist..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className="watchlist-filter">
              <button type="button" onClick={() => setShowFilter((current) => !current)}>
                <img src={filterIcon} alt="" />
                Filter
              </button>
              {showFilter && (
                <div className="watchlist-filter__menu">
                  {[
                    ["all", "Semua"],
                    ["movie", "Film"],
                    ["tv", "TV Series"],
                  ].map(([value, label]) => (
                    <button
                      className={mediaFilter === value ? "is-active" : ""}
                      key={value}
                      type="button"
                      onClick={() => {
                        setMediaFilter(value);
                        setShowFilter(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="watchlist-content">
        <div className="watchlist-tabs" role="tablist" aria-label="Filter status watchlist">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.key ? "is-active" : ""}
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="watchlist-empty">
            <h2>Memuat watchlist...</h2>
          </div>
        ) : errorMessage ? (
          <div className="watchlist-empty">
            <h2>{errorMessage}</h2>
            <button type="button" onClick={() => window.location.reload()}>
              Muat Ulang
            </button>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="watchlist-grid">
            {visibleItems.map((item) => (
              <WatchlistCard
                key={`${item.mediaType}:${item.id}`}
                item={item}
                watched={item.status === "watched"}
                onOpen={openDetail}
                onToggleWatched={toggleWatched}
                onRemove={removeItem}
              />
            ))}
          </div>
        ) : (
          <div className="watchlist-empty">
            <h2>Ayo cari Film dan simpan ke Watchlist</h2>
            <p>Film yang kamu simpan akan muncul disini.</p>
            <button type="button" onClick={() => navigate("/movies")}>
              Cari Film
            </button>
          </div>
        )}
      </section>

      <footer className="watchlist-footer">
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/movies">Movie</Link>
          <Link to="/tv-series">TV Series</Link>
          <Link to="/genre">Genre</Link>
          <Link to="/community">Community</Link>
        </nav>
        <div>
          <img src={facebookIcon} alt="Facebook" />
          <img src={twitterIcon} alt="Twitter" />
          <img src={youtubeIcon} alt="YouTube" />
        </div>
        <p>Copyright 2026 - Kelompok 5</p>
      </footer>
    </main>
  );
}

export default WatchlistPage;
