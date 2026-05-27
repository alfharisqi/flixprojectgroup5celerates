import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaBookmark,
  FaCheck,
  FaClock,
  FaFilter,
  FaRegBookmark,
  FaSearch,
  FaStar,
  FaTimes,
} from "react-icons/fa";
import SiteNavbar from "../../components/layout/SiteNavbar";
import "./Watchlist.css";

const apiUrl = import.meta.env.VITE_API_URL;

const filters = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Belum Ditonton" },
  { key: "watched", label: "Sudah Ditonton" },
];

const getYear = (date) => date?.slice(0, 4) || "-";

const formatRating = (rating) => {
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating)) {
    return "0.0";
  }

  return (numericRating / 2).toFixed(1);
};

function Watchlist() {
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, watched: 0, pending: 0 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredItems = useMemo(() => items, [items]);

  const fetchWatchlist = async () => {
    const params = {};

    if (activeFilter !== "all") {
      params.status = activeFilter;
    }

    if (search.trim()) {
      params.search = search.trim();
    }

    const res = await axios.get(`${apiUrl}/api/watchlist`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setItems(res.data.items || []);
    setSummary(res.data.summary || { total: 0, watched: 0, pending: 0 });
  };

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        await fetchWatchlist();
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Gagal memuat watchlist");
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [activeFilter, search]);

  const updateStatus = async (item, status) => {
    await axios.patch(
      `${apiUrl}/api/watchlist/${item.id_watchlist}`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await fetchWatchlist();
  };

  const removeItem = async (item) => {
    await axios.delete(`${apiUrl}/api/watchlist/${item.id_watchlist}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await fetchWatchlist();
  };

  return (
    <main className="watchlist-page">
      <SiteNavbar mode="static" />

      <section className="watchlist-hero">
        <div className="watchlist-container">
          <div className="watchlist-eyebrow">
            <FaRegBookmark />
            <span>MY COLLECTION</span>
          </div>

          <h1>
            Watchlist <span>Saya</span>
          </h1>
        
          <p>Film & series yang ingin kamu tonton.</p>

          <div className="watchlist-toolbar">
            <div className="watchlist-stats">
              <article>
                <div>
                  <strong>{summary.total || 0}</strong>
                  <span>Film Tersimpan</span>
                </div>
                <FaBookmark />
              </article>
              <article>
                <div>
                  <strong>{summary.watched || 0}</strong>
                  <span>Sudah Ditonton</span>
                </div>
                <FaCheck />
              </article>
              <article>
                <div>
                  <strong>{summary.pending || 0}</strong>
                  <span>Belum Ditonton</span>
                </div>
                <FaClock />
              </article>
            </div>

            <div className="watchlist-search-group">
              <label className="watchlist-search">
                <FaSearch />
                <input
                  type="search"
                  placeholder="Cari Film di Watchlist..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <button className="watchlist-filter-button" type="button">
                <FaFilter />
                Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="watchlist-content">
        <div className="watchlist-container">
          <div className="watchlist-tabs" role="tablist" aria-label="Filter watchlist">
            {filters.map((filter) => {
              const count =
                filter.key === "all" ? summary.total : summary[filter.key] || 0;

              return (
                <button
                  className={activeFilter === filter.key ? "is-active" : ""}
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                  <span>{count || 0}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="watchlist-state">Memuat watchlist...</p>
          ) : errorMessage ? (
            <p className="watchlist-state">{errorMessage}</p>
          ) : filteredItems.length > 0 ? (
            <div className="watchlist-grid">
              {filteredItems.map((item) => {
                const detailUrl =
                  item.media_type === "tv"
                    ? `/tv-series/${item.tmdb_id}`
                    : `/movie/${item.tmdb_id}`;

                return (
                  <article className="watchlist-card" key={item.id_watchlist}>
                    <Link className="watchlist-card__poster" to={detailUrl}>
                      <img
                        src={item.poster_url || "https://placehold.co/320x480/141414/ffffff?text=FLIX"}
                        alt={item.title}
                      />
                      <span>{item.media_type === "tv" ? "TV Series" : "Movie"}</span>
                    </Link>

                    <div className="watchlist-card__body">
                      <div>
                        <h2>{item.title}</h2>
                        <p>
                          {getYear(item.release_date)}
                          <span>
                            <FaStar />
                            {formatRating(item.vote_average)}
                          </span>
                        </p>
                      </div>

                      <div className="watchlist-card__actions">
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              item,
                              item.status === "watched" ? "pending" : "watched",
                            )
                          }
                        >
                          {item.status === "watched" ? <FaClock /> : <FaCheck />}
                          {item.status === "watched" ? "Belum Ditonton" : "Sudah Ditonton"}
                        </button>
                        <button
                          className="watchlist-card__remove"
                          type="button"
                          onClick={() => removeItem(item)}
                          aria-label={`Hapus ${item.title} dari watchlist`}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="watchlist-empty">
              <h2>Ayo cari Film dan simpan ke Watchlist</h2>
              <p>Film yang kamu simpan akan muncul disini.</p>
              <Link to="/movies">Cari Film</Link>
            </div>
          )}
        </div>
      </section>

      <footer className="watchlist-footer">
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/movies">Movie</Link>
          <Link to="/tv-series">TV Series</Link>
          <Link to="/genre">Genre</Link>
          <Link to="/community">Community</Link>
        </nav>
        <p>Copyright 2026 - Kelompok 5</p>
      </footer>
    </main>
  );
}

export default Watchlist;
