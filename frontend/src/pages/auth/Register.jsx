import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaApple, FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import flixLogo from "../../assets/flix-logo.png";
import { buildApiUrl } from "../../utils/api";
import "./Login.css";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); //state tambahan
  const [acceptedTerms, setAcceptedTerms] = useState(false); //state untuk checkbox terms
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //form state untuk menyimpan input email, password, dan confirm password
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  //fungsi untuk update form state saat input berubah
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  //membuat username otomatis dari email
  const buildUsername = (email) => {
    const fallback = `user${Date.now().toString().slice(-5)}`;
    const localPart = email.split("@")[0]?.trim().toLowerCase();
    const cleanName = localPart?.replace(/[^a-z0-9_]/g, "");

    return cleanName || fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    //validasi password dan confirm password harus sama
    if (form.password !== form.confirmPassword) {
      setErrorMessage("Password dan confirm password tidak sama");
      return;
    }

    //validasi harus menyetujui terms
    if (!acceptedTerms) {
      setErrorMessage("Kamu harus menyetujui Terms dan Privacy Policies");
      return;
    }

    try {
      setLoading(true);

      //payload yang dikirim ke backend untuk register
      const payload = {
        username: buildUsername(form.email),
        email: form.email,
        password: form.password,
      };

      //register api
      await axios.post(buildApiUrl("/api/auth/register"), payload);

      //pindah ke halaman login setelah register sukses
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Register gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <img className="login-logo" src={flixLogo} alt="FLIX" />

      <section className="login-shell register-shell">
        <h1 className="login-title">Sign Up</h1>
        <p className="login-subtitle">
          Daftar untuk akses FLIX - Website Rekomendasi Film
        </p>

        <form className="login-form register-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-field-label">Email</span>
            <input
              className="login-input"
              type="email"
              name="email"
              placeholder="Masukkan email Anda"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-field">
            <span className="login-field-label">Password</span>
            <input
              className="login-input login-password-input"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Masukkan password Anda"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              className="login-password-toggle"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </label>

          <label className="login-field">
            <span className="login-field-label">Confirm Password</span>
            <input
              className="login-input login-password-input"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Masukkan confirm password Anda"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              className="login-password-toggle"
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? "Sembunyikan confirm password"
                  : "Tampilkan confirm password"
              }
            >
              {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </label>

          <label className="login-check register-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>Saya setuju dengan Syarat dan Kebijakan Privasi</span>
          </label>

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Buat Akun"}
          </button>

          <p className="login-signup">
            Sudah punya akun? <Link to="/login">Login</Link>
          </p>
        </form>

        <div className="login-divider">Atau daftar dengan</div>

        <div className="login-socials" aria-label="Social sign up options">
          <button className="login-social login-social-facebook" type="button">
            <FaFacebookF />
          </button>
          <button className="login-social" type="button">
            <FcGoogle />
          </button>
          <button className="login-social login-social-apple" type="button">
            <FaApple />
          </button>
        </div>
      </section>
    </main>
  );
}

export default Register;
