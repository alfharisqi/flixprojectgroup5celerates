import pool from "../config/db.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const chartActivityOptions = {
  login: {
    label: "Login",
    sourceQuery: `
      SELECT created_at
      FROM flix.users
    `,
  },
  review: {
    label: "Review",
    sourceQuery: `
      SELECT created_at
      FROM flix.movie_reviews
      WHERE parent_review_id IS NULL
      UNION ALL
      SELECT created_at
      FROM flix.tv_series_reviews
      WHERE parent_review_id IS NULL
    `,
  },
  community: {
    label: "Community",
    sourceQuery: `
      SELECT created_at
      FROM flix.posts
    `,
  },
  report: {
    label: "Report",
    sourceQuery: `
      SELECT created_at
      FROM flix.reports
    `,
  },
};

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(Number(value || 0));

const formatDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const reportCategoryLabels = {
  spam: "Spam / promosi",
  harassment: "Pelecehan / bullying",
  hate_speech: "Ujaran kebencian",
  violence: "Kekerasan / ancaman",
  sexual_content: "Konten seksual",
  misinformation: "Informasi salah",
  spoiler: "Spoiler tanpa peringatan",
  copyright: "Pelanggaran hak cipta",
  other: "Lainnya",
};

const formatReportCategory = (category) =>
  reportCategoryLabels[category] || "Konten bermasalah";

const formatReportStatus = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "approved") return "Disetujui";
  if (normalizedStatus === "rejected") return "Ditolak";
  if (normalizedStatus === "reviewed") return "Ditinjau";
  return "Pending";
};

const normalizeReviewReportStatus = (status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["blocked", "approved", "terblokir", "blokir"].includes(normalizedStatus)) {
    return "approved";
  }

  if (["rejected", "ditolak", "tolak"].includes(normalizedStatus)) {
    return "rejected";
  }

  if (normalizedStatus === "pending") {
    return "pending";
  }

  return null;
};

const formatReviewReportStatus = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "approved") return "Terblokir";
  if (normalizedStatus === "rejected") return "Ditolak";
  if (normalizedStatus === "reviewed") return "Ditinjau";
  return "Pending";
};

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
        reviewCount: formatNumber(row.interaction_count),
        status: "Aktif",
        poster,
      };
    }),
  );

const normalizeTextArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const normalizeMovieStatus = (status) =>
  ["draf", "draft"].includes(String(status || "Published").trim().toLowerCase())
    ? "Draft"
    : "Published";

const normalizeMovieRating = (rating) => {
  if (rating === null || rating === undefined || rating === "") {
    return null;
  }

  const parsedRating = Number(String(rating).replace(",", "."));

  if (!Number.isFinite(parsedRating)) {
    return null;
  }

  return Math.min(10, Math.max(0, parsedRating));
};

const mapAdminMovieRow = (row) => {
  const genres = Array.isArray(row.genres) ? row.genres.filter(Boolean) : [];
  const rating = normalizeMovieRating(row.rating);

  return {
    no: Number(row.row_number || 0),
    id: Number(row.id_admin_movie),
    mediaType: "movie",
    title: row.title,
    year: row.release_year || "-",
    genre: genres.length ? genres.slice(0, 2).join(", ") : "-",
    genres,
    rating: rating === null ? "-" : rating.toFixed(1),
    watchlist: formatNumber(row.watchlist_count || 0),
    reviewCount: "0",
    status: normalizeMovieStatus(row.status),
    poster: row.poster_url || null,
    duration: row.duration || "",
    director: row.director || "",
    synopsis: row.synopsis || "",
    cast: Array.isArray(row.cast_members) ? row.cast_members.join(", ") : "",
    country: row.country || "",
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    moods: Array.isArray(row.moods) ? row.moods : [],
    trailerUrl: row.trailer_url || "",
    createdAt: row.created_at || null,
  };
};

const getAdminMoviePayload = (body = {}) => {
  const title = String(body?.title || "").trim();

  if (!title) {
    return {
      error: "Judul film wajib diisi",
    };
  }

  return {
    title,
    releaseYear: String(body?.year || body?.releaseYear || "").trim() || null,
    duration: String(body?.duration || "").trim() || null,
    director: String(body?.director || "").trim() || null,
    synopsis: String(body?.synopsis || "").trim() || null,
    castMembers: normalizeTextArray(body?.cast || body?.castMembers),
    posterUrl: String(body?.posterUrl || body?.poster || "").trim() || null,
    trailerUrl: String(body?.trailerUrl || "").trim() || null,
    rating: normalizeMovieRating(body?.rating),
    country: String(body?.country || "").trim() || null,
    genres: normalizeTextArray(body?.genres),
    platforms: normalizeTextArray(body?.platforms),
    moods: normalizeTextArray(body?.moods),
    status: normalizeMovieStatus(body?.status),
  };
};

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

const getEmptyYearChart = () =>
  monthLabels.map((month) => ({
    month,
    value: 0,
  }));

