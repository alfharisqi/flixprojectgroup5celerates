import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import flixAdminLogo from "@/assets/flixadmin-logo.png";
import "./LoginRequiredModal.css";

function LoginRequiredModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOpen = () => {
      setMode("login");
      setMessage("");
      setOpen(true);
    };
    const handleUpgradeOpen = (event) => {
      setMode("upgrade");
      setMessage(event.detail?.message || "Fitur ini hanya tersedia untuk pengguna Premium atau Eksklusif.");
      setOpen(true);
    };

    window.addEventListener("flix:require-login", handleOpen);
    window.addEventListener("flix:require-upgrade", handleUpgradeOpen);
    return () => {
      window.removeEventListener("flix:require-login", handleOpen);
      window.removeEventListener("flix:require-upgrade", handleUpgradeOpen);
    };
  }, []);

  if (!open) {
    return null;
  }

  const closeModal = () => setOpen(false);

  const goToAuthPage = (path) => {
    closeModal();
    navigate(path);
  };

  return (
    <div className="login-required" role="presentation" onClick={closeModal}>
      <section
        className="login-required__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="login-required__close"
          type="button"
          onClick={closeModal}
          aria-label="Tutup popup login"
        >
          x
        </button>

        <div className="login-required__icon" aria-hidden="true">
          <img src={flixAdminLogo} alt="" />
        </div>

        <div className="login-required__texts">
          <h2 id="login-required-title">
            {mode === "upgrade" ? "Upgrade FLIX" : "Gabung dengan FLIX"}
          </h2>
          <p>
            {mode === "upgrade"
              ? message
              : "Yuk login dulu! Kamu perlu punya akun untuk menjelajahi FLIX."}
          </p>
        </div>

        <div className="login-required__actions">
          <button
            className="login-required__primary"
            type="button"
            onClick={() => goToAuthPage(mode === "upgrade" ? "/premium" : "/register")}
          >
            {mode === "upgrade" ? "Lihat Paket" : "Daftar Sekarang"}
          </button>
          {mode === "upgrade" ? (
            <button
              className="login-required__secondary"
              type="button"
              onClick={closeModal}
            >
              Nanti dulu
            </button>
          ) : (
            <button
              className="login-required__secondary"
              type="button"
              onClick={() => goToAuthPage("/login")}
            >
              Login
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default LoginRequiredModal;
