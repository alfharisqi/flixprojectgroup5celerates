import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaBookmark,
  FaFacebookF,
  FaRegBookmark,
  FaRegStar,
  FaShareAlt,
  FaStar,
  FaThumbsUp,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "../components/SiteNavbar";
import amazonPrimeVideoIcon from "../assets/platformstream-logo/amazonprimevideo-icon.png";
import appleTvIcon from "../assets/platformstream-logo/appletv-icon.png";
import catchplayIcon from "../assets/platformstream-logo/catchplay-icon.png";
import disneyHotstarIcon from "../assets/platformstream-logo/disneyhotstar-icon.png";
import hboMaxIcon from "../assets/platformstream-logo/HBOmax-icon.png";
import netflixIcon from "../assets/platformstream-logo/netflix-icon.png";
import "./MovieDetail.css";

const apiUrl = import.meta.env.VITE_API_URL;

const providerIconMatchers = [
  {
    icon: netflixIcon,
    matches: ["netflix"],
  },
  {
    icon: disneyHotstarIcon,
    matches: ["disney", "hotstar"],
  },
  {
    icon: hboMaxIcon,
    matches: ["hbo", "max"],
  },
  {
    icon: catchplayIcon,
    matches: ["catchplay"],
  },
  {
    icon: appleTvIcon,
    matches: ["apple tv"],
  },
  {
    icon: amazonPrimeVideoIcon,
    matches: ["amazon", "prime video"],
  },
];

const getLocalProviderIcon = (providerName = "") => {
  const normalizedName = providerName.toLowerCase();
  const match = providerIconMatchers.find(({ matches }) =>
    matches.some((keyword) => normalizedName.includes(keyword))
  );

  return match?.icon || null;
};

