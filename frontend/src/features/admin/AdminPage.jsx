import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiEdit3,
  FiFilm,
  FiFilter,
  FiGrid,
  FiLogOut,
  FiMessageSquare,
  FiMoon,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiSettings,
  FiUploadCloud,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import flixLogo from "@/assets/flix-logo.png";
import flixAdminLogo from "@/assets/flixadmin-logo.png";
import communityIcon from "@/assets/icon/community.png";
import emptyWalletIcon from "@/assets/icon/empty-wallet.png";
import reviewIcon from "@/assets/icon/review-icon.png";
import "./AdminPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fallbackDashboard = {
  stats: [
    { value: "0", label: "Film dan Series Direview" },
    { value: "0", label: "Total User Aktif" },
    { value: "0", label: "Community Post" },
    { value: "0", label: "Laporan Masuk" }
  ],
  chart: [
    { month: "Jan", value: 0 },
    { month: "Feb", value: 0 },
    { month: "Mar", value: 0 },
    { month: "Apr", value: 0 },
    { month: "Mei", value: 0 },
    { month: "Jun", value: 0 },
    { month: "Jul", value: 0 },
    { month: "Agu", value: 0 },
    { month: "Sep", value: 0 },
    { month: "Okt", value: 0 },
    { month: "Nov", value: 0 },
    { month: "Des", value: 0 }
  ],
  activities: [],
  watchlistMovies: []
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "movies", label: "Kelola Film", icon: FiFilm },
  { id: "users", label: "Kelola User", icon: FiUsers },
  { id: "reviews", label: "Review", image: reviewIcon },
  { id: "community", label: "Community", image: communityIcon },
  { id: "transactions", label: "Transaksi", image: emptyWalletIcon },
  { id: "settings", label: "Pengaturan", icon: FiSettings }
];

const activityIcons = {
  user: FiUserPlus,
  review: FiMessageSquare,
  film: FiFilm,
  check: FiCheck,
  community: FiUsers,
  report: FiBell
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

function normalizeDashboard(data) {
  if (!data || typeof data !== "object") {
    return fallbackDashboard;
  }

  return {
    stats: Array.isArray(data.stats) ? data.stats : fallbackDashboard.stats,
    chart: Array.isArray(data.chart) ? data.chart : fallbackDashboard.chart,
    activities: Array.isArray(data.activities) ? data.activities : fallbackDashboard.activities,
    watchlistMovies: Array.isArray(data.watchlistMovies)
      ? data.watchlistMovies
      : fallbackDashboard.watchlistMovies
  };
}

const formatChartNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(Number(value || 0));

const adminMovieStorageKey = "flix_admin_managed_movies";

const defaultAddMovieForm = {
  title: "",
  year: "",
  duration: "",
  director: "",
  synopsis: "",
  cast: "",
  posterUrl: "",
  posterDataUrl: "",
  trailerUrl: "",
  rating: "",
  country: "",
  genres: ["Drama"],
  platforms: ["Netflix"],
  moods: ["Santai"]
};

const genreOptions = [
  "Drama",
  "Thriller",
  "Animasi",
  "Komedi",
  "Adventure",
  "Fantasy",
  "Horror"
];

const platformOptions = [
  "Netflix",
  "Disney+",
  "Prime Video",
  "HBO Max",
  "Apple TV",
  "Vidio",
  "Viu"
];

const moodOptions = [
  "Santai",
  "Seru",
  "Sedih",
  "Romantis",
  "Pikiran Tertantang",
  "Menegangkan"
];

const getStoredAdminMovies = () => {
  try {
    const storedMovies = JSON.parse(localStorage.getItem(adminMovieStorageKey));
    return Array.isArray(storedMovies) ? storedMovies : [];
  } catch {
    return [];
  }
};

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
};

function AdminPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [managedMovies, setManagedMovies] = useState([]);
  const [localAdminMovies, setLocalAdminMovies] = useState(getStoredAdminMovies);
  const [managedMoviesTotal, setManagedMoviesTotal] = useState(0);
  const [activeAdminPage, setActiveAdminPage] = useState("dashboard");
  const [activeMoviePanel, setActiveMoviePanel] = useState("list");
  const [addMovieForm, setAddMovieForm] = useState(defaultAddMovieForm);
  const [addMovieFeedback, setAddMovieFeedback] = useState("");
  const [nightMode, setNightMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableLimit, setTableLimit] = useState(10);
  const [filmPage, setFilmPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [moviesError, setMoviesError] = useState("");

  const user = useMemo(getStoredUser, []);
  const adminName = user?.username || user?.name || "Marsyanda F";
  const avatarLetter = (adminName || "A").charAt(0).toUpperCase();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const [dashboardResponse, moviesResponse] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/movies`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        if (!isMounted) {
          return;
        }

        const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : null;
        const moviesData = moviesResponse.ok ? await moviesResponse.json() : null;

        setDashboard(normalizeDashboard(dashboardData?.dashboard || dashboardData));
        setDashboardError(dashboardResponse.ok ? "" : "Dashboard belum bisa mengambil data backend.");

        setManagedMovies(Array.isArray(moviesData?.movies) ? moviesData.movies : []);
        setManagedMoviesTotal(Number(moviesData?.total || 0));
        setMoviesError(moviesResponse.ok ? "" : "Daftar film admin belum bisa mengambil data backend.");
      } catch {
        if (isMounted) {
          setDashboard(fallbackDashboard);
          setDashboardError("Dashboard belum bisa mengambil data backend.");
          setManagedMovies([]);
          setManagedMoviesTotal(0);
          setMoviesError("Daftar film admin belum bisa mengambil data backend.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const activeNavItem = navItems.find((item) => item.id === activeAdminPage) || navItems[0];
  const adminPageTitle =
    activeAdminPage === "movies" && activeMoviePanel === "add"
      ? "Tambah Film"
      : activeAdminPage === "movies" && activeMoviePanel === "edit"
        ? "Edit Film"
        : activeNavItem.label;

  useEffect(() => {
    setFilmPage(1);
  }, [normalizedSearch, activeAdminPage]);

  useEffect(() => {
    localStorage.setItem(adminMovieStorageKey, JSON.stringify(localAdminMovies));
  }, [localAdminMovies]);

  const filteredActivities = useMemo(() => {
    if (!normalizedSearch) {
      return dashboard.activities;
    }

    return dashboard.activities.filter((activity) =>
      `${activity.title} ${activity.time}`.toLowerCase().includes(normalizedSearch)
    );
  }, [dashboard.activities, normalizedSearch]);

  const filteredWatchlistMovies = useMemo(() => {
    if (!normalizedSearch) {
      return dashboard.watchlistMovies;
    }

    return dashboard.watchlistMovies.filter((movie) =>
      `${movie.title} ${movie.year} ${movie.genre} ${movie.status}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [dashboard.watchlistMovies, normalizedSearch]);

  const visibleWatchlistMovies = filteredWatchlistMovies.slice(0, tableLimit);

  const filteredManagedMovies = useMemo(() => {
    const sourceMovies = [
      ...localAdminMovies,
      ...(managedMovies.length ? managedMovies : dashboard.watchlistMovies)
    ];

    if (!normalizedSearch) {
      return sourceMovies;
    }

    return sourceMovies.filter((movie) =>
      `${movie.title} ${movie.year} ${movie.genre} ${movie.status} ${movie.mediaType}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [dashboard.watchlistMovies, localAdminMovies, managedMovies, normalizedSearch]);

  const filmRowsPerPage = 8;
  const totalFilmPages = Math.max(1, Math.ceil(filteredManagedMovies.length / filmRowsPerPage));
  const currentFilmPage = Math.min(filmPage, totalFilmPages);
  const visibleManagedMovies = filteredManagedMovies.slice(
    (currentFilmPage - 1) * filmRowsPerPage,
    currentFilmPage * filmRowsPerPage
  );
  const backendFilmTotal =
    managedMoviesTotal ||
    (managedMovies.length ? managedMovies.length : dashboard.watchlistMovies.length);
  const filmTotalLabel = localAdminMovies.length + backendFilmTotal;
  const paginationItems = getPaginationItems(currentFilmPage, totalFilmPages);
  const addMoviePosterPreview = addMovieForm.posterDataUrl || addMovieForm.posterUrl;

  const chartItems = useMemo(() => {
    const values = dashboard.chart.map((item) => Number(item.value || 0));
    const maxValue = Math.max(...values, 1);

    return dashboard.chart.map((item) => {
      const value = Number(item.value || 0);
      const barHeight = value > 0 ? Math.max(12, Math.round((value / maxValue) * 100)) : 4;

      return {
        ...item,
        value,
        valueLabel: formatChartNumber(value),
        barHeight,
      };
    });
  }, [dashboard.chart]);

  const cycleTableLimit = () => {
    setTableLimit((currentLimit) => {
      if (currentLimit === 5) {
        return 10;
      }

      if (currentLimit === 10) {
        return 20;
      }

      return 5;
    });
  };

  const handleAdminNavClick = (itemId) => {
    setActiveAdminPage(itemId);

    if (itemId === "movies") {
      setActiveMoviePanel("list");
    }
  };

  const handleAddMovieFieldChange = (field, value) => {
    setAddMovieFeedback("");
    setAddMovieForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const toggleAddMovieOption = (field, value) => {
    setAddMovieFeedback("");
    setAddMovieForm((currentForm) => {
      const currentValues = currentForm[field];
      const hasValue = currentValues.includes(value);
      const nextValues = hasValue
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...currentForm,
        [field]: nextValues.length ? nextValues : [value]
      };
    });
  };

  const handlePosterFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleAddMovieFieldChange("posterDataUrl", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdminMovie = (status) => {
    if (!addMovieForm.title.trim()) {
      setAddMovieFeedback("Judul film wajib diisi sebelum disimpan.");
      return;
    }

    const savedMovie = {
      id: `local-${Date.now()}`,
      mediaType: "movie",
      title: addMovieForm.title.trim(),
      year: addMovieForm.year.trim() || "-",
      genre: addMovieForm.genres.slice(0, 2).join(", ") || "-",
      rating: addMovieForm.rating.trim() || "-",
      watchlist: "0",
      reviewCount: "0",
      status,
      poster: addMoviePosterPreview || null,
      duration: addMovieForm.duration.trim(),
      director: addMovieForm.director.trim(),
      synopsis: addMovieForm.synopsis.trim(),
      cast: addMovieForm.cast.trim(),
      country: addMovieForm.country.trim(),
      platforms: addMovieForm.platforms,
      moods: addMovieForm.moods
    };

    setLocalAdminMovies((currentMovies) => [savedMovie, ...currentMovies]);
    setAddMovieForm(defaultAddMovieForm);
    setAddMovieFeedback(status === "Draf" ? "Draf film tersimpan sementara." : "Film tersimpan sementara.");
    setActiveMoviePanel("list");
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div className="admin-brand">
          <img src={flixAdminLogo} alt="FLIX Admin" className="admin-brand__admin-logo" />
          <Link to="/" className="admin-brand__home-link" aria-label="Kembali ke halaman awal">
            <img src={flixLogo} alt="FLIX" className="admin-brand__flix-logo" />
          </Link>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <div className="admin-nav__group" key={item.id}>
                <button
                  type="button"
                  className={`admin-nav__item${
                    activeAdminPage === item.id ? " admin-nav__item--active" : ""
                  }`}
                  onClick={() => handleAdminNavClick(item.id)}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="admin-nav__asset-icon" aria-hidden="true" />
                  ) : (
                    <Icon aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>

                {item.id === "movies" && activeAdminPage === "movies" && (
                  <div className="admin-nav__submenu" aria-label="Submenu kelola film">
                    <button
                      type="button"
                      className={activeMoviePanel === "add" ? "admin-nav__submenu-item--active" : ""}
                      onClick={() => setActiveMoviePanel("add")}
                    >
                      <FiPlus aria-hidden="true" />
                      <span>Tambah Film</span>
                    </button>
                    <button
                      type="button"
                      className={activeMoviePanel === "edit" ? "admin-nav__submenu-item--active" : ""}
                      onClick={() => setActiveMoviePanel("edit")}
                    >
                      <FiEdit3 aria-hidden="true" />
                      <span>Edit Film</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            <span>Log Out</span>
          </button>

          <label className="admin-night-mode">
            <span>Night Mode</span>
            <input
              type="checkbox"
              checked={nightMode}
              onChange={(event) => setNightMode(event.target.checked)}
            />
            <span className="admin-night-mode__switch">
              <FiMoon aria-hidden="true" />
            </span>
          </label>

          <div className="admin-profile">
            <div className="admin-profile__avatar">{avatarLetter}</div>
            <div className="admin-profile__meta">
              <strong>{adminName}</strong>
              <span>Admin FLIX</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-content">
          <div className="admin-content-head">
            <div>
              <span className="admin-content-head__eyebrow">Admin FLIX</span>
              <h1>{adminPageTitle}</h1>
            </div>

            <div className="admin-content-head__actions">
              <label className="admin-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder={activeAdminPage === "movies" ? "Cari film..." : "Cari..."}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <button type="button" className="admin-icon-button" aria-label="Notifikasi admin">
                <FiBell aria-hidden="true" />
                <span className="admin-icon-button__dot" />
              </button>
            </div>
          </div>

          {activeAdminPage === "movies" ? (
            <section className="admin-manage-film" aria-label="Kelola film">
              {moviesError && <p className="admin-dashboard-alert">{moviesError}</p>}

              {activeMoviePanel === "add" && (
                <section className="admin-add-movie" aria-label="Tambah film baru">
                  <div className="admin-add-movie__head">
                    <div>
                      <h2>Tambah Film Baru</h2>
                      <p>Isi semua informasi film yang ingin ditambahkan.</p>
                    </div>

                    <div className="admin-add-movie__actions">
                      <button type="button" onClick={() => handleSaveAdminMovie("Draf")}>
                        Draf
                      </button>
                      <button
                        type="button"
                        className="admin-add-movie__save"
                        onClick={() => handleSaveAdminMovie("Aktif")}
                      >
                        <FiCheck aria-hidden="true" />
                        Simpan Film
                      </button>
                    </div>
                  </div>

                  {addMovieFeedback && (
                    <p className="admin-add-movie__feedback">{addMovieFeedback}</p>
                  )}

                  <div className="admin-add-movie__grid">
                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Informasi Film</h3>
                      <div className="admin-add-movie__divider" />

                      <label className="admin-add-movie__field">
                        <span>Judul Film</span>
                        <input
                          type="text"
                          placeholder="contoh: Oppenheimer"
                          value={addMovieForm.title}
                          onChange={(event) => handleAddMovieFieldChange("title", event.target.value)}
                        />
                      </label>

                      <div className="admin-add-movie__field-row">
                        <label className="admin-add-movie__field">
                          <span>Tahun Rilis</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="2024"
                            value={addMovieForm.year}
                            onChange={(event) => handleAddMovieFieldChange("year", event.target.value)}
                          />
                        </label>
                        <label className="admin-add-movie__field">
                          <span>Durasi</span>
                          <input
                            type="text"
                            placeholder="contoh: 2j 30m"
                            value={addMovieForm.duration}
                            onChange={(event) => handleAddMovieFieldChange("duration", event.target.value)}
                          />
                        </label>
                      </div>

                      <label className="admin-add-movie__field">
                        <span>Sutradara</span>
                        <input
                          type="text"
                          placeholder="contoh: Christopher Nolan"
                          value={addMovieForm.director}
                          onChange={(event) => handleAddMovieFieldChange("director", event.target.value)}
                        />
                      </label>

                      <label className="admin-add-movie__field">
                        <span>Sinopsis</span>
                        <textarea
                          maxLength={500}
                          placeholder="Tulis sinopsis film di sini..."
                          value={addMovieForm.synopsis}
                          onChange={(event) => handleAddMovieFieldChange("synopsis", event.target.value)}
                        />
                        <small>{addMovieForm.synopsis.length}/500 karakter</small>
                      </label>

                      <label className="admin-add-movie__field">
                        <span>Pemeran Utama</span>
                        <input
                          type="text"
                          placeholder="contoh: Cillian Murphy, Emily Blunt, Matt Damon"
                          value={addMovieForm.cast}
                          onChange={(event) => handleAddMovieFieldChange("cast", event.target.value)}
                        />
                        <small>Pisahkan dengan koma</small>
                      </label>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Poster Film</h3>
                      <label className="admin-add-movie__upload">
                        <input type="file" accept="image/*" onChange={handlePosterFileChange} />
                        {addMoviePosterPreview ? (
                          <img src={addMoviePosterPreview} alt="Preview poster film" />
                        ) : (
                          <span>
                            <FiUploadCloud aria-hidden="true" />
                            Klik untuk upload poster atau drag & drop di sini
                            <small>JPG, PNG, WEBP - Maks 2 MB</small>
                          </span>
                        )}
                      </label>

                      <label className="admin-add-movie__field">
                        <span>URL Poster (Opsional)</span>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={addMovieForm.posterUrl}
                          onChange={(event) => handleAddMovieFieldChange("posterUrl", event.target.value)}
                        />
                      </label>

                      <label className="admin-add-movie__field">
                        <span>URL Trailer</span>
                        <input
                          type="url"
                          placeholder="https://youtube.com/..."
                          value={addMovieForm.trailerUrl}
                          onChange={(event) => handleAddMovieFieldChange("trailerUrl", event.target.value)}
                        />
                      </label>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Genre & Platform Film</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__chip-group">
                        <span>Genre</span>
                        <div>
                          {genreOptions.map((genre) => (
                            <button
                              type="button"
                              key={genre}
                              className={addMovieForm.genres.includes(genre) ? "admin-add-movie__chip--active" : ""}
                              onClick={() => toggleAddMovieOption("genres", genre)}
                            >
                              {genre}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah genre">+</button>
                        </div>
                      </div>

                      <div className="admin-add-movie__chip-group">
                        <span>Platform Tersedia</span>
                        <div>
                          {platformOptions.map((platform) => (
                            <button
                              type="button"
                              key={platform}
                              className={
                                addMovieForm.platforms.includes(platform) ? "admin-add-movie__chip--active" : ""
                              }
                              onClick={() => toggleAddMovieOption("platforms", platform)}
                            >
                              {platform}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah platform">+</button>
                        </div>
                      </div>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Tag Mood</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__chip-group">
                        <span>Pilih mood yang cocok untuk film ini</span>
                        <div>
                          {moodOptions.map((mood) => (
                            <button
                              type="button"
                              key={mood}
                              className={addMovieForm.moods.includes(mood) ? "admin-add-movie__chip--active" : ""}
                              onClick={() => toggleAddMovieOption("moods", mood)}
                            >
                              {mood}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah mood">+</button>
                        </div>
                      </div>
                    </article>

                    <article className="admin-panel admin-add-movie__panel admin-add-movie__panel--rating">
                      <h3>Rating</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__field-row">
                        <label className="admin-add-movie__field">
                          <span>Rating (1-10)</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="8.5"
                            value={addMovieForm.rating}
                            onChange={(event) => handleAddMovieFieldChange("rating", event.target.value)}
                          />
                        </label>
                        <label className="admin-add-movie__field">
                          <span>Negara Asal</span>
                          <input
                            type="text"
                            placeholder="contoh: Amerika Serikat"
                            value={addMovieForm.country}
                            onChange={(event) => handleAddMovieFieldChange("country", event.target.value)}
                          />
                        </label>
                      </div>
                    </article>
                  </div>
                </section>
              )}

              {activeMoviePanel === "edit" && (
                <article className="admin-panel admin-manage-film__card admin-edit-film__card">
                  <div className="admin-manage-film__header">
                    <div>
                      <h2>Edit Film</h2>
                      <p>Pilih film dari daftar, lalu lanjutkan proses edit data.</p>
                    </div>
                  </div>

                  <div className="admin-edit-film__list">
                    {visibleManagedMovies.map((movie) => (
                      <div className="admin-edit-film__item" key={`edit-${movie.mediaType}-${movie.id}`}>
                        <div className="admin-manage-table__movie">
                          <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                          <div>
                            <strong>{movie.title}</strong>
                            <span>{movie.year} - {movie.genre}</span>
                          </div>
                        </div>
                        <button type="button">
                          <FiEdit3 aria-hidden="true" />
                          Edit
                        </button>
                      </div>
                    ))}

                    {!visibleManagedMovies.length && (
                      <p className="admin-empty-state">
                        {isLoading ? "Memuat data film..." : "Belum ada film yang bisa diedit."}
                      </p>
                    )}
                  </div>
                </article>
              )}

              {activeMoviePanel === "list" && (
              <article className="admin-panel admin-manage-film__card">
                <div className="admin-manage-film__header">
                  <div>
                    <h2>Semua Film</h2>
                    <p>Total {isLoading ? "..." : formatChartNumber(filmTotalLabel)} Film terdaftar</p>
                  </div>

                  <div className="admin-manage-film__actions">
                    <button
                      type="button"
                      className="admin-manage-film__add"
                      onClick={() => setActiveMoviePanel("add")}
                    >
                      <FiPlus aria-hidden="true" />
                      Tambah Film
                    </button>
                    <button type="button" className="admin-manage-film__filter">
                      <FiFilter aria-hidden="true" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="admin-manage-table" role="table" aria-label="Semua film admin">
                  <div
                    className="admin-manage-table__row admin-manage-table__row--head"
                    role="row"
                  >
                    <span role="columnheader">No</span>
                    <span role="columnheader">Film</span>
                    <span role="columnheader">Genre</span>
                    <span role="columnheader">Rating</span>
                    <span role="columnheader">Watchlist</span>
                  </div>

                  {visibleManagedMovies.map((movie, index) => (
                    <div
                      className="admin-manage-table__row"
                      role="row"
                      key={`${movie.mediaType}-${movie.id}-${movie.title}`}
                    >
                      <span className="admin-manage-table__no" role="cell">
                        {(currentFilmPage - 1) * filmRowsPerPage + index + 1}
                      </span>
                      <div className="admin-manage-table__movie" role="cell">
                        <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                        <div>
                          <strong>{movie.title}</strong>
                          <span>{movie.year}</span>
                        </div>
                      </div>
                      <span role="cell">{movie.genre}</span>
                      <span className="admin-manage-table__rating" role="cell">
                        <FaStar aria-hidden="true" />
                        {movie.rating}
                      </span>
                      <span role="cell">{movie.watchlist || movie.reviewCount || "0"}</span>
                    </div>
                  ))}

                  {!visibleManagedMovies.length && (
                    <div className="admin-manage-table__empty">
                      {isLoading ? "Memuat data film..." : "Belum ada film yang bisa dikelola."}
                    </div>
                  )}
                </div>

                <div className="admin-manage-pagination" aria-label="Pagination film">
                  <button
                    type="button"
                    aria-label="Halaman sebelumnya"
                    disabled={currentFilmPage === 1}
                    onClick={() => setFilmPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {paginationItems.map((item, index) =>
                    typeof item === "string" ? (
                      <span key={`${item}-${index}`} className="admin-manage-pagination__ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={currentFilmPage === item ? "admin-manage-pagination__active" : ""}
                        onClick={() => setFilmPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Halaman berikutnya"
                    disabled={currentFilmPage === totalFilmPages}
                    onClick={() => setFilmPage((page) => Math.min(totalFilmPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </article>
              )}
            </section>
          ) : (
            <>
              <section className="admin-stats-grid" aria-label="Ringkasan dashboard">
                {dashboard.stats.map((stat) => (
                  <article className="admin-stat-card" key={stat.label}>
                    <strong>{isLoading ? "..." : stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </section>

              {dashboardError && <p className="admin-dashboard-alert">{dashboardError}</p>}

              <section className="admin-dashboard-grid">
                <article className="admin-panel admin-chart-panel">
                  <div className="admin-panel__header admin-panel__header--stacked">
                    <h2>Aktivitas Pengguna</h2>
                    <div className="admin-filter-row">
                      <button type="button">
                        Login
                        <FiChevronDown aria-hidden="true" />
                      </button>
                      <button type="button">
                        2026
                        <FiChevronDown aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="admin-chart" aria-label="Grafik aktivitas pengguna">
                    {chartItems.map((item) => (
                      <div
                        className="admin-chart__item"
                        key={item.month}
                        title={`${item.month}: ${item.valueLabel} aktivitas`}
                      >
                        <span className="admin-chart__value">{item.valueLabel}</span>
                        <span
                          className="admin-chart__bar"
                          style={{ "--bar-height": `${item.barHeight}%` }}
                        />
                        <span className="admin-chart__label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="admin-panel admin-activity-panel">
                  <div className="admin-panel__header">
                    <h2>Aktivitas Terbaru</h2>
                  </div>

                  <div className="admin-activity-list">
                    {filteredActivities.map((activity) => {
                      const Icon = activityIcons[activity.icon] || FiMessageSquare;

                      return (
                        <div className="admin-activity-item" key={`${activity.title}-${activity.time}`}>
                          <div className="admin-activity-item__icon">
                            <Icon aria-hidden="true" />
                          </div>
                          <div className="admin-activity-item__content">
                            <strong>{activity.title}</strong>
                            <span>{activity.time}</span>
                          </div>
                          <button type="button" aria-label={`Menu ${activity.title}`}>
                            <FiMoreVertical aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                    {!filteredActivities.length && (
                      <p className="admin-empty-state">
                        {isLoading ? "Memuat aktivitas..." : "Belum ada aktivitas terbaru."}
                      </p>
                    )}
                  </div>
                </article>
              </section>

              <article className="admin-panel admin-table-panel">
                <div className="admin-table-title">
                  <h2>Film dan Series Paling Banyak Direview</h2>
                  <button type="button" className="admin-table-limit" onClick={cycleTableLimit}>
                    {tableLimit}
                    <FiChevronDown aria-hidden="true" />
                  </button>
                </div>

                <div className="admin-table" role="table" aria-label="Film dan series paling banyak direview">
                  <div className="admin-table__row admin-table__row--head" role="row">
                    <span role="columnheader">No</span>
                    <span role="columnheader">Konten</span>
                    <span role="columnheader">Genre</span>
                    <span role="columnheader">Rating</span>
                    <span role="columnheader">Review</span>
                    <span role="columnheader">Status</span>
                  </div>

                  {visibleWatchlistMovies.map((movie) => (
                    <div className="admin-table__row" role="row" key={`${movie.title}-${movie.no}`}>
                      <span className="admin-table__no" role="cell">
                        {movie.no}
                      </span>
                      <div className="admin-table__movie" role="cell">
                        <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                        <div>
                          <strong>{movie.title}</strong>
                          <span>{movie.year}</span>
                        </div>
                      </div>
                      <span role="cell">{movie.genre}</span>
                      <span className="admin-table__rating" role="cell">
                        <FaStar aria-hidden="true" />
                        {movie.rating}
                      </span>
                      <span role="cell">{movie.watchlist}</span>
                      <span role="cell">
                        <span className="admin-status-pill">{movie.status}</span>
                      </span>
                    </div>
                  ))}
                  {!visibleWatchlistMovies.length && (
                    <div className="admin-table__empty">
                      {isLoading ? "Memuat data konten..." : "Belum ada data review film atau series."}
                    </div>
                  )}
                </div>
              </article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
