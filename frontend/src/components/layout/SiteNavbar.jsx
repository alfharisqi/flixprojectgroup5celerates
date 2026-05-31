import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import flixLogo from "@/assets/flix-logo.png";
import searchIcon from "@/assets/icon/search-icon.png";
import chatIcon from "@/assets/icon/chat-icon.png";
import notificationIcon from "@/assets/icon/notification-icon.png";
import profileIcon from "@/assets/icon/profile-icon.png";
import myWatchlistIcon from "@/assets/icon/mywatchlist-icon.png";
import communityIcon from "@/assets/icon/community-icon.png";
import settingIcon from "@/assets/icon/setting-icon.png";
import logoutIcon from "@/assets/icon/logout-icon.png";
import messageCircleIcon from "@/assets/icon/message-circle-icon.svg";
import blueDiamondIcon from "@/assets/icon/bluediamond-icon.png";
import SearchModal from "@/components/ui/SearchModal";
import { resolveMediaUrl } from "@/utils/media";
import "./SiteNavbar.css";

const navItems = [
  { key: "home", label: "Home", to: "/" },
  { key: "movies", label: "Movie", to: "/movies" },
  { key: "tv", label: "TV Series", to: "/tv-series" },
  { key: "genre", label: "Genre", to: "/genre" },
  { key: "community", label: "Community", to: "/community" },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const getActiveKey = (pathname, activeKey) => {
  if (activeKey) return activeKey;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/genre")) return "genre";
  if (pathname.startsWith("/tv-series")) return "tv";
  if (pathname.startsWith("/movie") || pathname.startsWith("/movies")) return "movies";
  if (pathname.startsWith("/community") || pathname.startsWith("/post")) return "community";
  if (pathname.startsWith("/watchlist")) return "";
  return "";
};

const getNotificationCopy = (notification) => {
  const actor = notification.actor_username || "Seseorang";
  const type = notification.notification_type;

  const actionText = {
    post_like: "Menyukai Post Anda",
    post_reaction: "Memberi Reaction ke Post Anda",
    post_share: "Membagikan Post Anda",
    post_comment: "Mengomentari Post Anda",
    comment_reply: "Membalas Komentar Anda",
    poll_vote: "Vote Polling Anda",
  }[type] || "Berinteraksi dengan Anda";

  return { actor, actionText };
};

const formatNotificationTime = (dateValue) => {
  const timestamp = new Date(dateValue).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} d ago`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
};

function SiteNavbar({ mode = "absolute", activeKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const notificationRef = useRef(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const currentActiveKey = getActiveKey(location.pathname, activeKey);
  const userInitial = (user?.username || user?.email || "M").slice(0, 1).toUpperCase();
  const userProfileImageUrl = resolveMediaUrl(user?.profile_image_url);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoadingNotifications(true);

      const response = await fetch(`${API_URL}/api/notifications?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil notifikasi");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unread_count || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [token]);

  const handleToggleNotifications = () => {
    setShowNotifications((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        fetchNotifications();
      }

      return nextValue;
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!token) return;

    try {
      if (!notification.is_read) {
        await fetch(`${API_URL}/api/notifications/${notification.id_notification}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Navigation still matters more than read-state if this request fails.
    }

    setShowNotifications(false);

    if (notification.id_post) {
      navigate(`/post/${notification.id_post}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0) return;

    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
      setUnreadCount(0);
    } catch {
      // Keep the current state if the backend request fails.
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className={`site-navbar site-navbar--${mode}`}>
        <Link className="site-navbar__logo-link" to="/" aria-label="FLIX Home">
          <img className="site-navbar__logo" src={flixLogo} alt="FLIX" />
        </Link>

        <nav className="site-navbar__menu" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              className={currentActiveKey === item.key ? "is-active" : undefined}
              key={item.key}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-navbar__actions">
          <button
            className="site-navbar__icon-button"
            type="button"
            aria-label="Search"
            onClick={handleSearch}
          >
            <img src={searchIcon} alt="" />
          </button>

          {token ? (
            <>
              <Link
                className="site-navbar__icon-button site-navbar__icon-button--plain"
                to="/community"
                aria-label="Messages"
              >
                <img src={chatIcon} alt="" />
              </Link>

              <div className="site-navbar__notification" ref={notificationRef}>
                <button
                  className="site-navbar__icon-button site-navbar__icon-button--plain"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={handleToggleNotifications}
                >
                  <img src={notificationIcon} alt="" />
                  {unreadCount > 0 && (
                    <span
                      className="site-navbar__notification-badge"
                      aria-label={`${unreadCount} notifikasi belum dibaca`}
                    />
                  )}
                </button>

                {showNotifications && (
                  <section
                    className="site-navbar__notification-panel"
                    aria-label="Notifikasi"
                  >
                    <div className="site-navbar__notification-header">
                      <h2>Notifikasi</h2>
                      <button
                        type="button"
                        aria-label="Tutup notifikasi"
                        onClick={() => setShowNotifications(false)}
                      >
                        ×
                      </button>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        className="site-navbar__notification-read-all"
                        type="button"
                        onClick={handleMarkAllRead}
                      >
                        Tandai semua dibaca
                      </button>
                    )}

                    <div className="site-navbar__notification-list">
                      {isLoadingNotifications ? (
                        <p className="site-navbar__notification-empty">
                          Memuat notifikasi...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="site-navbar__notification-empty">
                          Belum ada notifikasi.
                        </p>
                      ) : (
                        notifications.map((notification) => {
                          const { actor, actionText } =
                            getNotificationCopy(notification);

                          return (
                            <button
                              className={
                                notification.is_read
                                  ? "site-navbar__notification-item is-read"
                                  : "site-navbar__notification-item"
                              }
                              type="button"
                              key={notification.id_notification}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <span
                                className="site-navbar__notification-dot"
                                aria-hidden="true"
                              />
                              <span className="site-navbar__notification-icon">
                                <img src={messageCircleIcon} alt="" />
                              </span>
                              <span className="site-navbar__notification-text">
                                <span>
                                  <strong>{actor}</strong> {actionText}
                                </span>
                                {notification.post_title && (
                                  <small>{notification.post_title}</small>
                                )}
                              </span>
                              <time dateTime={notification.created_at}>
                                {formatNotificationTime(notification.created_at)}
                              </time>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </section>
                )}
              </div>

              <details className="site-navbar__user-menu">
                <summary aria-label="User menu">
                  <span
                    className={
                      userProfileImageUrl
                        ? "site-navbar__avatar has-image"
                        : "site-navbar__avatar"
                    }
                  >
                    {userProfileImageUrl ? (
                      <img src={userProfileImageUrl} alt={user?.username || "Profile"} />
                    ) : (
                      userInitial
                    )}
                  </span>
                </summary>
                <div className="site-navbar__user-popover">
                  <Link className="site-navbar__profile-item" to="/profile">
                    <img src={profileIcon} alt="" />
                    <span>Profile</span>
                  </Link>

                  <Link className="site-navbar__profile-item" to="/watchlist">
                    <img src={myWatchlistIcon} alt="" />
                    <span>Watchlist</span>
                  </Link>

                  <Link className="site-navbar__profile-item" to="/community">
                    <img src={communityIcon} alt="" />
                    <span>Community</span>
                    <span className="site-navbar__pro-badge">
                      <img src={blueDiamondIcon} alt="" />
                      Pro
                    </span>
                  </Link>

                  <Link className="site-navbar__profile-item" to="/profile">
                    <img src={settingIcon} alt="" />
                    <span>Settings</span>
                  </Link>

                  {user?.role === "moderator" && (
                    <Link className="site-navbar__profile-item" to="/moderator">
                      <img src={settingIcon} alt="" />
                      <span>Moderator</span>
                    </Link>
                  )}

                  {user?.role === "admin" && (
                    <Link className="site-navbar__profile-item" to="/admin">
                      <img src={settingIcon} alt="" />
                      <span>Admin</span>
                    </Link>
                  )}

                  <div className="site-navbar__profile-divider" aria-hidden="true" />

                  <button
                    className="site-navbar__profile-item site-navbar__profile-item--logout"
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    <img src={logoutIcon} alt="" />
                    <span>Logout</span>
                  </button>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link className="site-navbar__login" to="/login">
                Login
              </Link>
              <Link className="site-navbar__signin" to="/register">
                Sign In
              </Link>
            </>
          )}
        </div>
      </header>

      <SearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {showLogoutConfirm && (
        <div
          className="logout-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutConfirm(false);
            }
          }}
        >
          <section className="logout-confirm__panel">
            <h2 id="logout-confirm-title">Apakah Anda yakin ingin keluar?</h2>
            <div className="logout-confirm__actions">
              <button
                type="button"
                className="logout-confirm__logout"
                onClick={handleLogout}
              >
                Logout
              </button>
              <button
                type="button"
                className="logout-confirm__cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Batal
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default SiteNavbar;
