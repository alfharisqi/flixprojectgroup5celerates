import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import flixLogo from "../../assets/flix-logo.png";
import { buildApiUrl } from "../../utils/api";
import "./Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState(""); //state untuk menyimpan input email
  const [loading, setLoading] = useState(false); //state untuk menandakan sedang loading atau tidak
  const [message, setMessage] = useState(""); //state untuk menyimpan pesan sukses dari backend
  const [errorMessage, setErrorMessage] = useState(""); //state untuk menyimpan pesan error dari backend

  //fungsi yang dijalankan saat form di submit
  const handleSubmit = async (event) => {
    event.preventDefault(); //biar ga reload pas submit
    setMessage("");
    setErrorMessage("");

    try {
      setLoading(true);
      const res = await axios.post(
        buildApiUrl("/api/auth/forgot-password"), //api untuk forgot password
        { email }
      );

      setMessage(res.data.message);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Gagal mengirim link reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <img className="login-logo" src={flixLogo} alt="FLIX" />

      <section className="login-shell forgot-shell">
        <h1 className="login-title">Forgot Password</h1>
        <p className="login-subtitle">
          Masukkan email akun FLIX kamu untuk menerima link reset password
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-field-label">Email</span>
            <input
              className="login-input"
              type="email"
              name="email"
              placeholder="Masukkan email Anda"
              value={email} //value diambil dari state email
              onChange={(event) => setEmail(event.target.value)} //setiap user mengetik, state email ikut berubah
              autoComplete="email"
              required
            />
          </label>
          //tampilkan pesan sukses atau error dari backend
          {message && <p className="login-success">{message}</p>}
          {errorMessage && <p className="login-error">{errorMessage}</p>}
          //tampil loading
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Kirim Link Reset"}
          </button>
          <p className="login-signup">
            Ingat password Anda? <Link to="/login">Login</Link> //link untuk
            kembali ke halaman login
          </p>
        </form>
      </section>
    </main>
  );
}

export default ForgotPassword;
