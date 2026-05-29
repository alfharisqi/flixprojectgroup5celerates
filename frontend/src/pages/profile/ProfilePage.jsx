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
import { buildApiUrl } from "../../utils/api";
import { fetchWatchlist } from "../../utils/watchlist";
import ImageCropperModal from "../../components/profile/ImageCropperModal";
import "./ProfilePage.css";

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

const getInitial = (name = "") =>
  (name.trim().slice(0, 1) || "M").toUpperCase();

const defaultImagePosition = {
  x: 50,
  y: 50,
};

const parseImagePosition = (value = "50% 50%") => {
  const [x = "50%", y = "50%"] = String(value).split(" ");
  const toNumber = (part) => {
    const number = Number.parseInt(part, 10);
    return Number.isFinite(number) ? Math.min(Math.max(number, 0), 100) : 50;
  };

  return {
    x: toNumber(x),
    y: toNumber(y),
  };
};

const formatImagePosition = ({ x, y }) => `${x}% ${y}%`;

const resolveMediaUrl = (url) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return buildApiUrl(url);
};

function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    profile_photo_url: "",
    banner_url: "",
    profile_photo_position: "50% 50%",
    profile_photo_position: "50% 50%",
    banner_position: "50% 50%",
  });
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: null,
    cropType: null,
  });
  const [selectedImages, setSelectedImages] = useState({
    profilePhoto: null,
    banner: null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    profilePhoto: "",
    banner: "",
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

  const watchedCount = watchlistItems.filter(
    (item) => item.status === "watched",
  ).length;
  const movieCount = watchlistItems.filter(
    (item) => item.media_type === "movie",
  ).length;
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
  const profilePhotoUrl = resolveMediaUrl(profile?.profile_photo_url);
  const bannerUrl = resolveMediaUrl(profile?.banner_url);
  const editPhotoPreview =
    imagePreviews.profilePhoto || resolveMediaUrl(form.profile_photo_url);
  const editBannerPreview =
    imagePreviews.banner || resolveMediaUrl(form.banner_url);
  const profilePhotoPosition = profile?.profile_photo_position || "50% 50%";
  const bannerPosition = profile?.banner_position || "50% 50%";

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const [profileResponse, watchlistResponse, reviewsResponse] =
          await Promise.all([
            axios.get(buildApiUrl("/api/profile/me"), {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetchWatchlist({ token }).catch(() => ({ items: [] })),
            axios
              .get(buildApiUrl("/api/profile/me/reviews"), {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(() => ({ data: { summary: {}, reviews: [] } })),
          ]);

        setProfile(profileResponse.data);
        setForm({
          username: profileResponse.data.username || "",
          email: profileResponse.data.email || "",
          password: "",
          profile_photo_url: profileResponse.data.profile_photo_url || "",
          banner_url: profileResponse.data.banner_url || "",
          profile_photo_position:
            profileResponse.data.profile_photo_position || "50% 50%",
          banner_position: profileResponse.data.banner_position || "50% 50%",
        });
        setWatchlistItems(watchlistResponse.items || []);
        setMyReviews(reviewsResponse.data.reviews || []);
        setReviewSummary((currentSummary) => ({
          ...currentSummary,
          ...(reviewsResponse.data.summary || {}),
        }));
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Gagal mengambil profile",
        );
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

  const openEditModal = () => {
    setForm({
      username: profile?.username || "",
      email: profile?.email || "",
      password: "",
      profile_photo_url: profile?.profile_photo_url || "",
      banner_url: profile?.banner_url || "",
      profile_photo_position: profile?.profile_photo_position || "50% 50%",
      banner_position: profile?.banner_position || "50% 50%",
    });
    setSelectedImages({ profilePhoto: null, banner: null });
    setImagePreviews({ profilePhoto: "", banner: "" });
    setErrorMessage("");
    setMessage("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm({
      username: profile?.username || "",
      email: profile?.email || "",
      password: "",
      profile_photo_url: profile?.profile_photo_url || "",
      banner_url: profile?.banner_url || "",
      profile_photo_position: profile?.profile_photo_position || "50% 50%",
      banner_position: profile?.banner_position || "50% 50%",
    });
    setSelectedImages({ profilePhoto: null, banner: null });
    setImagePreviews({ profilePhoto: "", banner: "" });
    setIsEditing(false);
    setErrorMessage("");
    setMessage("");
  };

  const handleImageChange = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({ isOpen: true, imageSrc: reader.result, cropType: key });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropComplete = (croppedBlob) => {
    const { cropType } = cropperState;
    setSelectedImages((currentImages) => ({
      ...currentImages,
      [cropType]: croppedBlob,
    }));
    setImagePreviews((currentPreviews) => ({
      ...currentPreviews,
      [cropType]: URL.createObjectURL(croppedBlob),
    }));
    setCropperState({ isOpen: false, imageSrc: null, cropType: null });
  };

  const uploadProfileImage = async (file) => {
    const data = new FormData();
    data.append("image", file);

    const response = await axios.post(
      buildApiUrl("/api/uploads/profile-image"),
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data.imageUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const nextForm = { ...form };

      if (selectedImages.profilePhoto) {
        nextForm.profile_photo_url = await uploadProfileImage(
          selectedImages.profilePhoto,
        );
      }

      if (selectedImages.banner) {
        nextForm.banner_url = await uploadProfileImage(selectedImages.banner);
      }

      const response = await axios.put(
        buildApiUrl("/api/profile/me"),
        nextForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...oldUser,
        username: response.data.user.username,
        email: response.data.user.email,
        profile_photo_url: response.data.user.profile_photo_url,
        banner_url: response.data.user.banner_url,
        profile_photo_position: response.data.user.profile_photo_position,
        banner_position: response.data.user.banner_position,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfile((currentProfile) => ({
        ...currentProfile,
        username: response.data.user.username,
        email: response.data.user.email,
        profile_photo_url: response.data.user.profile_photo_url,
        banner_url: response.data.user.banner_url,
        profile_photo_position: response.data.user.profile_photo_position,
        banner_position: response.data.user.banner_position,
      }));
      setForm((currentForm) => ({
        ...currentForm,
        password: "",
        profile_photo_url: response.data.user.profile_photo_url || "",
        banner_url: response.data.user.banner_url || "",
        profile_photo_position:
          response.data.user.profile_photo_position || "50% 50%",
        banner_position: response.data.user.banner_position || "50% 50%",
      }));
      setSelectedImages({ profilePhoto: null, banner: null });
      setImagePreviews({ profilePhoto: "", banner: "" });
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

      <section
        className="profile-banner"
        style={
          bannerUrl
            ? {
                "--profile-banner-image": `url(${bannerUrl})`,
                "--profile-banner-position": bannerPosition,
              }
            : undefined
        }
      >
        <button
          className="profile-banner__edit"
          type="button"
          onClick={openEditModal}
        >
          <FaEdit />
          Edit Banner
        </button>
      </section>

      <section className="profile-shell">
        <div className="profile-summary">
          <div className="profile-avatar-wrap">
            <div
              className={`profile-avatar ${profilePhotoUrl ? "has-image" : ""}`}
            >
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={profile?.username || "Profile"}
                  style={{ objectPosition: profilePhotoPosition }}
                />
              ) : (
                getInitial(profile?.username)
              )}
            </div>
            <button
              className="profile-avatar__edit"
              type="button"
              onClick={openEditModal}
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
            <button type="button" onClick={openEditModal}>
              <FaEdit />
              Edit Profil
            </button>
            <span>
              <FaCrown />
              Premium
            </span>
          </div>
        </div>

        {message && (
          <p className="profile-alert profile-alert--success">{message}</p>
        )}
        {errorMessage && <p className="profile-alert">{errorMessage}</p>}

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
                  {
                    label: "Rata-rata Rating",
                    value: reviewSummary.average_rating * 20,
                  },
                  {
                    label: "Review",
                    value: Math.min(reviewSummary.review_count * 12, 100),
                  },
                  {
                    label: "Reply",
                    value: Math.min(reviewSummary.reply_count * 12, 100),
                  },
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

      {isEditing && (
        <div
          className="profile-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-edit-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              cancelEdit();
            }
          }}
        >
          <form className="profile-edit-dialog" onSubmit={handleSubmit}>
            <div className="profile-edit-dialog__header">
              <div>
                <span>Edit Profile</span>
                <h2 id="profile-edit-title">Perbarui informasi akun</h2>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                aria-label="Tutup"
              >
                <FaTimes />
              </button>
            </div>

            <div className="profile-edit-dialog__preview">
              <div
                className="profile-edit-dialog__banner"
                style={
                  editBannerPreview
                    ? {
                        "--profile-edit-banner-image": `url(${editBannerPreview})`,
                        "--profile-edit-banner-position": "center",
                      }
                    : undefined
                }
              >
                <label htmlFor="upload-banner">
                  <FaEdit />
                  Edit Banner
                  <input
                    id="upload-banner"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => handleImageChange(event, "banner")}
                  />
                </label>
              </div>
              <div
                className={`profile-edit-dialog__avatar ${editPhotoPreview ? "has-image" : ""}`}
              >
                {editPhotoPreview ? (
                  <img
                    src={editPhotoPreview}
                    alt="Preview profile"
                    style={{ objectPosition: "center" }}
                  />
                ) : (
                  getInitial(form.username)
                )}
              </div>
              <label
                htmlFor="upload-photo"
                className="profile-edit-dialog__photo-button"
              >
                <FaEdit />
                Edit Foto Profile
                <input
                  id="upload-photo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => handleImageChange(event, "profilePhoto")}
                />
              </label>
            </div>

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

            <div className="profile-edit-dialog__actions">
              <button type="button" onClick={cancelEdit} disabled={saving}>
                Batal
              </button>
              <button type="submit" disabled={saving}>
                <FaSave />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {cropperState.isOpen && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          aspectRatio={cropperState.cropType === "banner" ? 3 : 1}
          onCropComplete={handleCropComplete}
          onCancel={() =>
            setCropperState({ isOpen: false, imageSrc: null, cropType: null })
          }
        />
      )}

      <Footer />
    </main>
  );
}

export default ProfilePage;