const formatRuntime = (minutes) => {
  if (!minutes) {
    return "-";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}j ${remainingMinutes}m`;
};

const getYear = (date) => date?.slice(0, 4) || "-";

const buildGenrePath = (genre, media = "movie") => {
  const params = new URLSearchParams({
    media,
    genre: String(genre.id),
    name: genre.name,
  });

  return `/genre?${params.toString()}`;
};

const getWatchlistKey = (user) =>
  `flix_movie_watchlist_${user?.id_user || "guest"}`;

const readWatchlist = (key) => {
  try {
    const savedWatchlist = JSON.parse(localStorage.getItem(key));
    return Array.isArray(savedWatchlist) ? savedWatchlist : [];
  } catch {
    return [];
  }
};

const mapMovieToWatchlist = (movie) => ({
  id: movie.id,
  title: movie.title || movie.original_title || "Untitled",
  year: getYear(movie.release_date),
  rating: formatRating(movie.vote_average),
  poster: movie.poster_url,
  backdrop: movie.backdrop_url || movie.poster_url,
  overview: movie.overview,
  releaseLabel: movie.release_date || "-",
  providers: [],
  genre_ids: movie.genre_ids || (movie.genres || []).map((genre) => genre.id),
});

const formatRating = (rating) => {
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating)) {
    return "0.0";
  }

  return (numericRating / 2).toFixed(1);
};

const formatReviewDate = (dateValue) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const buildReviewTree = (reviews) => {
  const roots = [];
  const reviewMap = new Map();

  reviews.forEach((review) => {
    reviewMap.set(review.id_review, {
      ...review,
      replies: [],
    });
  });

  reviewMap.forEach((review) => {
    if (review.parent_review_id && reviewMap.has(review.parent_review_id)) {
      reviewMap.get(review.parent_review_id).replies.push(review);
      return;
    }

    roots.push(review);
  });

  return roots;
};

function RatingStars({ value, onChange, readonly = false }) {
  return (
    <div className="movie-stars" aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= value;

        if (readonly) {
          return isActive ? <FaStar key={star} /> : <FaRegStar key={star} />;
        }

        return (
          <button
            className={isActive ? "is-active" : ""}
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Beri rating ${star}`}
          >
            {isActive ? <FaStar /> : <FaRegStar />}
          </button>
        );
      })}
    </div>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const [movie, setMovie] = useState(null);
  const watchlistKey = useMemo(() => getWatchlistKey(user), [user]);
  const [watchlist, setWatchlist] = useState(() => readWatchlist(watchlistKey));
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    average_rating: 0,
    review_count: 0,
  });
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [activeTab, setActiveTab] = useState("synopsis");
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [showSynopsisToggle, setShowSynopsisToggle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const synopsisRef = useRef(null);

  const reviewTree = useMemo(() => buildReviewTree(reviews), [reviews]);
  const audienceRating = Number(reviewSummary.average_rating || 0);
  const detailRating = audienceRating || Number(formatRating(movie?.vote_average));
  const ratingPercent = Math.min((detailRating / 5) * 100, 100);
  const savedMovieIds = useMemo(
    () => new Set(watchlist.map((savedMovie) => String(savedMovie.id))),
    [watchlist],
  );
  const isSaved = savedMovieIds.has(String(movie?.id));

  const fetchMovie = async () => {
    const res = await axios.get(`${apiUrl}/api/movies/${id}`, {
      params: { language: "id-ID" },
    });
    setMovie(res.data);
  };

  const fetchReviews = async () => {
    const res = await axios.get(`${apiUrl}/api/movie-reviews/${id}`);
    setReviews(res.data.reviews || []);
    setReviewSummary(res.data.summary || { average_rating: 0, review_count: 0 });
  };

  useEffect(() => {
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
  }, [watchlist, watchlistKey]);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        await Promise.all([fetchMovie(), fetchReviews()]);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Gagal memuat detail film");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  useEffect(() => {
    if (activeTab !== "synopsis" || !movie?.overview) {
      setShowSynopsisToggle(false);
      setIsSynopsisExpanded(false);
      return undefined;
    }

    let frameId = 0;

    const measureSynopsis = () => {
      const element = synopsisRef.current;

      if (!element) {
        return;
      }

      const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight);
      const previousDisplay = element.style.display;
      const previousOverflow = element.style.overflow;
      const previousLineClamp = element.style.webkitLineClamp;
      const previousBoxOrient = element.style.webkitBoxOrient;

      element.style.display = "block";
      element.style.overflow = "visible";
      element.style.webkitLineClamp = "unset";
      element.style.webkitBoxOrient = "initial";

      const fullHeight = element.scrollHeight;
      const maxCollapsedHeight = lineHeight * 5;

      element.style.display = previousDisplay;
      element.style.overflow = previousOverflow;
      element.style.webkitLineClamp = previousLineClamp;
      element.style.webkitBoxOrient = previousBoxOrient;

      setShowSynopsisToggle(fullHeight > maxCollapsedHeight + 2);
    };

    setIsSynopsisExpanded(false);
    frameId = window.requestAnimationFrame(measureSynopsis);
    window.addEventListener("resize", measureSynopsis);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureSynopsis);
    };
  }, [activeTab, movie?.overview]);

  const toggleWatchlist = () => {
    if (!movie) {
      return;
    }

    const watchlistMovie = mapMovieToWatchlist(movie);

    setWatchlist((currentWatchlist) => {
      const movieId = String(watchlistMovie.id);

      if (currentWatchlist.some((savedMovie) => String(savedMovie.id) === movieId)) {
        return currentWatchlist.filter((savedMovie) => String(savedMovie.id) !== movieId);
      }

      return [watchlistMovie, ...currentWatchlist].slice(0, 20);
    });
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!token) {
      alert("Silakan login untuk menulis review");
      return;
    }

    if (!reviewContent.trim()) {
      return;
    }

    await axios.post(
      `${apiUrl}/api/movie-reviews/${id}`,
      {
        content: reviewContent,
        rating: reviewRating,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setReviewContent("");
    setReviewRating(5);
    await fetchReviews();
  };

  const handleSubmitReply = async (event, parentReviewId) => {
    event.preventDefault();

    if (!token) {
      alert("Silakan login untuk membalas review");
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    await axios.post(
      `${apiUrl}/api/movie-reviews/${id}`,
      {
        content: replyContent,
        parent_review_id: parentReviewId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setReplyContent("");
    setActiveReplyId(null);
    await fetchReviews();
  };

  const handleLikeReview = async (reviewId) => {
    if (!token) {
      alert("Silakan login untuk like review");
      return;
    }

    await axios.post(
      `${apiUrl}/api/movie-reviews/likes/${reviewId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    await fetchReviews();
  };

  if (loading) {
    return <main className="movie-detail-page movie-detail-state">Memuat detail film...</main>;
  }

  if (errorMessage || !movie) {
    return (
      <main className="movie-detail-page movie-detail-state">
        {errorMessage || "Film tidak ditemukan"}
      </main>
    );
  }

  const backdrop = movie.backdrop_url || movie.poster_url;
  const cast = movie.cast || [];
  const watchProviders = movie.watch_providers?.all || [];
  const visibleWatchProviders = watchProviders.slice(0, 6);
  const hasWatchProviders = visibleWatchProviders.length > 0;

  return (
    <main className="movie-detail-page">
      <SiteNavbar mode="absolute" activeKey="movies" />

      <section
        className="movie-detail-hero"
        style={{ "--movie-backdrop": `url(${backdrop})` }}
      >
        <div className="movie-detail-container movie-detail-hero-content">
          <div className="movie-detail-copy">
            <h1>{movie.title}</h1>
            <div className="movie-detail-meta">
              <span>{getYear(movie.release_date)}</span>
              <span>{formatRuntime(movie.runtime)}</span>
              <span>Language: {movie.original_language?.toUpperCase() || "-"}</span>
            </div>

            <div className="movie-detail-buttons">
              <button type="button" onClick={toggleWatchlist}>
                {isSaved ? <FaBookmark /> : <FaRegBookmark />}
                {isSaved ? "Tersimpan di Watchlist" : "Simpan ke Watchlist"}
              </button>
              <button type="button" aria-label="Bagikan film">
                <FaShareAlt />
              </button>
            </div>
          </div>

          <article className="movie-detail-poster-card">
            <img src={movie.poster_url} alt={movie.title} />
            <div className="movie-detail-poster-meta">
              <span>
                <FaStar />
                {formatRating(movie.vote_average)}
              </span>
              <span>{getYear(movie.release_date)}</span>
            </div>
            <h2>{movie.title}</h2>
          </article>
        </div>
      </section>

      <section className="movie-detail-info movie-detail-container">
        <div className="movie-detail-genre-block">
          <h3>Genre</h3>
          <div className="movie-detail-tags">
            {(movie.genres || []).slice(0, 4).map((genre) => (
              <Link key={genre.id} to={buildGenrePath(genre, "movie")}>
                {genre.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="movie-detail-provider-block">
          <h3>Tersedia Di</h3>
          {hasWatchProviders ? (
            <div className="movie-detail-providers">
              {visibleWatchProviders.map((provider) => {
                const providerIcon =
                  getLocalProviderIcon(provider.provider_name) || provider.logo_url;

                return (
                  <a
                    className="movie-detail-provider"
                    href={movie.watch_providers.link || "#"}
                    key={provider.provider_id}
                    target="_blank"
                    rel="noreferrer"
                    title={provider.provider_name}
                    aria-label={`Lihat ${movie.title} di ${provider.provider_name}`}
                  >
                    {providerIcon ? (
                      <img src={providerIcon} alt={provider.provider_name} />
                    ) : (
                      <span>{provider.provider_name}</span>
                    )}
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="movie-detail-provider-empty">
              Belum tersedia di region {movie.watch_providers?.region || "ID"}.
            </p>
          )}
        </div>
      </section>

      <section className="movie-detail-main movie-detail-container">
        <div className="movie-detail-tabs">
          <button
            className={activeTab === "synopsis" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveTab("synopsis")}
          >
            Sinopsis
          </button>
          <button
            className={activeTab === "review" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveTab("review")}
          >
            Review
          </button>
        </div>

        <div className="movie-detail-content-grid">
          <div>
            {activeTab === "synopsis" ? (
              <>
                <p
                  className={`movie-detail-synopsis ${
                    showSynopsisToggle && !isSynopsisExpanded ? "is-clamped" : ""
                  }`}
                  ref={synopsisRef}
                >
                  {movie.overview || "Sinopsis belum tersedia."}
                </p>
                {showSynopsisToggle && (
                  <button
                    className="movie-detail-more"
                    type="button"
                    onClick={() => setIsSynopsisExpanded((current) => !current)}
                  >
                    {isSynopsisExpanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
                  </button>
                )}
              </>
            ) : (
              <p className="movie-detail-synopsis">
                Review penonton membantu menentukan rekomendasi dan rating film ini.
              </p>
            )}

            <div className="movie-detail-cast">
              <h3>Pemeran Utama</h3>
              <div className="movie-detail-cast-list">
                {cast.map((person) => (
                  <article key={`${person.id}-${person.character}`}>
                    <img
                      src={person.profile_url || "https://placehold.co/96x96/444/fff?text=FLIX"}
                      alt={person.name}
                    />
                    <h4>{person.name}</h4>
                    <p>{person.character || "-"}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="movie-detail-score">
            <div
              className="movie-detail-score-ring"
              style={{ "--score-percent": `${ratingPercent}%` }}
            >
              <span>
                <FaStar />
                {detailRating.toFixed(1)}
              </span>
            </div>
            <p>{reviewSummary.review_count} review penonton</p>
          </div>
        </div>
      </section>

      <section className="movie-review-section movie-detail-container">
        <h2>Review Penonton</h2>

        <form className="movie-review-form" onSubmit={handleSubmitReview}>
          <div className="movie-review-form-top">
            <textarea
              maxLength={500}
              placeholder="Bagikan pendapatmu tentang film ini..."
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
            />
            <button type="submit">Kirim</button>
          </div>
          <div className="movie-review-form-bottom">
            <RatingStars value={reviewRating} onChange={setReviewRating} />
            <span>{reviewContent.length}/500 karakter</span>
          </div>
        </form>

        <div className="movie-review-list">
          {reviewTree.length > 0 ? (
            reviewTree.map((review) => (
              <article className="movie-review-item" key={review.id_review}>
                <div className="movie-review-header">
                  <div className="movie-review-user">
                    <div className="movie-review-avatar">
                      {review.username?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3>{review.username}</h3>
                      <p>{formatReviewDate(review.created_at)}</p>
                    </div>
                  </div>
                  <RatingStars value={review.rating || 0} readonly />
                </div>
                <p className="movie-review-content">{review.content}</p>
                <div className="movie-review-actions">
                  <button type="button" onClick={() => handleLikeReview(review.id_review)}>
                    <FaThumbsUp />
                    {review.like_count || 0}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveReplyId(
                        activeReplyId === review.id_review ? null : review.id_review,
                      )
                    }
                  >
                    Reply
                  </button>
                </div>

                {review.replies.length > 0 && (
                  <div className="movie-review-replies">
                    {review.replies.map((reply) => (
                      <article className="movie-review-reply" key={reply.id_review}>
                        <div className="movie-review-user">
                          <div className="movie-review-avatar">
                            {reply.username?.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h3>{reply.username}</h3>
                            <p>{formatReviewDate(reply.created_at)}</p>
                          </div>
                        </div>
                        <p className="movie-review-content">{reply.content}</p>
                        <button
                          className="movie-review-like-mini"
                          type="button"
                          onClick={() => handleLikeReview(reply.id_review)}
                        >
                          <FaThumbsUp />
                          {reply.like_count || 0}
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                {activeReplyId === review.id_review && (
                  <form
                    className="movie-reply-form"
                    onSubmit={(event) => handleSubmitReply(event, review.id_review)}
                  >
                    <div className="movie-review-avatar">
                      {user?.username?.slice(0, 1).toUpperCase() || "?"}
                    </div>
                    <input
                      placeholder="Reply..."
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                    />
                    <button type="submit">Kirim</button>
                  </form>
                )}
              </article>
            ))
          ) : (
            <p className="movie-review-empty">Belum ada review untuk film ini.</p>
          )}
        </div>
      </section>

      <footer className="movie-detail-footer">
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/movies">Movie</Link>
          <Link to="/tv-series">TV Series</Link>
          <Link to="/genre">Genre</Link>
          <Link to="/community">Community</Link>
        </nav>
        <div>
          <FaFacebookF />
          <FaTwitter />
          <FaYoutube />
        </div>
        <p>Copyright 2026 - Kelompok 5</p>
      </footer>
    </main>
  );
}

export default MovieDetail;
