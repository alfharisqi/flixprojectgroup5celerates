import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope,
  FaFacebookF,
  FaLock,
  FaPaperPlane,
  FaTimes,
  FaTrash,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "@/components/layout/SiteNavbar";
import "./SettingsPage.css";

const apiUrl = import.meta.env.VITE_API_URL;

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function SettingsModal({ title, children, onClose }) {
  return (
    <div className="settings-modal" role="presentation" onClick={onClose}>
      <section
        className="settings-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-modal__header">
          <h2 id="settings-modal-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">
            <FaTimes />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = useMemo(() => getStoredUser(), []);
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchAccount = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        const response = await axios.get(`${apiUrl}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...(getStoredUser() || {}),
            ...response.data,
            role: response.data.role_name || storedUser?.role,
          }),
        );
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Gagal mengambil data akun");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [navigate, storedUser?.role, token]);

  const closeModal = () => {
    if (saving) {
      return;
    }

    setActiveModal("");
    setEmailForm({ email: "", password: "" });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrorMessage("");
  };

  const updateStoredUser = (nextUser) => {
    const nextStoredUser = {
      ...(getStoredUser() || {}),
      ...nextUser,
      role: nextUser.role_name || getStoredUser()?.role,
    };

    localStorage.setItem("user", JSON.stringify(nextStoredUser));
    setUser((currentUser) => ({
      ...currentUser,
      ...nextUser,
    }));
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");
      const response = await axios.put(`${apiUrl}/api/profile/email`, emailForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateStoredUser(response.data.user);
      setMessage(response.data.message || "Email berhasil diperbarui");
      setActiveModal("");
      setEmailForm({ email: "", password: "" });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal update email");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi baru tidak sama");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");
      const response = await axios.put(`${apiUrl}/api/profile/password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(response.data.message || "Password berhasil diperbarui");
      setActiveModal("");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal update password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      setErrorMessage("");
      await axios.delete(`${apiUrl}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal menghapus akun");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="settings-page settings-page--state">
        <SiteNavbar mode="fixed" />
        <p>Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <SiteNavbar mode="fixed" />

      <section className="settings-shell">
        <div className="settings-card">
          <h1>Informasi Akun</h1>

          {message && <p className="settings-alert settings-alert--success">{message}</p>}
          {errorMessage && !activeModal && <p className="settings-alert">{errorMessage}</p>}

          <div className="settings-account-list">
            <div className="settings-account-row">
              <span>Nama Pengguna</span>
              <strong>{user?.username || "-"}</strong>
            </div>
            <div className="settings-account-row">
              <span>Email</span>
              <strong>{user?.email || "-"}</strong>
            </div>
            <button type="button" onClick={() => setActiveModal("email")}>
              <FaEnvelope />
              Ubah Email
            </button>
            <button type="button" onClick={() => setActiveModal("password")}>
              <FaLock />
              Ubah Password
            </button>
            <button
              type="button"
              className="settings-account-row--danger"
              onClick={() => setActiveModal("delete")}
            >
              <FaTrash />
              Hapus Akun
            </button>
            <Link className="settings-contact-link" to="/contact-us">
              <FaPaperPlane />
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <footer className="settings-footer">
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

      {activeModal === "email" && (
        <SettingsModal title="Ubah Email" onClose={closeModal}>
          <form className="settings-modal-form" onSubmit={handleEmailSubmit}>
            {errorMessage && <p className="settings-alert">{errorMessage}</p>}
            <label>
              Email Saat Ini
              <input type="email" value={user?.email || ""} disabled />
            </label>
            <label>
              Email Baru
              <input
                type="email"
                value={emailForm.email}
                onChange={(event) =>
                  setEmailForm((currentForm) => ({
                    ...currentForm,
                    email: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Masukkan Kata Sandi
              <input
                type="password"
                value={emailForm.password}
                onChange={(event) =>
                  setEmailForm((currentForm) => ({
                    ...currentForm,
                    password: event.target.value,
                  }))
                }
                required
              />
            </label>
            <div className="settings-modal-actions">
              <button type="button" onClick={closeModal} disabled={saving}>
                Batal
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </SettingsModal>
      )}

      {activeModal === "password" && (
        <SettingsModal title="Ubah Password" onClose={closeModal}>
          <form className="settings-modal-form" onSubmit={handlePasswordSubmit}>
            {errorMessage && <p className="settings-alert">{errorMessage}</p>}
            <label>
              Kata Sandi Saat Ini
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((currentForm) => ({
                    ...currentForm,
                    currentPassword: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Kata Sandi Baru
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((currentForm) => ({
                    ...currentForm,
                    newPassword: event.target.value,
                  }))
                }
                minLength={6}
                required
              />
            </label>
            <label>
              Konfirmasi Kata Sandi Baru
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((currentForm) => ({
                    ...currentForm,
                    confirmPassword: event.target.value,
                  }))
                }
                minLength={6}
                required
              />
            </label>
            <div className="settings-modal-actions">
              <button type="button" onClick={closeModal} disabled={saving}>
                Batal
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </SettingsModal>
      )}

      {activeModal === "delete" && (
        <div className="settings-modal" role="presentation" onClick={closeModal}>
          <section
            className="settings-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="settings-delete-title">Apakah Anda yakin ingin Hapus akun?</h2>
            {errorMessage && <p className="settings-alert">{errorMessage}</p>}
            <div className="settings-delete-actions">
              <button type="button" onClick={closeModal} disabled={saving}>
                Batal
              </button>
              <button type="button" onClick={handleDeleteAccount} disabled={saving}>
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default SettingsPage;