const getChartData = async ({ activity = "login", year = new Date().getFullYear() } = {}) => {
  const selectedActivity = chartActivityOptions[activity] ? activity : "login";
  const selectedYear = Number.parseInt(year, 10);
  const chartYear = Number.isInteger(selectedYear)
    ? Math.min(Math.max(selectedYear, 2000), new Date().getFullYear() + 1)
    : new Date().getFullYear();
  const { sourceQuery } = chartActivityOptions[selectedActivity];
  const rows = await safeRows(`
    WITH months AS (
      SELECT generate_series(
        make_date($1::INTEGER, 1, 1),
        make_date($1::INTEGER, 12, 1),
        interval '1 month'
      ) AS month_start
    ),
    events AS (
      ${sourceQuery}
    )
    SELECT
      EXTRACT(MONTH FROM months.month_start)::INTEGER AS month_number,
      COALESCE(COUNT(events.created_at), 0)::INTEGER AS value
    FROM months
    LEFT JOIN events
      ON date_trunc('month', events.created_at) = months.month_start
    GROUP BY months.month_start
    ORDER BY months.month_start ASC
  `, [chartYear]);

  if (!rows.length) {
    return getEmptyYearChart();
  }

  return rows.map((row) => ({
    month: monthLabels[Number(row.month_number) - 1] || "-",
    value: Number(row.value || 0),
  }));
};

