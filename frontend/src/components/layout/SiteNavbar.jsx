import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import flixLogo from "../../assets/flix-logo.png";
import searchIcon from "../../assets/icon/search-icon.png";
import chatIcon from "../../assets/icon/chat-icon.png";
import notificationIcon from "../../assets/icon/notification-icon.png";
import profileIcon from "../../assets/icon/profile-icon.png";
import myWatchlistIcon from "../../assets/icon/mywatchlist-icon.png";
import communityIcon from "../../assets/icon/community-icon.png";
import settingIcon from "../../assets/icon/setting-icon.png";
import logoutIcon from "../../assets/icon/logout-icon.png";
import blueDiamondIcon from "../../assets/icon/bluediamond-icon.png";
import SearchModal from "../search/SearchModal";
import "./SiteNavbar.css";

const navItems = [
  { key: "home", label: "Home", to: "/" },
  { key: "movies", label: "Movie", to: "/movies" },
  { key: "tv", label: "TV Series", to: "/tv-series" },
  { key: "genre", label: "Genre", to: "/genre" },
  { key: "community", label: "Community", to: "/community" },
];

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatRelativeTime = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
};

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

function SiteNavbar({ mode = "absolute", activeKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activePopover, setActivePopover] = useState("");
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const currentActiveKey = getActiveKey(location.pathname, activeKey);
  const userInitial = (user?.username || user?.email || "M").slice(0, 1).toUpperCase();
  const unreadMessages = conversations.reduce(
    (total, conversation) => total + Number(conversation.unread_count || 0),
    0,
  );
  const unreadNotifications = notifications.filter((notification) => !notification.read_at).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleSearch = () => {
    setShowSearchModal(true);
    setActivePopover("");
  };

  useEffect(() => {
    let shouldIgnore = false;

    const loadNavbarData = async () => {
      await Promise.resolve();

      if (!token) {
        if (!shouldIgnore) {
          setConversations([]);
          setNotifications([]);
          setActiveChat(null);
        }
        return;
      }

      try {
        const [conversationResponse, notificationResponse] = await Promise.all([
          fetch(`${apiUrl}/api/chats/conversations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const conversationData = conversationResponse.ok
          ? await conversationResponse.json()
          : { conversations: [] };
        const notificationData = notificationResponse.ok
          ? await notificationResponse.json()
          : { notifications: [] };

        if (!shouldIgnore) {
          setConversations(conversationData.conversations || []);
          setNotifications(notificationData.notifications || []);
        }
      } catch {
        if (!shouldIgnore) {
          setConversations([]);
          setNotifications([]);
        }
      }
    };

    loadNavbarData();

    return () => {
      shouldIgnore = true;
    };
  }, [token]);

  const openPrivateChat = async (conversation) => {
    if (!token) {
      return;
    }

    try {
      setActivePopover("");
      setActiveChat(conversation);
      setChatLoading(true);
      setChatError("");

      const response = await fetch(`${apiUrl}/api/chats/${conversation.user_id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuka chat");
      }

      setActiveChat(data.user || conversation);
      setChatMessages(data.messages || []);
      setConversations((currentConversations) =>
        currentConversations.map((item) =>
          Number(item.user_id) === Number(conversation.user_id)
            ? { ...item, unread_count: 0 }
            : item,
        ),
      );
    } catch (error) {
      setChatError(error.message || "Gagal membuka chat");
    } finally {
      setChatLoading(false);
    }
  };

  const sendPrivateMessage = async (event) => {
    event.preventDefault();

    if (!token || !activeChat || !chatDraft.trim()) {
      return;
    }

    try {
      setChatError("");
      const response = await fetch(`${apiUrl}/api/chats/${activeChat.user_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: chatDraft.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim pesan");
      }

      setChatMessages((currentMessages) => [...currentMessages, data.item]);
      setConversations((currentConversations) => {
        const updatedConversation = {
          ...activeChat,
          last_message: data.item.message,
          last_message_at: data.item.created_at,
          unread_count: 0,
        };
        const withoutCurrent = currentConversations.filter(
          (item) => Number(item.user_id) !== Number(activeChat.user_id),
        );

        return [updatedConversation, ...withoutCurrent];
      });
      setChatDraft("");
    } catch (error) {
      setChatError(error.message || "Gagal mengirim pesan");
    }
  };

  const openNotification = async (notification) => {
    if (token && !notification.read_at) {
      fetch(`${apiUrl}/api/notifications/${notification.id_notification}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id_notification === notification.id_notification
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
    }

    setActivePopover("");
    navigate(notification.link_url || "/profile");
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
              <div className="site-navbar__popover-host">
                <button
                  className="site-navbar__icon-button site-navbar__icon-button--plain"
                  type="button"
                  aria-label="Messages"
                  aria-expanded={activePopover === "messages"}
                  onClick={() =>
                    setActivePopover((currentPopover) =>
                      currentPopover === "messages" ? "" : "messages",
                    )
                  }
                >
                  <img src={chatIcon} alt="" />
                  {unreadMessages > 0 && <span className="site-navbar__dot" />}
                </button>

                {activePopover === "messages" && (
                  <section className="site-navbar__quick-popover" aria-label="Messages">
                    <div className="site-navbar__quick-header">
                      <strong>Message</strong>
                      <span>{conversations.length}</span>
                    </div>

                    {conversations.length > 0 ? (
                      <div className="site-navbar__quick-list">
                        {conversations.map((conversation) => (
                          <button
                            className="site-navbar__quick-item"
                            key={conversation.user_id}
                            type="button"
                            onClick={() => openPrivateChat(conversation)}
                          >
                            <span>{conversation.username.slice(0, 1).toUpperCase()}</span>
                            <div>
                              <strong>{conversation.username}</strong>
                              <p>{conversation.last_message}</p>
                              <small>{formatRelativeTime(conversation.last_message_at)}</small>
                            </div>
                            {conversation.unread_count > 0 && (
                              <em>{conversation.unread_count}</em>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="site-navbar__quick-empty">
                        <strong>Belum ada chat</strong>
                        <p>Chat komunitas dan pesan baru akan muncul di sini.</p>
                      </div>
                    )}
                  </section>
                )}
              </div>

              <div className="site-navbar__popover-host">
                <button
                  className="site-navbar__icon-button site-navbar__icon-button--plain"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={activePopover === "notifications"}
                  onClick={() =>
                    setActivePopover((currentPopover) =>
                      currentPopover === "notifications" ? "" : "notifications",
                    )
                  }
                >
                  <img src={notificationIcon} alt="" />
                  {unreadNotifications > 0 && <span className="site-navbar__dot" />}
                </button>

                {activePopover === "notifications" && (
                  <section
                    className="site-navbar__quick-popover"
                    aria-label="Notifications"
                  >
                    <div className="site-navbar__quick-header">
                      <strong>Notification</strong>
                      <span>{notifications.length}</span>
                    </div>

                    {notifications.length > 0 ? (
                      <div className="site-navbar__quick-list">
                        {notifications.map((notification) => (
                          <button
                            className="site-navbar__quick-item"
                            key={notification.id_notification}
                            type="button"
                            onClick={() => openNotification(notification)}
                          >
                            <span>{notification.title.slice(0, 1)}</span>
                            <div>
                              <strong>{notification.title}</strong>
                              <p>{notification.message}</p>
                              <small>{formatRelativeTime(notification.created_at)}</small>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="site-navbar__quick-empty">
                        <strong>Belum ada notif</strong>
                        <p>Update akun dan aktivitas FLIX akan muncul di sini.</p>
                      </div>
                    )}
                  </section>
                )}
              </div>

              <details className="site-navbar__user-menu">
                <summary aria-label="User menu">
                  <span className="site-navbar__avatar">{userInitial}</span>
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

      {activeChat && (
        <section className="private-chat" aria-label={`Chat dengan ${activeChat.username}`}>
          <header className="private-chat__header">
            <span>{activeChat.username?.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{activeChat.username}</strong>
              <small>{activeChat.email || "Private chat"}</small>
            </div>
            <button type="button" onClick={() => setActiveChat(null)} aria-label="Tutup chat">
              x
            </button>
          </header>

          <div className="private-chat__body">
            {chatLoading ? (
              <p className="private-chat__state">Memuat chat...</p>
            ) : chatMessages.length > 0 ? (
              chatMessages.map((message) => (
                <article
                  className={`private-chat__bubble ${
                    message.is_mine ? "is-mine" : ""
                  }`}
                  key={message.id_message}
                >
                  <p>{message.message}</p>
                  <small>{formatRelativeTime(message.created_at)}</small>
                </article>
              ))
            ) : (
              <p className="private-chat__state">Belum ada pesan. Mulai percakapan.</p>
            )}
          </div>

          {chatError && <p className="private-chat__error">{chatError}</p>}

          <form className="private-chat__composer" onSubmit={sendPrivateMessage}>
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
            />
            <button type="submit">Kirim</button>
          </form>
        </section>
      )}
    </>
  );
}

export default SiteNavbar;
