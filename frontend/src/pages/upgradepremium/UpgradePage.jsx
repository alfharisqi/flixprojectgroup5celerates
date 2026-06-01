import { useNavigate } from "react-router-dom";
import flixLogo from "../../assets/flix-logo.png";
import "./UpgradePage.css";

function UpgradePage() {
  const navigate = useNavigate();

  // Data Paket untuk mempermudah perulangan (looping)
  const packages = [
    {
      id: "free",
      name: "FREE",
      price: "Rp 0",
      period: "/bulan",
      note: "Selamanya gratis",
      description: "Untuk kamu yang baru mulai menjelajah FLIX.",
      features: [
        { text: "Rekomendasi mood (maks. 4 film)", active: true },
        { text: "Watchlist maks. 10 film", active: true },
        { text: "Tulis review", active: true },
        { text: "Pencarian film", active: true },
        { text: "Filter lanjutan", active: false },
        { text: "Community Film", active: false },
        { text: "Bebas Iklan", active: false },
      ],
      buttonText: "Paket Saat Ini",
      buttonClass: "btn-disabled",
    },
    {
      id: "premium",
      name: "PREMIUM",
      price: "Rp 29K",
      period: "/bulan",
      note: "Bisa dibatalkan kapan saja",
      description: "Untuk penonton serius yang ingin rekomendasi terbaik.",
      popular: true, // Untuk menandai kartu terpopuler
      features: [
        {
          text: "Rekomendasi mood unlimited",
          active: true,
          boldText: "unlimited",
        },
        { text: "Watchlist maks. 10 film", active: true },
        { text: "Watchlist unlimited", active: true },
        { text: "Tulis & edit review", active: true },
        { text: "Filter lanjutan", active: true },
        { text: "Community", active: true },
        { text: "Badge Premium di profil", active: false },
      ],
      buttonText: "Mulai Premium",
      buttonClass: "btn-primary",
      hasArrow: true,
    },
    {
      id: "annual",
      name: "PREMIUM TAHUNAN",
      price: "Rp 249",
      period: "/tahun",
      note: "Hemat Rp 99K vs bulanan",
      description:
        "Semua fitur Premium + bonus eksklusif untuk pengguna setia.",
      features: [
        { text: "Semua fitur Premium", active: true },
        { text: "Badge Premium ✦ di profil", active: true },
        { text: "Early review film baru", active: true },
        { text: "Statistik tontonan tahunan", active: true },
        { text: "Prioritas support", active: true },
        { text: "Bebas sponsored", active: true },
        { text: "Hemat Rp 99K/tahun", active: true },
      ],
      buttonText: "Paket Saat Ini",
      buttonClass: "btn-secondary",
    },
  ];

  return (
    <div className="upgrade-page">
      {/* 1. Header Halaman */}
      <header className="upgrade-header">
        <div className="upgrade-header__logo" onClick={() => navigate("/")}>
          <img src={flixLogo} alt="FLIX Logo" />
        </div>
        <button
          className="upgrade-header__close"
          onClick={() => navigate(-1)}
          aria-label="Tutup Halaman Upgrade"
        >
          {/* Ikon X */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="upgrade-hero">
        <div className="upgrade-hero__badge">
          <span className="badge-dot"></span> UPGRADE AKUN
        </div>
        <h1 className="upgrade-hero__title">
          Nonton Lebih Cerdas <br /> dengan
          <span className="text-highlight"> FLIX Premium</span>
        </h1>
        <p className="upgrade-hero__subtitle">
          Akses rekomendasi tak terbatas, filter canggih, dan pengalaman
          menonton yang benar-benar personal.
        </p>
        <p className="upgrade-hero__stats">
          Sudah <strong className="text-white">3.741</strong> user menikmati
          FLIX — yuk bergabung!
        </p>
      </section>

      /* 3. Kartu Paket */
      <section className="upgrade-cards-container">
        <div className="upgrade-cards">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`upgrade-card ${pkg.popular ? "upgrade-card--popular" : ""}`}
            >
              {/* Badge Paling Populer di atas kartu Premium */}
              {pkg.popular && (
                <div className="popular-badge">
                  <span role="img" aria-label="diamond">
                    💎
                  </span>{" "}
                  Paling Populer
                </div>
              )}

              {/* Detail Paket */}
              <div className="card-header">
                <span className="card-header__name">{pkg.name}</span>
                <div className="card-header__price-wrapper">
                  <span className="card-header__price">{pkg.price}</span>
                  <span className="card-header__period">{pkg.period}</span>
                </div>
                <span className="card-header__note">{pkg.note}</span>
                <p className="card-header__desc">{pkg.description}</p>
              </div>

              <div className="card-divider"></div>

              {/* Daftar Fitur */}
              <ul className="card-features">
                {pkg.features.map((feat, index) => (
                  <li
                    key={index}
                    className={`feature-item ${!feat.active ? "feature-item--inactive" : ""}`}
                  >
                    {feat.active ? (
                      // Ikon Centang Hijau
                      <svg
                        className="icon-check"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      // Ikon Silang Merah
                      <svg
                        className="icon-cross"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    )}
                    <span>
                      {feat.boldText ? (
                        <>
                          {feat.text.replace(feat.boldText, "")}
                          <strong className="text-white">
                            {feat.boldText}
                          </strong>
                        </>
                      ) : (
                        feat.text
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Tombol Aksi */}
              <button className={`card-button ${pkg.buttonClass}`}>
                {pkg.buttonText}
                {pkg.hasArrow && (
                  <svg
                    className="icon-arrow"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default UpgradePage;
