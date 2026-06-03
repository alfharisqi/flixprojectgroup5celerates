import pool from "../config/db.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(Number(value || 0));

const safeRows = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch {
    return [];
  }
};

const safeCount = async (query, params = []) => {
  const rows = await safeRows(query, params);
  return Number(rows[0]?.count || rows[0]?.total || 0);
};

const getTmdbAuth = () => {
  const credential = process.env.TMDB_API_KEY?.trim();

  if (!credential) {
    return null;
  }

  if (credential.startsWith("eyJ")) {
    return {
      headers: {
        Authorization: `Bearer ${credential}`,
        accept: "application/json",
      },
      apiKey: null,
    };
  }

  return {
    headers: {
      accept: "application/json",
    },
    apiKey: credential,
  };
};

const fetchTmdbMedia = async (mediaType, tmdbId) => {
  const auth = getTmdbAuth();

  if (!auth || !tmdbId) {
    return null;
  }

  const params = new URLSearchParams({ language: "id-ID" });

  if (auth.apiKey) {
    params.set("api_key", auth.apiKey);
  }

  const path = mediaType === "tv" ? "tv" : "movie";
  const response = await fetch(`${TMDB_BASE_URL}/${path}/${tmdbId}?${params.toString()}`, {
    headers: auth.headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const enrichMediaRows = async (rows) =>
  Promise.all(
    rows.map(async (row) => {
      const detail = await fetchTmdbMedia(row.media_type, row.tmdb_id).catch(() => null);
      const title =
        detail?.title ||
        detail?.name ||
        `${row.media_type === "tv" ? "Series" : "Film"} #${row.tmdb_id}`;
      const releaseDate = detail?.release_date || detail?.first_air_date || "";
      const genres = (detail?.genres || []).map((genre) => genre.name).filter(Boolean);
      const poster = detail?.poster_path ? `${TMDB_IMAGE_BASE_URL}${detail.poster_path}` : null;
      const rating = Number(row.average_rating || detail?.vote_average || 0);

      return {
        no: Number(row.row_number || 0),
        id: Number(row.tmdb_id),
        mediaType: row.media_type,
        title,
        year: releaseDate ? releaseDate.slice(0, 4) : "-",
        genre: genres.length ? genres.slice(0, 2).join(", ") : "-",
        rating: rating ? rating.toFixed(1) : "-",
        watchlist: formatNumber(row.interaction_count),
        status: "Aktif",
        poster,
      };
    }),
  );

const getRelativeTime = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit yang lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} jam yang lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays} hari yang lalu`;
};

const getChartData = async () => {
  const rows = await safeRows(`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', CURRENT_DATE) - interval '11 months',
        date_trunc('month', CURRENT_DATE),
        interval '1 month'
      ) AS month_start
    )
    SELECT
      EXTRACT(MONTH FROM months.month_start)::INTEGER AS month_number,
      COALESCE(COUNT(u.id_user), 0)::INTEGER AS value
    FROM months
    LEFT JOIN flix.users u
      ON date_trunc('month', u.created_at) = months.month_start
    GROUP BY months.month_start
    ORDER BY months.month_start ASC
  `);

  if (!rows.length) {
    const now = new Date();

    return Array.from({ length: 12 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);

      return {
        month: monthLabels[month.getMonth()],
        value: 0,
      };
    });
  }

  return rows.map((row) => ({
    month: monthLabels[Number(row.month_number) - 1] || "-",
    value: Number(row.value || 0),
  }));
};

const getRecentActivities = async () => {
  const [users, movieReviews, tvReviews, posts, reportNotifications] =
    await Promise.all([
      safeRows(`
        SELECT 'User baru mendaftar' AS title, created_at, 'user' AS icon
        FROM flix.users
        ORDER BY created_at DESC
        LIMIT 5
      `),
      safeRows(`
        SELECT 'Review film baru' AS title, created_at, 'review' AS icon
        FROM flix.movie_reviews
        WHERE parent_review_id IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      `),
      safeRows(`
        SELECT 'Review series baru' AS title, created_at, 'review' AS icon
        FROM flix.tv_series_reviews
        WHERE parent_review_id IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      `),
      safeRows(`
        SELECT 'Post terbaru' AS title, created_at, 'community' AS icon
        FROM flix.posts
        ORDER BY created_at DESC
        LIMIT 5
      `),
      safeRows(`
        SELECT 'Konten dilaporkan' AS title, created_at, 'report' AS icon
        FROM flix.notifications
        WHERE notification_type ILIKE '%report%'
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

  return [...users, ...movieReviews, ...tvReviews, ...posts, ...reportNotifications]
    .filter((activity) => activity.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
    .map((activity) => ({
      title: activity.title,
      time: getRelativeTime(activity.created_at),
      icon: activity.icon,
    }));
};

const getTopMediaRows = async () =>
  safeRows(`
    WITH media_activity AS (
      SELECT
        'movie' AS media_type,
        tmdb_movie_id AS tmdb_id,
        COUNT(*)::INTEGER AS interaction_count,
        ROUND(AVG(rating)::numeric, 1) AS average_rating
      FROM flix.movie_reviews
      WHERE parent_review_id IS NULL
      GROUP BY tmdb_movie_id

      UNION ALL

      SELECT
        'tv' AS media_type,
        tmdb_series_id AS tmdb_id,
        COUNT(*)::INTEGER AS interaction_count,
        ROUND(AVG(rating)::numeric, 1) AS average_rating
      FROM flix.tv_series_reviews
      WHERE parent_review_id IS NULL
      GROUP BY tmdb_series_id
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY interaction_count DESC, tmdb_id ASC) AS row_number,
      media_type,
      tmdb_id,
      interaction_count,
      average_rating
    FROM media_activity
    ORDER BY interaction_count DESC, tmdb_id ASC
    LIMIT 10
  `);

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      movieContentCount,
      tvContentCount,
      activeUserCount,
      communityPostCount,
      moderationCount,
      chart,
      activities,
      topMediaRows,
    ] = await Promise.all([
      safeCount(`
        SELECT COUNT(DISTINCT tmdb_movie_id)::INTEGER AS count
        FROM flix.movie_reviews
      `),
      safeCount(`
        SELECT COUNT(DISTINCT tmdb_series_id)::INTEGER AS count
        FROM flix.tv_series_reviews
      `),
      safeCount(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.users
      `),
      safeCount(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.posts
      `),
      safeCount(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.notifications
        WHERE notification_type ILIKE '%report%'
          AND is_read = FALSE
      `),
      getChartData(),
      getRecentActivities(),
      getTopMediaRows(),
    ]);

    const watchlistMovies = await enrichMediaRows(topMediaRows);
    const totalContentCount = movieContentCount + tvContentCount;

    return res.json({
      message: "Dashboard admin berhasil dimuat",
      user: req.user,
      stats: [
        {
          value: formatNumber(totalContentCount),
          label: "Film dan Series Direview",
        },
        {
          value: formatNumber(activeUserCount),
          label: "Total User Aktif",
        },
        {
          value: formatNumber(communityPostCount),
          label: "Community Post",
        },
        {
          value: formatNumber(moderationCount),
          label: "Laporan Masuk",
        },
      ],
      chart,
      activities,
      watchlistMovies,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil dashboard admin",
      error: error.message,
    });
  }
};
