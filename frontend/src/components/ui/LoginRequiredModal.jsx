import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import flixAdminLogo from "@/assets/flixadmin-logo.png";
import "./LoginRequiredModal.css";

function LoginRequiredModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    window.addEventListener("flix:require-login", handleOpen);
    return () => window.removeEventListener("flix:require-login", handleOpen);
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
          <h2 id="login-required-title">Gabung dengan FLIX</h2>
          <p>Yuk login dulu! Kamu perlu punya akun untuk menjelajahi FLIX.</p>
        </div>

        <div className="login-required__actions">
          <button
            className="login-required__primary"
            type="button"
            onClick={() => goToAuthPage("/register")}
          >
            Daftar Sekarang
          </button>
          <button
            className="login-required__secondary"
            type="button"
            onClick={() => goToAuthPage("/login")}
          >
            Login
          </button>
        </div>
      </section>
    </div>
  );
}

export default LoginRequiredModal;
