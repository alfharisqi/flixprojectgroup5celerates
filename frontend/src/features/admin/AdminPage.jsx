import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiFilm,
  FiGrid,
  FiLogOut,
  FiMessageSquare,
  FiMoon,
  FiMoreVertical,
  FiSearch,
  FiSettings,
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
  { label: "Dashboard", icon: FiGrid, active: true },
  { label: "Kelola Film", icon: FiFilm },
  { label: "Kelola User", icon: FiUsers },
  { label: "Review", image: reviewIcon },
  { label: "Community", image: communityIcon },
  { label: "Transaksi", image: emptyWalletIcon },
  { label: "Pengaturan", icon: FiSettings }
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

function AdminPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [nightMode, setNightMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableLimit, setTableLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

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

    fetch(`${API_URL}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setDashboard(normalizeDashboard(data?.dashboard || data));
        setDashboardError("");
      })
      .catch(() => {
        if (isMounted) {
          setDashboard(fallbackDashboard);
          setDashboardError("Dashboard belum bisa mengambil data backend.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

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
              <button
                type="button"
                key={item.label}
                className={`admin-nav__item${item.active ? " admin-nav__item--active" : ""}`}
              >
                {item.image ? (
                  <img src={item.image} alt="" className="admin-nav__asset-icon" aria-hidden="true" />
                ) : (
                  <Icon aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
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
              <h1>Dashboard</h1>
            </div>

            <div className="admin-content-head__actions">
              <label className="admin-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Cari..."
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
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