const getRecentActivities = async () => {
  const [latestUserRows, movieReviewRows, tvReviewRows, latestPostRows, reportRows, reportCount] =
    await Promise.all([
      safeRows(`
        SELECT created_at
        FROM flix.users
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeRows(`
        SELECT created_at
        FROM flix.movie_reviews
        WHERE parent_review_id IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeRows(`
        SELECT created_at
        FROM flix.tv_series_reviews
        WHERE parent_review_id IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeRows(`
        SELECT created_at
        FROM flix.posts
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeRows(`
        SELECT created_at
        FROM flix.reports
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeCount(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.reports
      `),
    ]);

  const latestReview = [...movieReviewRows, ...tvReviewRows]
    .filter((activity) => activity.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const latestReport = reportRows[0];

  return [
    {
      title: "User baru mendaftar",
      time: latestUserRows[0]?.created_at ? getRelativeTime(latestUserRows[0].created_at) : "Belum ada user",
      icon: "user",
    },
    {
      title: "Review terbaru",
      time: latestReview?.created_at ? getRelativeTime(latestReview.created_at) : "Belum ada review",
      icon: "review",
    },
    {
      title: "Community Post terbaru",
      time: latestPostRows[0]?.created_at ? getRelativeTime(latestPostRows[0].created_at) : "Belum ada post",
      icon: "community",
    },
    {
      title: "Report masuk terakhir",
      time: latestReport?.created_at
        ? `${formatNumber(reportCount)} laporan - ${getRelativeTime(latestReport.created_at)}`
        : `${formatNumber(reportCount)} laporan`,
      icon: "report",
    },
  ];
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

const getManagedMediaRows = async () =>
  safeRows(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY created_at DESC, id_admin_movie DESC) AS row_number,
      id_admin_movie,
      title,
      release_year,
      duration,
      director,
      synopsis,
      cast_members,
      poster_url,
      trailer_url,
      rating,
      country,
      genres,
      platforms,
      moods,
      status,
      0::INTEGER AS watchlist_count,
      created_at
    FROM flix.admin_movies
    ORDER BY created_at DESC, id_admin_movie DESC
    LIMIT 120
  `);

const normalizeUserRole = (roleName) => {
  if (roleName === "admin") {
    return "Admin";
  }

  if (roleName === "moderator") {
    return "Moderator";
  }

  return "User Biasa";
};

const formatAdminUserStatus = (row) => {
  if (row.is_active === false) {
    return "Nonaktif";
  }

  if (row.email_verified === false) {
    return "Belum Verifikasi";
  }

  return "Aktif";
};

const getAdminUserRows = async () =>
  safeRows(`
    SELECT
      u.id_user,
      u.username,
      u.email,
      u.email_verified,
      u.is_active,
      u.profile_image_url,
      u.created_at,
      r.role_name,
      0::INTEGER AS watchlist_count,
      COALESCE(movie_reviews.review_count, 0)::INTEGER
        + COALESCE(tv_reviews.review_count, 0)::INTEGER AS review_count,
      COALESCE(posts.post_count, 0)::INTEGER AS post_count,
      COALESCE(replies.reply_count, 0)::INTEGER AS reply_count
    FROM flix.users u
    JOIN flix.roles r ON u.id_role = r.id_role
    LEFT JOIN (
      SELECT id_user, COUNT(*)::INTEGER AS review_count
      FROM flix.movie_reviews
      WHERE parent_review_id IS NULL
      GROUP BY id_user
    ) movie_reviews ON u.id_user = movie_reviews.id_user
    LEFT JOIN (
      SELECT id_user, COUNT(*)::INTEGER AS review_count
      FROM flix.tv_series_reviews
      WHERE parent_review_id IS NULL
      GROUP BY id_user
    ) tv_reviews ON u.id_user = tv_reviews.id_user
    LEFT JOIN (
      SELECT id_user, COUNT(*)::INTEGER AS post_count
      FROM flix.posts
      GROUP BY id_user
    ) posts ON u.id_user = posts.id_user
    LEFT JOIN (
      SELECT id_user, COUNT(*)::INTEGER AS reply_count
      FROM flix.comments
      GROUP BY id_user
    ) replies ON u.id_user = replies.id_user
    ORDER BY
      CASE
        WHEN r.role_name = 'admin' THEN 1
        WHEN r.role_name = 'moderator' THEN 2
        ELSE 3
      END,
      u.created_at DESC,
      u.username ASC
  `);

const mapAdminUsers = (rows) =>
  rows.map((row, index) => ({
    no: index + 1,
    id: Number(row.id_user),
    username: row.username,
    email: row.email,
    role: row.role_name,
    roleLabel: normalizeUserRole(row.role_name),
    status: formatAdminUserStatus(row),
    isActive: row.is_active !== false,
    joinedAt: formatDate(row.created_at),
    profileImageUrl: row.profile_image_url,
    activities: {
      watchlist: Number(row.watchlist_count || 0),
      review: Number(row.review_count || 0),
      post: Number(row.post_count || 0),
      reply: Number(row.reply_count || 0),
    },
  }));

const mapReviewMediaRows = async (rows) =>
  Promise.all(
    rows.map(async (row) => {
      const detail = await fetchTmdbMedia(row.media_type, row.tmdb_id).catch(() => null);
      const title =
        detail?.title ||
        detail?.name ||
        `${row.media_type === "tv" ? "Series" : "Film"} #${row.tmdb_id}`;
      const releaseDate = detail?.release_date || detail?.first_air_date || "";
      const poster = detail?.poster_path ? `${TMDB_IMAGE_BASE_URL}${detail.poster_path}` : null;

      return {
        id: Number(row.id_review),
        mediaType: row.media_type,
        mediaId: Number(row.tmdb_id),
        title,
        year: releaseDate ? releaseDate.slice(0, 4) : "-",
        content: row.content,
        rating: Number(row.rating || 0),
        status: "Disetujui",
        createdAt: row.created_at,
        date: formatDate(row.created_at),
        poster,
      };
    }),
  );

const mapAdminReviewRows = async (rows) =>
  Promise.all(
    rows.map(async (row, index) => {
      const mediaType = row.media_type === "tv" ? "tv" : "movie";
      const mediaId = Number(row.tmdb_id || row.metadata_tmdb_id || 0);
      const detail = await fetchTmdbMedia(mediaType, mediaId).catch(() => null);
      const title =
        detail?.title ||
        detail?.name ||
        row.media_title ||
        `${mediaType === "tv" ? "Series" : "Film"} #${mediaId || "-"}`;

      return {
        no: index + 1,
        id: row.id_report
          ? `report-${row.id_report}`
          : `${mediaType}-${row.id_review || row.id_notification || index}`,
        reportId: Number(row.id_report || row.id_notification || 0),
        reviewId: Number(row.id_review || 0),
        notificationId: Number(row.id_notification || 0),
        mediaType,
        mediaId,
        title,
        content: row.content || row.metadata_content || "Review belum memiliki isi.",
        category: row.category || null,
        reason:
          row.reason || row.report_reason
            ? `${formatReportCategory(row.category)}: ${row.reason || row.report_reason}`
            : null,
        rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
        status: row.status || formatReportStatus(row.report_status) || "Menunggu",
        date: formatDate(row.created_at),
        createdAt: row.created_at,
        user: {
          id: Number(row.id_user || row.actor_user_id || 0),
          name: row.username || row.actor_username || "User FLIX",
          profileImageUrl: row.profile_image_url || row.actor_profile_image_url || null,
        },
      };
    }),
  );

const getAdminIncomingReviewRows = async () =>
  safeRows(`
    WITH reviews AS (
      SELECT
        id_review,
        'movie' AS media_type,
        tmdb_movie_id AS tmdb_id,
        id_user,
        content,
        rating,
        moderation_status,
        created_at
      FROM flix.movie_reviews
      WHERE parent_review_id IS NULL
        AND COALESCE(moderation_status, 'active') <> 'blocked'
        AND NOT EXISTS (
          SELECT 1
          FROM flix.reports report
          WHERE report.movie_review_id = flix.movie_reviews.id_review
            AND report.status = 'approved'
        )

      UNION ALL

      SELECT
        id_review,
        'tv' AS media_type,
        tmdb_series_id AS tmdb_id,
        id_user,
        content,
        rating,
        moderation_status,
        created_at
      FROM flix.tv_series_reviews
      WHERE parent_review_id IS NULL
        AND COALESCE(moderation_status, 'active') <> 'blocked'
        AND NOT EXISTS (
          SELECT 1
          FROM flix.reports report
          WHERE report.tv_series_review_id = flix.tv_series_reviews.id_review
            AND report.status = 'approved'
        )
    )
    SELECT
      reviews.*,
      users.username,
      users.profile_image_url
    FROM reviews
    JOIN flix.users users ON reviews.id_user = users.id_user
    ORDER BY reviews.created_at DESC, reviews.id_review DESC
    LIMIT 100
  `);

const getAdminReportedReviewRows = async () =>
  safeRows(`
    WITH reported_reviews AS (
      SELECT
        reports.id_report,
        reports.reporter_user_id AS actor_user_id,
        reports.category,
        reports.reason,
        reports.status AS report_status,
        reports.created_at,
        movie_reviews.id_review,
        'movie' AS media_type,
        movie_reviews.tmdb_movie_id AS tmdb_id,
        movie_reviews.content,
        movie_reviews.rating,
        movie_reviews.moderation_status
      FROM flix.reports reports
      JOIN flix.movie_reviews movie_reviews
        ON reports.movie_review_id = movie_reviews.id_review
      WHERE reports.movie_review_id IS NOT NULL

      UNION ALL

      SELECT
        reports.id_report,
        reports.reporter_user_id AS actor_user_id,
        reports.category,
        reports.reason,
        reports.status AS report_status,
        reports.created_at,
        tv_reviews.id_review,
        'tv' AS media_type,
        tv_reviews.tmdb_series_id AS tmdb_id,
        tv_reviews.content,
        tv_reviews.rating,
        tv_reviews.moderation_status
      FROM flix.reports reports
      JOIN flix.tv_series_reviews tv_reviews
        ON reports.tv_series_review_id = tv_reviews.id_review
      WHERE reports.tv_series_review_id IS NOT NULL
    )
    SELECT
      reported_reviews.*,
      reported_reviews.tmdb_id AS metadata_tmdb_id,
      reported_reviews.content AS metadata_content,
      CASE
        WHEN reported_reviews.report_status = 'approved' THEN 'Terblokir'
        WHEN reported_reviews.report_status = 'rejected' THEN 'Ditolak'
        WHEN reported_reviews.report_status = 'reviewed' THEN 'Ditinjau'
        ELSE 'Pending'
      END AS status,
      actor.username AS actor_username,
      actor.profile_image_url AS actor_profile_image_url
    FROM reported_reviews
    JOIN flix.users actor ON reported_reviews.actor_user_id = actor.id_user
    ORDER BY reported_reviews.created_at DESC
    LIMIT 100
  `);

const mapAdminCommunityRows = (rows) =>
  rows.map((row) => ({
    id: row.id_report ? `report-${row.id_report}` : Number(row.id_post),
    postId: Number(row.id_post),
    reportId: Number(row.id_report || 0),
    reportType: row.report_type || null,
    author: row.username || "User FLIX",
    profileImageUrl: row.profile_image_url || null,
    time: getRelativeTime(row.created_at),
    date: formatDate(row.created_at),
    title: row.title || "",
    content: row.content || "",
    status: row.status || "Aktif",
    reportReason: row.reason
      ? `${formatReportCategory(row.category)}: ${row.reason}`
      : null,
    reportedAt: row.report_created_at
      ? `${row.reporter_username || "User FLIX"} - ${formatDateTime(row.report_created_at)}`
      : null,
    metrics: {
      views: Number(row.view_count || 0),
      replies: Number(row.reply_count || 0),
      shares: Number(row.share_count || 0),
      likes: Number(row.like_count || 0),
      reactions: Number(row.reaction_count || 0),
    },
  }));

const getAdminCommunityRows = async () =>
  safeRows(`
    SELECT
      p.id_post,
      p.title,
      p.content,
      p.created_at,
      u.username,
      u.profile_image_url,
      COALESCE(v.view_count, 0)::INTEGER AS view_count,
      COALESCE(c.reply_count, 0)::INTEGER AS reply_count,
      COALESCE(s.share_count, 0)::INTEGER AS share_count,
      COALESCE(l.like_count, 0)::INTEGER AS like_count,
      COALESCE(r.reaction_count, 0)::INTEGER AS reaction_count
    FROM flix.posts p
    JOIN flix.users u ON p.id_user = u.id_user
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS view_count
      FROM flix.post_views
      GROUP BY id_post
    ) v ON p.id_post = v.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS reply_count
      FROM flix.comments
      GROUP BY id_post
    ) c ON p.id_post = c.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS share_count
      FROM flix.post_shares
      GROUP BY id_post
    ) s ON p.id_post = s.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS like_count
      FROM flix.post_likes
      GROUP BY id_post
    ) l ON p.id_post = l.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS reaction_count
      FROM flix.post_reactions
      GROUP BY id_post
    ) r ON p.id_post = r.id_post
    ORDER BY p.created_at DESC, p.id_post DESC
    LIMIT 100
  `);

const getAdminReportedCommunityRows = async () =>
  safeRows(`
    WITH reported_community AS (
      SELECT
        reports.id_report,
        reports.report_type,
        reports.category,
        reports.reason,
        reports.status AS report_status,
        reports.created_at AS report_created_at,
        reports.reporter_user_id,
        posts.id_post,
        posts.title,
        posts.content,
        posts.created_at,
        posts.id_user,
        'post' AS target_kind
      FROM flix.reports reports
      JOIN flix.posts posts ON reports.community_post_id = posts.id_post
      WHERE reports.community_post_id IS NOT NULL

      UNION ALL

      SELECT
        reports.id_report,
        reports.report_type,
        reports.category,
        reports.reason,
        reports.status AS report_status,
        reports.created_at AS report_created_at,
        reports.reporter_user_id,
        posts.id_post,
        posts.title,
        comments.content,
        comments.created_at,
        comments.id_user,
        'reply' AS target_kind
      FROM flix.reports reports
      JOIN flix.comments comments
        ON reports.community_comment_id = comments.id_comment
      JOIN flix.posts posts ON comments.id_post = posts.id_post
      WHERE reports.community_comment_id IS NOT NULL
    )
    SELECT
      reported_community.*,
      target_user.username,
      target_user.profile_image_url,
      reporter.username AS reporter_username,
      CASE
        WHEN reported_community.report_status = 'approved' THEN 'Disetujui'
        WHEN reported_community.report_status = 'rejected' THEN 'Ditolak'
        WHEN reported_community.report_status = 'reviewed' THEN 'Ditinjau'
        ELSE 'Dilaporkan'
      END AS status,
      COALESCE(v.view_count, 0)::INTEGER AS view_count,
      COALESCE(c.reply_count, 0)::INTEGER AS reply_count,
      COALESCE(s.share_count, 0)::INTEGER AS share_count,
      COALESCE(l.like_count, 0)::INTEGER AS like_count,
      COALESCE(r.reaction_count, 0)::INTEGER AS reaction_count
    FROM reported_community
    JOIN flix.users target_user ON reported_community.id_user = target_user.id_user
    JOIN flix.users reporter ON reported_community.reporter_user_id = reporter.id_user
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS view_count
      FROM flix.post_views
      GROUP BY id_post
    ) v ON reported_community.id_post = v.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS reply_count
      FROM flix.comments
      GROUP BY id_post
    ) c ON reported_community.id_post = c.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS share_count
      FROM flix.post_shares
      GROUP BY id_post
    ) s ON reported_community.id_post = s.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS like_count
      FROM flix.post_likes
      GROUP BY id_post
    ) l ON reported_community.id_post = l.id_post
    LEFT JOIN (
      SELECT id_post, COUNT(*) AS reaction_count
      FROM flix.post_reactions
      GROUP BY id_post
    ) r ON reported_community.id_post = r.id_post
    ORDER BY reported_community.report_created_at DESC
    LIMIT 100
  `);

const getAdminUserDetailRows = async (userId) => {
  const [
    userRows,
    reviewStatsRows,
    postCountRows,
    latestReviewRows,
    latestPostRows,
  ] = await Promise.all([
    safeRows(
      `SELECT
        u.id_user,
        u.username,
        u.email,
        u.email_verified,
        u.is_active,
        u.profile_image_url,
        u.banner_image_url,
        u.deactivated_at,
        u.created_at,
        r.role_name
       FROM flix.users u
       JOIN flix.roles r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
      [userId],
    ),
    safeRows(
      `WITH reviews AS (
        SELECT rating
        FROM flix.movie_reviews
        WHERE id_user = $1
          AND parent_review_id IS NULL

        UNION ALL

        SELECT rating
        FROM flix.tv_series_reviews
        WHERE id_user = $1
          AND parent_review_id IS NULL
      )
      SELECT
        COUNT(*)::INTEGER AS review_count,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::FLOAT AS average_rating
      FROM reviews`,
      [userId],
    ),
    safeRows(
      `SELECT COUNT(*)::INTEGER AS post_count
       FROM flix.posts
       WHERE id_user = $1`,
      [userId],
    ),
    safeRows(
      `SELECT *
       FROM (
        SELECT
          id_review,
          'movie' AS media_type,
          tmdb_movie_id AS tmdb_id,
          content,
          rating,
          created_at
        FROM flix.movie_reviews
        WHERE id_user = $1
          AND parent_review_id IS NULL

        UNION ALL

        SELECT
          id_review,
          'tv' AS media_type,
          tmdb_series_id AS tmdb_id,
          content,
          rating,
          created_at
        FROM flix.tv_series_reviews
        WHERE id_user = $1
          AND parent_review_id IS NULL
       ) reviews
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId],
    ),
    safeRows(
      `SELECT
        p.id_post,
        p.title,
        p.content,
        p.created_at,
        COALESCE(v.view_count, 0)::INTEGER AS view_count,
        COALESCE(l.like_count, 0)::INTEGER AS like_count,
        COALESCE(c.reply_count, 0)::INTEGER AS reply_count,
        COALESCE(s.share_count, 0)::INTEGER AS share_count
       FROM flix.posts p
       LEFT JOIN (
        SELECT id_post, COUNT(*) AS view_count
        FROM flix.post_views
        GROUP BY id_post
       ) v ON p.id_post = v.id_post
       LEFT JOIN (
        SELECT id_post, COUNT(*) AS like_count
        FROM flix.post_likes
        GROUP BY id_post
       ) l ON p.id_post = l.id_post
       LEFT JOIN (
        SELECT id_post, COUNT(*) AS reply_count
        FROM flix.comments
        GROUP BY id_post
       ) c ON p.id_post = c.id_post
       LEFT JOIN (
        SELECT id_post, COUNT(*) AS share_count
        FROM flix.post_shares
        GROUP BY id_post
       ) s ON p.id_post = s.id_post
       WHERE p.id_user = $1
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [userId],
    ),
  ]);

  return {
    userRows,
    reviewStatsRows,
    postCountRows,
    latestReviewRows,
    latestPostRows,
  };
};

export const getAdminDashboard = async (req, res) => {
  try {
    const selectedChartActivity = chartActivityOptions[req.query.activity]
      ? req.query.activity
      : "login";
    const selectedChartYear = Number.parseInt(req.query.year, 10) || new Date().getFullYear();
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
      getChartData({
        activity: selectedChartActivity,
        year: selectedChartYear,
      }),
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
      chartMeta: {
        activity: selectedChartActivity,
        activityLabel: chartActivityOptions[selectedChartActivity].label,
        year: selectedChartYear,
      },
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

export const getAdminMovies = async (req, res) => {
  try {
    const managedRows = await getManagedMediaRows();
    const movies = managedRows.map(mapAdminMovieRow);

    return res.json({
      message: "Daftar film admin berhasil dimuat",
      total: movies.length,
      movies,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil daftar film admin",
      error: error.message,
    });
  }
};

export const createAdminMovie = async (req, res) => {
  try {
    const moviePayload = getAdminMoviePayload(req.body);

    if (moviePayload.error) {
      return res.status(400).json({
        message: moviePayload.error,
      });
    }

    const result = await pool.query(
      `
        INSERT INTO flix.admin_movies (
          created_by_user_id,
          title,
          release_year,
          duration,
          director,
          synopsis,
          cast_members,
          poster_url,
          trailer_url,
          rating,
          country,
          genres,
          platforms,
          moods,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING
          1 AS row_number,
          id_admin_movie,
          title,
          release_year,
          duration,
          director,
          synopsis,
          cast_members,
          poster_url,
          trailer_url,
          rating,
          country,
          genres,
          platforms,
          moods,
          status,
          0::INTEGER AS watchlist_count,
          created_at
      `,
      [
        req.user?.id_user || null,
        moviePayload.title,
        moviePayload.releaseYear,
        moviePayload.duration,
        moviePayload.director,
        moviePayload.synopsis,
        moviePayload.castMembers,
        moviePayload.posterUrl,
        moviePayload.trailerUrl,
        moviePayload.rating,
        moviePayload.country,
        moviePayload.genres,
        moviePayload.platforms,
        moviePayload.moods,
        moviePayload.status,
      ],
    );

    return res.status(201).json({
      message: moviePayload.status === "Draft" ? "Draft film berhasil disimpan" : "Film berhasil dipublish",
      movie: mapAdminMovieRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menambahkan film admin",
      error: error.message,
    });
  }
};

export const updateAdminMovie = async (req, res) => {
  try {
    const movieId = Number(req.params.id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({
        message: "ID film tidak valid",
      });
    }

    const moviePayload = getAdminMoviePayload(req.body);

    if (moviePayload.error) {
      return res.status(400).json({
        message: moviePayload.error,
      });
    }

    const result = await pool.query(
      `
        UPDATE flix.admin_movies
        SET
          title = $1,
          release_year = $2,
          duration = $3,
          director = $4,
          synopsis = $5,
          cast_members = $6,
          poster_url = $7,
          trailer_url = $8,
          rating = $9,
          country = $10,
          genres = $11,
          platforms = $12,
          moods = $13,
          status = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_admin_movie = $15
        RETURNING
          1 AS row_number,
          id_admin_movie,
          title,
          release_year,
          duration,
          director,
          synopsis,
          cast_members,
          poster_url,
          trailer_url,
          rating,
          country,
          genres,
          platforms,
          moods,
          status,
          0::INTEGER AS watchlist_count,
          created_at
      `,
      [
        moviePayload.title,
        moviePayload.releaseYear,
        moviePayload.duration,
        moviePayload.director,
        moviePayload.synopsis,
        moviePayload.castMembers,
        moviePayload.posterUrl,
        moviePayload.trailerUrl,
        moviePayload.rating,
        moviePayload.country,
        moviePayload.genres,
        moviePayload.platforms,
        moviePayload.moods,
        moviePayload.status,
        movieId,
      ],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Film tidak ditemukan",
      });
    }

    return res.json({
      message: moviePayload.status === "Draft" ? "Perubahan film disimpan sebagai draft" : "Perubahan film berhasil dipublish",
      movie: mapAdminMovieRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengubah film admin",
      error: error.message,
    });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const [incomingRows, reportedRows] = await Promise.all([
      getAdminIncomingReviewRows(),
      getAdminReportedReviewRows(),
    ]);
    const isBlockedReviewReport = (row) =>
      String(row.report_status || "").toLowerCase() === "approved" ||
      String(row.moderation_status || "").toLowerCase() === "blocked";
    const reportedActiveRows = reportedRows.filter((row) => !isBlockedReviewReport(row));
    const blockedRows = reportedRows.filter(isBlockedReviewReport);
    const normalizeReportedRow = (row) => ({
      ...row,
      tmdb_id: row.metadata_tmdb_id,
      content: row.metadata_content || "Review dilaporkan oleh user.",
    });

    const [incoming, reported, blocked] = await Promise.all([
      mapAdminReviewRows(incomingRows),
      mapAdminReviewRows(reportedActiveRows.map(normalizeReportedRow)),
      mapAdminReviewRows(blockedRows.map(normalizeReportedRow)),
    ]);

    return res.json({
      message: "Moderasi review admin berhasil dimuat",
      summary: {
        incoming: incoming.length,
        reported: reported.length,
        blocked: blocked.length,
      },
      reviews: {
        incoming,
        reported,
        blocked,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil moderasi review admin",
      error: error.message,
    });
  }
};

export const getAdminCommunity = async (req, res) => {
  try {
    const [postRows, reportedRows, totalPostRows, totalReplyRows] = await Promise.all([
      getAdminCommunityRows(),
      getAdminReportedCommunityRows(),
      safeRows(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.posts
      `),
      safeRows(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.comments
      `),
    ]);

    const posts = mapAdminCommunityRows(postRows);
    const reportedPosts = mapAdminCommunityRows(reportedRows);

    return res.json({
      message: "Kelola community admin berhasil dimuat",
      summary: {
        totalPost: Number(totalPostRows[0]?.count || posts.length),
        totalReply: Number(totalReplyRows[0]?.count || 0),
        reported: reportedPosts.length,
        blocked: 0,
      },
      posts: {
        all: posts,
        reported: reportedPosts,
        blocked: [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil kelola community admin",
      error: error.message,
    });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = mapAdminUsers(await getAdminUserRows());
    const summary = users.reduce(
      (accumulator, user) => {
        if (user.role === "admin") {
          accumulator.admin += 1;
        } else if (user.role === "moderator") {
          accumulator.moderator += 1;
        } else {
          accumulator.registeredUser += 1;
        }

        accumulator.total += 1;
        return accumulator;
      },
      {
        total: 0,
        admin: 0,
        moderator: 0,
        registeredUser: 0,
      },
    );

    return res.json({
      message: "Daftar user admin berhasil dimuat",
      summary,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil daftar user admin",
      error: error.message,
    });
  }
};

export const updateAdminUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const isActive = req.body?.is_active ?? req.body?.isActive;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "Status aktif user harus berupa boolean",
      });
    }

    if (!isActive && Number(req.user?.id_user) === userId) {
      return res.status(400).json({
        message: "Admin tidak bisa menonaktifkan akun sendiri",
      });
    }

    const result = await pool.query(
      `WITH updated_user AS (
        UPDATE flix.users
        SET
          is_active = $1,
          deactivated_at = CASE WHEN $1 THEN NULL ELSE CURRENT_TIMESTAMP END,
          deactivated_by_user_id = CASE WHEN $1 THEN NULL ELSE $2 END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_user = $3
        RETURNING
          id_user,
          username,
          email,
          email_verified,
          is_active,
          profile_image_url,
          banner_image_url,
          created_at,
          deactivated_at,
          id_role
      )
      SELECT
        updated_user.*,
        roles.role_name
      FROM updated_user
      JOIN flix.roles roles ON updated_user.id_role = roles.id_role`,
      [isActive, req.user?.id_user || null, userId],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const userRow = result.rows[0];

    return res.json({
      message: isActive ? "User berhasil diaktifkan" : "User berhasil dinonaktifkan",
      user: {
        id: Number(userRow.id_user),
        username: userRow.username,
        email: userRow.email,
        role: userRow.role_name,
        roleLabel: normalizeUserRole(userRow.role_name),
        status: formatAdminUserStatus(userRow),
        isActive: userRow.is_active !== false,
        joinedAt: formatDate(userRow.created_at),
        deactivatedAt: userRow.deactivated_at ? formatDateTime(userRow.deactivated_at) : null,
        profileImageUrl: userRow.profile_image_url,
        bannerImageUrl: userRow.banner_image_url,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengubah status user",
      error: error.message,
    });
  }
};

export const updateAdminReviewReportStatus = async (req, res) => {
  const reportId = Number(req.params.reportId);
  const nextStatus = normalizeReviewReportStatus(req.body?.status);

  if (!Number.isInteger(reportId) || reportId <= 0) {
    return res.status(400).json({
      message: "ID report tidak valid",
    });
  }

  if (!nextStatus || !["approved", "rejected", "pending"].includes(nextStatus)) {
    return res.status(400).json({
      message: "Status report tidak valid",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reportResult = await client.query(
      `SELECT
         id_report,
         movie_review_id,
         tv_series_review_id
       FROM flix.reports
       WHERE id_report = $1
         AND (movie_review_id IS NOT NULL OR tv_series_review_id IS NOT NULL)`,
      [reportId],
    );

    if (!reportResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Report review tidak ditemukan",
      });
    }

    const report = reportResult.rows[0];
    const mediaType = report.movie_review_id ? "movie" : "tv";
    const reviewId = Number(report.movie_review_id || report.tv_series_review_id);
    const reportColumn = mediaType === "movie" ? "movie_review_id" : "tv_series_review_id";
    const reviewTable = mediaType === "movie" ? "flix.movie_reviews" : "flix.tv_series_reviews";

    const updatedReport = await client.query(
      `UPDATE flix.reports
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_report = $2
       RETURNING id_report, status, updated_at`,
      [nextStatus, reportId],
    );

    if (nextStatus === "approved") {
      await client.query(
        `UPDATE ${reviewTable}
         SET moderation_status = 'blocked',
             blocked_at = CURRENT_TIMESTAMP,
             blocked_by_user_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_review = $2`,
        [req.user.id_user, reviewId],
      );
    } else {
      const otherApprovedReports = await client.query(
        `SELECT COUNT(*)::INTEGER AS count
         FROM flix.reports
         WHERE ${reportColumn} = $1
           AND id_report <> $2
           AND status = 'approved'`,
        [reviewId, reportId],
      );

      if (Number(otherApprovedReports.rows[0]?.count || 0) === 0) {
        await client.query(
          `UPDATE ${reviewTable}
           SET moderation_status = 'active',
               blocked_at = NULL,
               blocked_by_user_id = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id_review = $1`,
          [reviewId],
        );
      }
    }

    await client.query("COMMIT");

    return res.json({
      message:
        nextStatus === "approved"
          ? "Review berhasil dipindahkan ke Review Terblokir"
          : "Report review berhasil ditolak",
      report: {
        id: Number(updatedReport.rows[0].id_report),
        status: updatedReport.rows[0].status,
        statusLabel: formatReviewReportStatus(updatedReport.rows[0].status),
        mediaType,
        reviewId,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      message: "Gagal mengubah status report review",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export const getAdminUserDetail = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid",
      });
    }

    const {
      userRows,
      reviewStatsRows,
      postCountRows,
      latestReviewRows,
      latestPostRows,
    } = await getAdminUserDetailRows(userId);

    if (!userRows.length) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const userRow = userRows[0];
    const reviews = await mapReviewMediaRows(latestReviewRows);
    const posts = latestPostRows.map((post) => ({
      id: Number(post.id_post),
      title: post.title || "Post tanpa judul",
      content: post.content || "",
      date: formatDate(post.created_at),
      createdAt: post.created_at,
      viewCount: Number(post.view_count || 0),
      likeCount: Number(post.like_count || 0),
      replyCount: Number(post.reply_count || 0),
      shareCount: Number(post.share_count || 0),
    }));

    const activities = [
      ...reviews.map((review) => ({
        type: "Review",
        title: `Menulis Review ${review.title}`,
        time: formatDateTime(review.createdAt),
        createdAt: review.createdAt,
      })),
      ...posts.map((post) => ({
        type: "Post",
        title: `Membuat Post ${post.title}`,
        time: formatDateTime(post.createdAt),
        createdAt: post.createdAt,
      })),
      {
        type: "Akun",
        title: "Bergabung ke FLIX",
        time: formatDateTime(userRow.created_at),
        createdAt: userRow.created_at,
      },
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    const reviewStats = reviewStatsRows[0] || {};
    const postCount = Number(postCountRows[0]?.post_count || 0);

    return res.json({
      message: "Detail user admin berhasil dimuat",
      user: {
        id: Number(userRow.id_user),
        username: userRow.username,
        email: userRow.email,
        role: userRow.role_name,
        roleLabel: normalizeUserRole(userRow.role_name),
        status: formatAdminUserStatus(userRow),
        isActive: userRow.is_active !== false,
        joinedAt: formatDate(userRow.created_at),
        joinedAtDetail: formatDateTime(userRow.created_at),
        deactivatedAt: userRow.deactivated_at ? formatDateTime(userRow.deactivated_at) : null,
        location: "-",
        profileImageUrl: userRow.profile_image_url,
        bannerImageUrl: userRow.banner_image_url,
      },
      stats: {
        totalWatchlist: 0,
        reviewsCreated: Number(reviewStats.review_count || 0),
        watchedMovies: 0,
        averageRating: Number(reviewStats.average_rating || 0),
        postsCreated: postCount,
      },
      activities,
      reviews,
      posts,
      watchlist: [],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil detail user admin",
      error: error.message,
    });
  }
};
