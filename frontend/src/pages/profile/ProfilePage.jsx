import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBookmark,
  FaCalendarAlt,
  FaCheckCircle,
  FaCrown,
  FaEdit,
  FaFilm,
  FaHeart,
  FaRegStar,
  FaSave,
  FaStar,
  FaTimes,
} from "react-icons/fa";
import SiteNavbar from "../../components/layout/SiteNavbar";
import Footer from "../../components/layout/Footer";
import { fetchWatchlist } from "../../utils/watchlist";
import "./ProfilePage.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const moodHistory = [
  { label: "Santai", value: 78 },
  { label: "Seru", value: 64 },
  { label: "Romantis", value: 52 },
  { label: "Menegangkan", value: 46 },
  { label: "Sedih", value: 34 },
  { label: "Pikiran", value: 28 },
];

const favoriteGenres = [
  { label: "Drama", value: 82 },
  { label: "Thriller", value: 66 },
  { label: "Action", value: 58 },
  { label: "Romantis", value: 44 },
];

const formatJoinDate = (dateValue) => {
  if (!dateValue) {
    return "Bergabung sejak 2026";
  }

  return `Bergabung sejak ${new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue))}`;
};

const getInitial = (name = "") => (name.trim().slice(0, 1) || "M").toUpperCase();

function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    total_reviews: 0,
    review_count: 0,
    reply_count: 0,
    average_rating: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const watchedCount = watchlistItems.filter((item) => item.status === "watched").length;
  const movieCount = watchlistItems.filter((item) => item.media_type === "movie").length;
  const reviewHighlights = useMemo(
    () =>
      myReviews.slice(0, 5).map((review) => ({
        id: `${review.media_type}:${review.id_review}`,
        mediaType: review.media_type,
        tmdbId: review.tmdb_id,
        title: review.title,
        poster:
          review.poster_url ||
          "https://placehold.co/134x201/141414/ffffff?text=FLIX",
        rating: review.rating || "-",
        likeCount: review.like_count || 0,
        isReply: Boolean(review.parent_review_id),
        text: review.content,
      })),
    [myReviews],
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const [profileResponse, watchlistResponse, reviewsResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchWatchlist({ token }).catch(() => ({ items: [] })),
          axios
            .get(`${apiUrl}/api/profile/me/reviews`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { summary: {}, reviews: [] } })),
        ]);

        setProfile(profileResponse.data);
        setForm({
          username: profileResponse.data.username || "",
          email: profileResponse.data.email || "",
          password: "",
        });
        setWatchlistItems(watchlistResponse.items || []);
        setMyReviews(reviewsResponse.data.reviews || []);
        setReviewSummary((currentSummary) => ({
          ...currentSummary,
          ...(reviewsResponse.data.summary || {}),
        }));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Gagal mengambil profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, token]);

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const cancelEdit = () => {
    setForm({
      username: profile?.username || "",
      email: profile?.email || "",
      password: "",
    });
    setIsEditing(false);
    setErrorMessage("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const response = await axios.put(`${apiUrl}/api/profile/me`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...oldUser,
        username: response.data.user.username,
        email: response.data.user.email,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfile((currentProfile) => ({
        ...currentProfile,
        username: response.data.user.username,
        email: response.data.user.email,
      }));
      setForm((currentForm) => ({ ...currentForm, password: "" }));
      setIsEditing(false);
      setMessage(response.data.message || "Profile berhasil diperbarui");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page profile-page--state">
        <SiteNavbar mode="fixed" />
        <p>Loading profile...</p>
      </main>
    );
  }

  if (errorMessage && !profile) {
    return (
      <main className="profile-page profile-page--state">
        <SiteNavbar mode="fixed" />
        <p>{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <SiteNavbar mode="fixed" />

      <section className="profile-banner">
        <button className="profile-banner__edit" type="button">
          <FaEdit />
          Edit Banner
        </button>
      </section>

      <section className="profile-shell">
        <div className="profile-summary">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{getInitial(profile?.username)}</div>
            <button
              className="profile-avatar__edit"
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Edit profil"
            >
              <FaEdit />
            </button>
          </div>

          <div className="profile-identity">
            <h1>{profile?.username}</h1>
            <p>{profile?.email}</p>
            <span>
              <FaCalendarAlt />
              {formatJoinDate(profile?.created_at)}
            </span>
          </div>

          <div className="profile-actions">
            <button type="button" onClick={() => setIsEditing(true)}>
              <FaEdit />
              Edit Profil
            </button>
            <span>
              <FaCrown />
              Premium
            </span>
          </div>
        </div>

        {message && <p className="profile-alert profile-alert--success">{message}</p>}
        {errorMessage && <p className="profile-alert">{errorMessage}</p>}

        {isEditing && (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                type="text"
                name="username"
                value={form.username}
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
            <label>
              Password Baru
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Kosongkan jika tidak ingin ganti password"
              />
            </label>
            <div>
              <button type="button" onClick={cancelEdit} disabled={saving}>
                <FaTimes />
                Batal
              </button>
              <button type="submit" disabled={saving}>
                <FaSave />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}

        <div className="profile-stat-grid">
          <article>
            <FaBookmark />
            <strong>{watchlistItems.length}</strong>
            <span>Watchlist</span>
          </article>
          <article>
            <FaCheckCircle />
            <strong>{watchedCount}</strong>
            <span>Sudah Ditonton</span>
          </article>
          <article>
            <FaFilm />
            <strong>{movieCount}</strong>
            <span>Film</span>
          </article>
          <article>
            <FaHeart />
            <strong>{reviewSummary.review_count}</strong>
            <span>Review Saya</span>
          </article>
        </div>

        <div className="profile-content-grid">
          <section className="profile-panel profile-reviews">
            <div className="profile-panel__header">
              <h2>Review Saya ({reviewSummary.total_reviews})</h2>
              <Link to="/watchlist">Lihat Watchlist</Link>
            </div>

            {reviewHighlights.length > 0 ? (
              reviewHighlights.map((review) => (
                <article className="profile-review-card" key={review.id}>
                  <img src={review.poster} alt={review.title} />
                  <div>
                    <Link
                      className="profile-review-card__title"
                      to={
                        review.mediaType === "tv"
                          ? `/tv-series/${review.tmdbId}`
                          : `/movie/${review.tmdbId}`
                      }
                    >
                      {review.title}
                    </Link>
                    <p>
                      <FaStar />
                      {review.rating}
                      <small>{review.isReply ? "Reply" : "Review"}</small>
                    </p>
                    <span>{review.text}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="profile-empty">
                <FaRegStar />
                <p>Belum ada review atau reply yang kamu tulis.</p>
              </div>
            )}
          </section>

          <aside className="profile-side">
            <section className="profile-panel">
              <h2>Ringkasan Review</h2>
              <div className="profile-meter-list">
                {[
                  { label: "Rata-rata Rating", value: reviewSummary.average_rating * 20 },
                  { label: "Review", value: Math.min(reviewSummary.review_count * 12, 100) },
                  { label: "Reply", value: Math.min(reviewSummary.reply_count * 12, 100) },
                  ...moodHistory.slice(0, 3),
                ].map((mood) => (
                  <div className="profile-meter" key={mood.label}>
                    <span>{mood.label}</span>
                    <div>
                      <i style={{ width: `${mood.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-panel">
              <h2>Genre Favorit</h2>
              <div className="profile-genre-list">
                {favoriteGenres.map((genre) => (
                  <span key={genre.label}>
                    {genre.label}
                    <strong>{genre.value}%</strong>
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default ProfilePage;
