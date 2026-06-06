import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import flixLogo from "@/assets/flix-logo.png";
import blueDiamondIcon from "@/assets/icon/bluediamond-icon.png";
import "./PaymentPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil data paket yang dipilih dari halaman upgrade sebelumnya (default Premium Bulanan)
  const selectedPackage = location.state?.package || {
    name: "Premium Bulanan",
    priceText: "Rp 29.000",
    price: 29000,
  };

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [paymentMethod, setPaymentMethod] = useState("gopay");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Menghitung tanggal aktif langganan (hari ini s.d 30 hari ke depan)
  const getPeriodText = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const options = { day: "numeric", month: "long", year: "numeric" };
    return `${today.toLocaleDateString("id-ID", options)} - ${nextMonth.toLocaleDateString("id-ID", options)}`;
  };

  const handlePayment = async () => {
    if (paymentMethod === "gopay" && !phoneNumber.trim()) {
      setError("Nomor HP GoPay wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Kirim request ke backend untuk upgrade premium
      const res = await axios.post(
        `${API_URL}/api/payment/checkout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Perbarui info user di localStorage agar status premium-nya langsung aktif
      const updatedUser = {
        ...storedUser,
        is_premium: true,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert(
        "Pembayaran Berhasil! Terima kasih telah berlangganan FLIX Premium.",
      );
      navigate("/profile");
      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.message || "Terjadi kesalahan saat pembayaran.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <header className="payment-header">
        <img
          className="payment-header__logo"
          src={flixLogo}
          alt="FLIX"
          onClick={() => navigate("/")}
        />
        <button className="payment-header__close" onClick={() => navigate(-1)}>
          ✕
        </button>
      </header>

      <div className="payment-container">
        {/* PANEL KIRI: METODE PEMBAYARAN */}
        <main className="payment-methods">
          <h2>Pilih Metode Pembayaran</h2>
          <p className="subtitle">
            Pilih cara pembayaran yang paling mudah untukmu
          </p>

          <section className="payment-section">
            <h3>DOMPET DIGITAL</h3>
            <div className="payment-grid">
              <label
                className={`payment-option ${paymentMethod === "gopay" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "gopay"}
                  onChange={() => setPaymentMethod("gopay")}
                />
                <div className="option-content">
                  <span className="logo-placeholder gopay-logo">GoPay</span>
                  <span className="badge-free">Gratis</span>
                </div>
              </label>

              <label
                className={`payment-option ${paymentMethod === "ovo" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "ovo"}
                  onChange={() => setPaymentMethod("ovo")}
                />
                <div className="option-content">
                  <span className="logo-placeholder ovo-logo">OVO</span>
                  <span className="badge-free">Gratis</span>
                </div>
              </label>
            </div>

            {paymentMethod === "gopay" && (
              <div className="phone-input-group">
                <label>Nomor HP yang terdaftar di GoPay</label>
                <div className="phone-input-wrapper">
                  <span className="country-code">+62</span>
                  <input
                    type="tel"
                    placeholder="0812xxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="payment-section">
            <h3>TRANSFER BANK</h3>
            <div className="payment-grid">
              <label
                className={`payment-option ${paymentMethod === "bca" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "bca"}
                  onChange={() => setPaymentMethod("bca")}
                />
                <div className="option-content">
                  <span className="logo-placeholder bca-logo">
                    Virtual Account BCA
                  </span>
                </div>
              </label>
            </div>
          </section>

          {error && <p className="payment-error-msg">{error}</p>}

          <button
            className="btn-pay-now"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading
              ? "Memproses..."
              : `Bayar Sekarang → ${selectedPackage.priceText}`}
          </button>
        </main>

        {/* PANEL KANAN: RINGKASAN PESANAN */}
        <aside className="payment-summary">
          <div className="summary-card">
            <h3>📋 Ringkasan Pesanan</h3>

            <div className="package-hero">
              <span className="badge-popular">Paling Populer</span>
              <h4>FLIX PREMIUM</h4>
              <p>Langganan Bulanan • Bisa dibatalkan kapan saja</p>
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span>Nama Akun</span>
                <strong>{storedUser.username || "Marsyanda"}</strong>
              </div>
              <div className="summary-row">
                <span>Email</span>
                <strong>{storedUser.email || "marsyanda@gmail.com"}</strong>
              </div>
              <div className="summary-row">
                <span>Paket</span>
                <strong>
                  <img src={blueDiamondIcon} alt="" className="pro-icon" />{" "}
                  {selectedPackage.name}
                </strong>
              </div>
              <div className="summary-row">
                <span>Harga</span>
                <strong>{selectedPackage.priceText}</strong>
              </div>
              <div className="summary-row">
                <span>Diskon</span>
                <strong className="text-discount">- Rp 0</strong>
              </div>
              <div className="summary-row">
                <span>Periode</span>
                <strong>{getPeriodText()}</strong>
              </div>
              <div className="summary-row">
                <span>Metode</span>
                <strong className="text-uppercase">{paymentMethod}</strong>
              </div>
              <div className="summary-row">
                <span>Biaya Admin</span>
                <strong className="text-free">Gratis</strong>
              </div>

              <div className="summary-total">
                <span>Total Bayar</span>
                <span className="price-total">{selectedPackage.priceText}</span>
              </div>
            </div>

            <div className="promo-group">
              <input
                type="text"
                placeholder="Masukkan kode promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button type="button">Pakai</button>
            </div>

            <div className="secure-badge">
              <span className="shield-icon">🛡️</span> Pembayaran aman &
              terenkripsi. Bisa dibatalkan kapan saja.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PaymentPage;
