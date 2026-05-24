import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import flixLogo from "../assets/flix-logo.png";
import searchIcon from "../assets/icon/search-icon.png";
import chatIcon from "../assets/icon/chat-icon.png";
import notificationIcon from "../assets/icon/notification-icon.png";
import profileIcon from "../assets/icon/profile-icon.png";
import myWatchlistIcon from "../assets/icon/mywatchlist-icon.png";
import communityIcon from "../assets/icon/community-icon.png";
import settingIcon from "../assets/icon/setting-icon.png";
import logoutIcon from "../assets/icon/logout-icon.png";
import blueDiamondIcon from "../assets/icon/bluediamond-icon.png";
import SearchModal from "./SearchModal";
import "./SiteNavbar.css";

const navItems = [
  { key: "home", label: "Home", to: "/" },
  { key: "movies", label: "Movie", to: "/movies" },
  { key: "tv", label: "TV Series", to: "/tv-series" },
  { key: "genre", label: "Genre", to: "/genre" },
  { key: "community", label: "Community", to: "/community" },
];

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
  return "";
};

function SiteNavbar({ mode = "absolute", activeKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const currentActiveKey = getActiveKey(location.pathname, activeKey);
  const userInitial = (user?.username || user?.email || "M").slice(0, 1).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

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

              <button
                className="site-navbar__icon-button site-navbar__icon-button--plain"
                type="button"
                aria-label="Notifications"
              >
                <img src={notificationIcon} alt="" />
              </button>

              <details className="site-navbar__user-menu">
                <summary aria-label="User menu">
                  <span className="site-navbar__avatar">{userInitial}</span>
                </summary>
                <div className="site-navbar__user-popover">
                  <Link className="site-navbar__profile-item" to="/profile">
                    <img src={profileIcon} alt="" />
                    <span>Profile</span>
                  </Link>

                  <Link className="site-navbar__profile-item" to="/movies">
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
                    onClick={handleLogout}
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
    </>
  );
}

export default SiteNavbar;
