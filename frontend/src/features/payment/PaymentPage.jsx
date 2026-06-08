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

  // 1. Ambil data paket yang diteruskan dari halaman UpgradePremium
  const selectedPackage = location.state?.package || {
    name: "Premium Bulanan",
    priceText: "Rp 29.000",
    price: 29000,
    durationMonths: 1,
  };

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  // 2. State untuk Data Diri Pembayar
  const [fullName, setFullName] = useState(storedUser.username || "");
  const [email, setEmail] = useState(storedUser.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [durationMonths, setDurationMonths] = useState(selectedPackage.durationMonths);

  // 3. State Metode Pembayaran & Saluran
  const [paymentMethod, setPaymentMethod] = useState("qris"); // 'qris', 'bank', 'ewallet'
  const [selectedBank, setSelectedBank] = useState("bca"); // 'bca', 'mandiri'
  const [selectedEwallet, setSelectedEwallet] = useState("gopay"); // 'gopay', 'ovo', 'dana'
  const [ewalletPhone, setEwalletPhone] = useState("");

  // 4. State Modal Upload & Status Keberhasilan
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  
  // 5. State Tambahan
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // Timer QRIS 15 menit (900 detik)

  // Countdown timer untuk QRIS
  useEffect(() => {
    if (paymentMethod !== "qris" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentMethod, timeLeft]);

  // Format detik menjadi MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Salin teks ke Clipboard
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin ke clipboard!");
  };

  // Kalkulasi Harga secara Dinamis berdasarkan Durasi Bulan
  const getSubtotal = () => {
    // Jika durasi 12 bulan (tahunan), beri harga khusus paket tahunan Rp 249.000
    if (Number(durationMonths) === 12) {
      return 249000;
    }
    // Jika bulanan biasa
    return Number(durationMonths) * 29000;
  };

  const subtotal = getSubtotal();
  const adminFee = 2500; // Biaya admin Rp2.500 sesuai mockup Anda
  const totalPayment = subtotal + adminFee;

  // Format angka ke format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(number);
  };

  // Hitung Tanggal Aktif Langganan
  const getPeriodText = () => {
    const today = new Date();
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + Number(durationMonths));

    const options = { day: "numeric", month: "long", year: "numeric" };
    return `${today.toLocaleDateString("id-ID", options)} - ${expiry.toLocaleDateString("id-ID", options)}`;
  };

  // Tanggal kedaluwarsa untuk struk berhasil
  const getExpiryDate = () => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(durationMonths));
    const options = { day: "numeric", month: "long", year: "numeric" };
    return expiry.toLocaleDateString("id-ID", options);
  };

  const getPackageCode = () => (Number(durationMonths) === 12 ? "premium_yearly" : "premium");

  const getPaymentMethodLabel = () => {
    if (paymentMethod === "qris") return "QRIS";
    if (paymentMethod === "bank") return `Transfer Bank (${selectedBank.toUpperCase()})`;
    return `E-Wallet (${selectedEwallet.toUpperCase()})`;
  };

  // Ketika klik tombol "Bayar Sekarang"
  const handleOpenUploadModal = () => {
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError("Mohon lengkapi Data Diri Pembayar terlebih dahulu!");
      return;
    }
    if (paymentMethod === "ewallet" && !ewalletPhone.trim()) {
      setError("Mohon isi nomor handphone E-Wallet Anda!");
      return;
    }
    setError("");
    setShowUploadModal(true);
  };

  // Proses upload file bukti pembayaran ke server
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAndConfirm = async (e) => {
    e.preventDefault();
    if (!paymentProofFile) {
      setError("Silakan pilih file bukti pembayaran terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Siapkan FormData untuk dikirim ke API Express
      const formData = new FormData();
      formData.append("payment_proof", paymentProofFile);
      formData.append("packageCode", getPackageCode());
      formData.append(
        "packageName",
        Number(durationMonths) === 12 ? "Premium Tahunan" : "Premium Bulanan",
      );
      formData.append("durationMonths", String(durationMonths));
      formData.append("paymentMethod", paymentMethod);
      formData.append("paymentMethodDetail", getPaymentMethodLabel());
      formData.append("amount", String(subtotal));
      formData.append("adminFee", String(adminFee));
      formData.append("totalAmount", String(totalPayment));
      formData.append("payerName", fullName);
      formData.append("payerEmail", email);
      formData.append("payerPhone", phoneNumber);
      formData.append("ewalletPhone", ewalletPhone);

      const res = await axios.post(
        `${API_URL}/api/payment/checkout`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTransactionId(res.data?.transaction?.transactionId || "-");

      // Tutup modal upload, lalu tampilkan status pending verifikasi admin.
      setShowUploadModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal mengunggah bukti pembayaran."
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
        {/* PANEL KIRI: FORMULIR UTAMA */}
        <main className="payment-main-form">
          
          {/* 1. DATA DIRI PEMBAYAR */}
          <section className="payment-section-card">
            <div className="section-title-wrapper">
              <span className="section-badge">1</span>
              <h2>Data Diri Pembayar</h2>
            </div>
            <div className="form-group-grid">
              <div className="form-input-box">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="form-input-box">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-input-box">
                <label>Nomor Handphone</label>
                <input
                  type="tel"
                  placeholder="Masukkan nomor handphone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="form-input-box">
                <label>Durasi Pembelian Paket (Bulan)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                >
                  <option value={1}>1 Bulan (Premium Bulanan)</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan (Premium Tahunan - Hemat!)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. PILIH METODE PEMBAYARAN */}
          <section className="payment-section-card">
            <div className="section-title-wrapper">
              <span className="section-badge">2</span>
              <h2>Pilih Metode Pembayaran</h2>
            </div>
            
            <div className="payment-method-selector-list">
              {/* Pilihan QR Code */}
              <label className={`payment-method-row ${paymentMethod === "qris" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="main_method"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                />
                <div className="method-row-content">
                  <div className="method-icon-text">
                    <span className="icon-method-emoji">📱</span>
                    <div>
                      <strong>QR Code</strong>
                      <p>Bayar menggunakan QRIS</p>
                    </div>
                  </div>
                </div>
              </label>

              {/* Pilihan Bank Transfer */}
              <label className={`payment-method-row ${paymentMethod === "bank" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="main_method"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                />
                <div className="method-row-content">
                  <div className="method-icon-text">
                    <span className="icon-method-emoji">🏦</span>
                    <div>
                      <strong>Transfer Bank</strong>
                      <p>Transfer ke nomor rekening bank</p>
                    </div>
                  </div>
                </div>
              </label>

              {/* Pilihan E-Wallet */}
              <label className={`payment-method-row ${paymentMethod === "ewallet" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="main_method"
                  checked={paymentMethod === "ewallet"}
                  onChange={() => setPaymentMethod("ewallet")}
                />
                <div className="method-row-content">
                  <div className="method-icon-text">
                    <span className="icon-method-emoji">💳</span>
                    <div>
                      <strong>E-Wallet</strong>
                      <p>Bayar dengan saldo e-wallet</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* 3. DETAIL METODE PEMBAYARAN (DINAMIS) */}
          <section className="payment-section-card">
            <div className="section-title-wrapper">
              <span className="section-badge">3</span>
              <h2>Detail Pembayaran</h2>
            </div>

            {/* Jika Memilih QRIS */}
            {paymentMethod === "qris" && (
              <div className="payment-detail-box animated-fade">
                <h4>QR Code</h4>
                <p className="detail-subtext">Scan QR code berikut menggunakan aplikasi e-wallet atau mobile banking</p>
                
                <div className="qris-qr-container">
                  <svg width="160" height="160" viewBox="0 0 29 29" className="qris-svg-code">
                    <path d="M0 0h7v7H0zm2 2v3h3V2zm0 8h1v1H2zm0 2h3v1H2zm3 2h2v1H5zm6-6h1v1h-1zm1 2h1v2h-1zm0 3h1v1h-1zM0 22h7v7H0zm2 2v3h3v-3zm20-22h7v7h-7zm2 2v3h3V2zm-9 20h2v1h-2zm1 2h3v1h-3zm2-4h2v1h-2zm-6-2h1v1h-1zm5 2h1v1h-1zm0 2h1v1h-1zm-6-2h1v1h-1zm1 2h1v1h-1zm2 1h1v1h-1zm1 1h1v1h-1z" fill="#000000"/>
                  </svg>
                </div>

                <div className="qris-timer-alert">
                  <span className="info-icon">ℹ️</span>
                  <span>QR Code akan kadaluarsa dalam <strong>{formatTime(timeLeft)}</strong></span>
                </div>

                <div className="divider-or">
                  <span>ATAU</span>
                </div>

                <div className="copy-code-group">
                  <label>Tidak bisa scan? Salin kode pembayaran</label>
                  <div className="copy-input-row">
                    <input
                      type="text"
                      readOnly
                      value="00020101021126680014ID.CO.QRIS.WWW01189360029314817"
                    />
                    <button type="button" onClick={() => handleCopyText("00020101021126680014ID.CO.QRIS.WWW01189360029314817")}>
                      📋 Salin
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Jika Memilih Bank Transfer */}
            {paymentMethod === "bank" && (
              <div className="payment-detail-box animated-fade">
                <h4>Transfer Rekening Bank</h4>
                <p className="detail-subtext">Pilih salah satu bank di bawah ini untuk melihat nomor rekening</p>

                <div className="bank-tab-selector">
                  <button
                    type="button"
                    className={`bank-tab-btn ${selectedBank === "bca" ? "is-selected" : ""}`}
                    onClick={() => setSelectedBank("bca")}
                  >
                    BCA Virtual Account
                  </button>
                  <button
                    type="button"
                    className={`bank-tab-btn ${selectedBank === "mandiri" ? "is-selected" : ""}`}
                    onClick={() => setSelectedBank("mandiri")}
                  >
                    Mandiri Transfer
                  </button>
                </div>

                <div className="bank-account-details">
                  {selectedBank === "bca" ? (
                    <div className="bank-info-card">
                      <div className="bank-logo-row">BCA</div>
                      <div className="bank-num-label">Nomor Virtual Account</div>
                      <div className="bank-num-value-row">
                        <strong>88012 0812 3456 7890</strong>
                        <button type="button" onClick={() => handleCopyText("88012081234567890")}>Salin</button>
                      </div>
                      <div className="bank-holder-label">Nama Rekening: <strong>PT FLIX INDONESIA</strong></div>
                    </div>
                  ) : (
                    <div className="bank-info-card">
                      <div className="bank-logo-row">MANDIRI</div>
                      <div className="bank-num-label">Nomor Rekening Mandiri</div>
                      <div className="bank-num-value-row">
                        <strong>137 00234 56789</strong>
                        <button type="button" onClick={() => handleCopyText("1370023456789")}>Salin</button>
                      </div>
                      <div className="bank-holder-label">Nama Rekening: <strong>PT FLIX INDONESIA</strong></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jika Memilih E-Wallet */}
            {paymentMethod === "ewallet" && (
              <div className="payment-detail-box animated-fade">
                <h4>Dompet Digital (E-Wallet)</h4>
                <p className="detail-subtext">Pilih e-wallet dan masukkan nomor HP yang terdaftar</p>

                <div className="ewallet-selector-grid">
                  <button
                    type="button"
                    className={`ewallet-logo-btn ${selectedEwallet === "gopay" ? "is-selected" : ""}`}
                    onClick={() => setSelectedEwallet("gopay")}
                  >
                    GoPay
                  </button>
                  <button
                    type="button"
                    className={`ewallet-logo-btn ${selectedEwallet === "ovo" ? "is-selected" : ""}`}
                    onClick={() => setSelectedEwallet("ovo")}
                  >
                    OVO
                  </button>
                  <button
                    type="button"
                    className={`ewallet-logo-btn ${selectedEwallet === "dana" ? "is-selected" : ""}`}
                    onClick={() => setSelectedEwallet("dana")}
                  >
                    DANA
                  </button>
                </div>

                <div className="ewallet-phone-group">
                  <label>Nomor HP terdaftar di {selectedEwallet.toUpperCase()}</label>
                  <div className="phone-prefix-input">
                    <span className="prefix">+62</span>
                    <input
                      type="tel"
                      placeholder="812XXXXXXXX"
                      value={ewalletPhone}
                      onChange={(e) => setEwalletPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 5. TOMBOL BAYAR UTAMA */}
          {error && <p className="payment-error-msg">{error}</p>}
          <button
            type="button"
            className="btn-pay-now-large"
            onClick={handleOpenUploadModal}
          >
            🔒 Bayar Sekarang
          </button>
        </main>

        {/* PANEL KANAN: RINGKASAN PESANAN */}
        <aside className="payment-summary">
          <div className="summary-card">
            <div className="section-title-wrapper">
              <span className="section-badge">4</span>
              <h2>Ringkasan Pembayaran</h2>
            </div>

            <div className="package-hero">
              <span className="badge-popular">Paling Populer</span>
              <h4>FLIX PREMIUM</h4>
              <p>Langganan premium dengan fitur tak terbatas</p>
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span>Nama Produk / Layanan</span>
                <strong>FLIX Premium ({durationMonths} Bulan)</strong>
              </div>
              <div className="summary-row">
                <span>Nama Akun</span>
                <strong>{fullName || "Marsyanda"}</strong>
              </div>
              <div className="summary-row">
                <span>Email</span>
                <strong>{email || "marsyanda@gmail.com"}</strong>
              </div>
              <div className="summary-row">
                <span>Paket</span>
                <strong>
                  <img src={blueDiamondIcon} alt="" className="pro-icon" />{" "}
                  {durationMonths === 12 ? "Premium Tahunan" : "Premium Bulanan"}
                </strong>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatRupiah(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Biaya Admin</span>
                <strong>{formatRupiah(adminFee)}</strong>
              </div>
              <div className="summary-row">
                <span>Periode Aktif</span>
                <strong>{getPeriodText()}</strong>
              </div>
              <div className="summary-row">
                <span>Metode Pembayaran</span>
                <strong className="text-uppercase">{paymentMethod.toUpperCase()}</strong>
              </div>

              <div className="summary-total">
                <span>Total Pembayaran</span>
                <span className="price-total">{formatRupiah(totalPayment)}</span>
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

      {/* POPUP MODAL 1: UPLOAD BUKTI PEMBAYARAN */}
      {showUploadModal && (
        <div className="modal-backdrop-blur">
          <div className="upload-payment-modal-card">
            <h3>Bukti Pembayaran</h3>
            <p>Silakan upload foto/gambar bukti pembayaran atau transfer untuk diproses verifikasi.</p>

            <form onSubmit={handleUploadAndConfirm}>
              <div className="upload-dropzone-wrapper">
                <input
                  type="file"
                  id="payment_proof"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <label htmlFor="payment_proof" className="dropzone-label">
                  {paymentProofPreview ? (
                    <img src={paymentProofPreview} alt="Preview Bukti" className="proof-img-preview" />
                  ) : (
                    <div className="dropzone-placeholder">
                      <span className="upload-cloud-icon">📤</span>
                      <strong>Klik untuk mencari gambar</strong>
                      <p>Mendukung JPG, PNG atau WEBP (Maks. 2MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {error && <p className="payment-error-msg modal-err">{error}</p>}

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowUploadModal(false)}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={loading}
                >
                  {loading ? "Mengunggah..." : "Unggah & Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: BUKTI PEMBAYARAN TERKIRIM */}
      {showSuccessModal && (
        <div className="modal-backdrop-blur">
          <div className="payment-success-card">
            {/* Green Checkmark */}
            <div className="success-checkmark-circle">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00E082" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2>Bukti Pembayaran Terkirim</h2>
            <p className="success-subtext">
              Transaksi kamu sedang menunggu verifikasi admin. Akses premium akan aktif setelah pembayaran disetujui.
            </p>

            {/* Badge Premium */}
            <div className="premium-active-badge-card">
              <span className="premium-star-icon">💎</span> Status: Pending Verifikasi
            </div>

            {/* Tabel Detail Transaksi */}
            <div className="success-transaction-table">
              <div className="table-row">
                <span>ID Transaksi</span>
                <strong>{transactionId}</strong>
              </div>
              <div className="table-row">
                <span>Paket</span>
                <strong>{durationMonths === 12 ? "Premium Tahunan" : "Premium Bulanan"}</strong>
              </div>
              <div className="table-row">
                <span>Metode</span>
                <strong className="text-uppercase">{getPaymentMethodLabel()}</strong>
              </div>
              <div className="table-row">
                <span>Total Bayar</span>
                <strong>{formatRupiah(totalPayment)}</strong>
              </div>
              <div className="table-row">
                <span>Status</span>
                <strong>Menunggu Admin</strong>
              </div>
            </div>

            {/* Fitur Akan Aktif */}
            <div className="features-checklist-group">
              <h5>FITUR AKAN AKTIF SETELAH DISETUJUI:</h5>
              <ul>
                <li>
                  <span className="feat-check-icon">✓</span> Rekomendasi mood <strong>unlimited</strong>
                </li>
                <li>
                  <span className="feat-check-icon">✓</span> Watchlist unlimited
                </li>
                <li>
                  <span className="feat-check-icon">✓</span> Tulis review
                </li>
                <li>
                  <span className="feat-check-icon">✓</span> Community
                </li>
                <li>
                  {durationMonths === 12 ? (
                    <>
                      <span className="feat-check-icon">✓</span> Badge Premium di profil
                    </>
                  ) : (
                    <>
                      <span className="feat-cross-icon">✗</span> Badge Premium di profil
                    </>
                  )}
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="btn-success-modal-continue"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/profile");
              }}
            >
              Lihat Profil →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;
