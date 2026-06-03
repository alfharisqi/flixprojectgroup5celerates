import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMessageCircle, FiMinus, FiSend, FiTrash2 } from "react-icons/fi";
import flixAdminLogo from "@/assets/flixadmin-logo.png";
import "./FlixChatbot.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const navigationLinks = [
  { label: "Movies", to: "/movies" },
  { label: "Genre", to: "/genre" },
  { label: "Watchlist", to: "/watchlist" },
  { label: "Community", to: "/community" }
];

const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const getStoredUser = () => readJson("user", null);

const getUserStorageId = (user) => user?.id_user || user?.id || "guest";

const normalizeWatchlistItem = (item) => ({
  id: item.id,
  title: item.title || item.name || item.original_name || "Tanpa judul",
  year: item.year || item.releaseLabel || item.release_date || item.first_air_date || "-",
  rating: item.rating || item.vote_average || "-",
});

const getWatchlistContext = (user) => {
  const storageId = getUserStorageId(user);
  const movies = readJson(`flix_movie_watchlist_${storageId}`, []);
  const series = readJson(`flix_tv_watchlist_${storageId}`, []);

  return {
    movies: Array.isArray(movies) ? movies.slice(0, 10).map(normalizeWatchlistItem) : [],
    series: Array.isArray(series) ? series.slice(0, 10).map(normalizeWatchlistItem) : []
  };
};

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Halo, saya Chatbot FLIX. Saya bisa bantu soal film dan fitur FLIX, tapi kamu juga boleh tanya hal umum."
  }
];

function FlixChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const user = getStoredUser();

  const visibleMessages = messages.slice(-8);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const sendMessage = async (text) => {
    const messageText = text.trim();

    if (!messageText || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          history: messages.slice(-6),
          context: {
            currentPath: location.pathname,
            user: user
              ? {
                  username: user.username,
                  role: user.role
                }
              : null,
            watchlist: getWatchlistContext(user)
          }
        })
      });

      const data = await response.json();

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ||
            data.message ||
            "Maaf, saya belum bisa menjawab pertanyaan itu sekarang."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, Chatbot FLIX belum bisa tersambung ke server. Pastikan backend sedang berjalan."
        }
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    setInput("");
    setIsClearConfirmOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        className="flix-chatbot-toggle"
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
        aria-label="Buka Chatbot FLIX"
      >
        <FiMessageCircle aria-hidden="true" />
        <span>Tanya FLIX</span>
      </button>
    );
  }

  return (
    <section className="flix-chatbot">
      <header className="flix-chatbot__header">
        <div className="flix-chatbot__identity">
          <span className="flix-chatbot__logo">
            <img src={flixAdminLogo} alt="" />
          </span>
          <div>
            <p className="flix-chatbot__title">Chatbot FLIX</p>
            <p className="flix-chatbot__subtitle">
              <span aria-hidden="true" />
              {isLoading ? "Sedang mengetik..." : "Siap membantu"}
            </p>
          </div>
        </div>

        <div className="flix-chatbot__actions">
          <button
            className="flix-chatbot__icon-btn flix-chatbot__icon-btn--clear"
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            aria-label="Bersihkan chat"
            title="Bersihkan chat"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
          <button
            className="flix-chatbot__icon-btn"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup chatbot"
          >
            <FiMinus aria-hidden="true" />
          </button>
        </div>
      </header>

      <>
        <div className="flix-chatbot__messages">
          {visibleMessages.map((message) => (
            <div
              className={`flix-chatbot__message-row flix-chatbot__message-row--${message.role}`}
              key={message.id}
            >
              {message.role === "assistant" && (
                <span className="flix-chatbot__message-avatar" aria-hidden="true">
                  <img src={flixAdminLogo} alt="" />
                </span>
              )}
              <div className={`flix-chatbot__message flix-chatbot__message--${message.role}`}>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flix-chatbot__message-row flix-chatbot__message-row--assistant">
              <span className="flix-chatbot__message-avatar" aria-hidden="true">
                <img src={flixAdminLogo} alt="" />
              </span>
              <div className="flix-chatbot__message flix-chatbot__message--assistant flix-chatbot__message--typing">
                <span className="flix-chatbot__typing" aria-label="Chatbot sedang mengetik">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <nav className="flix-chatbot__links" aria-label="Navigasi cepat Chatbot FLIX">
          {navigationLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <form className="flix-chatbot__form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tanya FLIX..."
            maxLength={500}
          />
          <button
            className="flix-chatbot__send"
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Kirim pesan"
          >
            <FiSend aria-hidden="true" />
          </button>
        </form>

        {isClearConfirmOpen && (
          <div className="flix-chatbot__confirm" role="dialog" aria-modal="true" aria-labelledby="flix-chatbot-clear-title">
            <div className="flix-chatbot__confirm-dialog">
              <h3 id="flix-chatbot-clear-title">Bersihkan chat?</h3>
              <p>Semua percakapan di panel ini akan dihapus dan kembali ke pesan awal.</p>
              <div className="flix-chatbot__confirm-actions">
                <button type="button" className="flix-chatbot__confirm-cancel" onClick={() => setIsClearConfirmOpen(false)}>
                  Batal
                </button>
                <button type="button" className="flix-chatbot__confirm-delete" onClick={handleClearChat}>
                  Bersihkan
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </section>
  );
}

export default FlixChatbot;
