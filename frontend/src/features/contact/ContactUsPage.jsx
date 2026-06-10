import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaComments,
  FaFacebookF,
  FaHeadset,
  FaPaperPlane,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "@/components/layout/SiteNavbar";
import "./ContactUsPage.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const contactCategories = [
  { value: "bug_report", label: "Bug Report" },
  { value: "kritik_saran", label: "Kritik & Saran" },
  { value: "kendala_akun", label: "Kendala Akun" },
  { value: "pertanyaan_umum", label: "Pertanyaan Umum" },
  { value: "lainnya", label: "Lainnya" },
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function ContactUsPage() {
  const token = localStorage.getItem("token");
  const user = useMemo(() => getStoredUser(), []);
  const [activeView, setActiveView] = useState("form");
  const [form, setForm] = useState({
    name: user?.username || "",
    email: user?.email || "",
    subject: "",
    category: "bug_report",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "support",
      text: "Halo, selamat datang di Customer Service FLIX. Ada yang bisa kami bantu?",
      time: "Sekarang",
    },
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.message.trim()) {
      setErrorMessage("Isi pesan tidak boleh kosong");
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");
      const response = await axios.post(`${apiUrl}/api/contact-us`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setSuccessMessage(response.data.message || "Pesan berhasil dikirim");
      setForm((currentForm) => ({
        ...currentForm,
        subject: "",
        category: "bug_report",
        message: "",
      }));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal mengirim pesan");
    } finally {
      setSaving(false);
    }
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();

    const trimmedMessage = chatMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        sender: "user",
        text: trimmedMessage,
        time: "Sekarang",
      },
      {
        id: Date.now() + 1,
        sender: "support",
        text: "Pesan kamu sudah masuk. Tim FLIX akan membalas melalui chat ini setelah fitur customer service aktif penuh.",
        time: "Sekarang",
      },
    ]);
    setChatMessage("");
  };

  return (
    <main className="contact-page">
      <SiteNavbar mode="fixed" />

      <section className="contact-shell">
        <div className="contact-card">
          <div className="contact-card__intro">
            <span>Contact Us</span>
            <h1>Hubungi Tim FLIX</h1>
            <p>
              Punya pertanyaan, menemukan bug, atau ingin memberikan saran?
              Kirim pesan kepada tim FLIX melalui form berikut.
            </p>
          </div>

          <div className="contact-view-switch" aria-label="Pilih mode contact us">
            <button
              type="button"
              className={activeView === "form" ? "is-active" : ""}
              onClick={() => setActiveView("form")}
            >
              <FaComments />
              Form Laporan / Kritik dan Saran
            </button>
            <button
              type="button"
              className={activeView === "chat" ? "is-active" : ""}
              onClick={() => setActiveView("chat")}
            >
              <FaHeadset />
              Customer Service
            </button>
          </div>

          {activeView === "form" ? (
            <>
              {successMessage && (
                <p className="contact-alert contact-alert--success">{successMessage}</p>
              )}
              {errorMessage && <p className="contact-alert">{errorMessage}</p>}

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form__grid">
                  <label>
                    Nama Pengguna
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>

                <label>
                  Subjek Pesan
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Kategori Pesan
                  <select name="category" value={form.category} onChange={handleChange} required>
                    {contactCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Isi Pesan
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={7}
                    required
                  />
                </label>

                <button type="submit" disabled={saving}>
                  <FaPaperPlane />
                  {saving ? "Mengirim..." : "Kirim Pesan"}
                </button>
              </form>
            </>
          ) : (
            <section className="contact-chatroom" aria-label="Customer service chatroom">
              <div className="contact-chatroom__header">
                <span className="contact-chatroom__avatar">
                  <FaHeadset />
                </span>
                <div>
                  <h2>Customer Service FLIX</h2>
                  <p>Online untuk membantu kendala akun, pembayaran, dan fitur website.</p>
                </div>
              </div>

              <div className="contact-chatroom__body">
                {chatMessages.map((message) => (
                  <article
                    key={message.id}
                    className={`contact-chatroom__message ${
                      message.sender === "user" ? "is-user" : "is-support"
                    }`}
                  >
                    <div>
                      <p>{message.text}</p>
                      <time>{message.time}</time>
                    </div>
                  </article>
                ))}
              </div>

              <form className="contact-chatroom__input" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Tulis pesan untuk customer service..."
                />
                <button type="submit" aria-label="Kirim pesan customer service">
                  <FaPaperPlane />
                </button>
              </form>
            </section>
          )}
        </div>
      </section>

      <footer className="contact-footer">
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/movies">Movie</Link>
          <Link to="/tv-series">TV Series</Link>
          <Link to="/genre">Genre</Link>
          <Link to="/community">Community</Link>
          <Link to="/contact-us">Contact Us</Link>
        </nav>
        <div>
          <FaFacebookF />
          <FaTwitter />
          <FaYoutube />
        </div>
        <p>Copyright 2026 - Kelompok 5</p>
      </footer>
    </main>
  );
}

export default ContactUsPage;
