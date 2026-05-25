import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import bookmarkIcon from "../assets/icon/bookmark-icon.svg";
import checkIcon from "../assets/icon/check-icon.svg";
import clockIcon from "../assets/icon/clock-icon.svg";
import closeIcon from "../assets/icon/close-icon.svg";
import facebookIcon from "../assets/icon/facebook-icon.svg";
import filterIcon from "../assets/icon/sliders-horizontal-icon.svg";
import searchIcon from "../assets/icon/search-line-icon.svg";
import starIcon from "../assets/icon/star-icon.svg";
import twitterIcon from "../assets/icon/twitter-icon.svg";
import youtubeIcon from "../assets/icon/youtube-icon.svg";
import "./WatchlistPage.css";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const readStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const readStorageObject = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
};

const getUserStorageId = (user) => user?.id_user || "guest";
const getMovieWatchlistKey = (user) => `flix_movie_watchlist_${getUserStorageId(user)}`;
const getSeriesWatchlistKey = (user) => `flix_tv_watchlist_${getUserStorageId(user)}`;
const getWatchStatusKey = (user) => `flix_watchlist_status_${getUserStorageId(user)}`;

const getItemKey = (item) => `${item.mediaType}:${item.id}`;

const normalizeItem = (item, mediaType) => ({
  ...item,
  mediaType,
  title: item.title || item.name || item.original_name || "Untitled",
  poster: item.poster || item.poster_url,
  year: item.year || item.releaseLabel?.slice?.(-4) || "-",
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
  const user = useMemo(() => getStoredUser(), []);
  const movieWatchlistKey = useMemo(() => getMovieWatchlistKey(user), [user]);
  const seriesWatchlistKey = useMemo(() => getSeriesWatchlistKey(user), [user]);
  const watchStatusKey = useMemo(() => getWatchStatusKey(user), [user]);

  const [movieWatchlist, setMovieWatchlist] = useState(() =>
    readStorageArray(movieWatchlistKey),
  );
  const [seriesWatchlist, setSeriesWatchlist] = useState(() =>
    readStorageArray(seriesWatchlistKey),
  );
  const [watchStatus, setWatchStatus] = useState(() =>
    readStorageObject(watchStatusKey),
  );
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    localStorage.setItem(movieWatchlistKey, JSON.stringify(movieWatchlist));
  }, [movieWatchlist, movieWatchlistKey]);

  useEffect(() => {
    localStorage.setItem(seriesWatchlistKey, JSON.stringify(seriesWatchlist));
  }, [seriesWatchlist, seriesWatchlistKey]);

  useEffect(() => {
    localStorage.setItem(watchStatusKey, JSON.stringify(watchStatus));
  }, [watchStatus, watchStatusKey]);

  const watchlistItems = useMemo(
    () => [
      ...movieWatchlist.map((item) => normalizeItem(item, "movie")),
      ...seriesWatchlist.map((item) => normalizeItem(item, "tv")),
    ],
    [movieWatchlist, seriesWatchlist],
  );

  const watchedCount = watchlistItems.filter((item) => watchStatus[getItemKey(item)]).length;
  const unwatchedCount = watchlistItems.length - watchedCount;

  const visibleItems = watchlistItems.filter((item) => {
    const itemWatched = Boolean(watchStatus[getItemKey(item)]);
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

  const removeItem = (item) => {
    if (item.mediaType === "movie") {
      setMovieWatchlist((current) =>
        current.filter((movie) => String(movie.id) !== String(item.id)),
      );
    } else {
      setSeriesWatchlist((current) =>
        current.filter((series) => String(series.id) !== String(item.id)),
      );
    }

    setWatchStatus((current) => {
      const nextStatus = { ...current };
      delete nextStatus[getItemKey(item)];
      return nextStatus;
    });
  };

  const toggleWatched = (item) => {
    setWatchStatus((current) => ({
      ...current,
      [getItemKey(item)]: !current[getItemKey(item)],
    }));
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

        {visibleItems.length > 0 ? (
          <div className="watchlist-grid">
            {visibleItems.map((item) => (
              <WatchlistCard
                key={getItemKey(item)}
                item={item}
                watched={Boolean(watchStatus[getItemKey(item)])}
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
