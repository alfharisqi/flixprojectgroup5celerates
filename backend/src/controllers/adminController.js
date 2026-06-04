import pool from "../config/db.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

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
        FROM flix.notifications
        WHERE notification_type ILIKE '%report%'
        ORDER BY created_at DESC
        LIMIT 1
      `),
      safeCount(`
        SELECT COUNT(*)::INTEGER AS count
        FROM flix.notifications
        WHERE notification_type ILIKE '%report%'
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
    WITH media_activity AS (
      SELECT
        'movie' AS media_type,
        tmdb_movie_id AS tmdb_id,
        COUNT(*)::INTEGER AS interaction_count,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        MAX(created_at) AS latest_activity
      FROM flix.movie_reviews
      WHERE parent_review_id IS NULL
      GROUP BY tmdb_movie_id

      UNION ALL

      SELECT
        'tv' AS media_type,
        tmdb_series_id AS tmdb_id,
        COUNT(*)::INTEGER AS interaction_count,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        MAX(created_at) AS latest_activity
      FROM flix.tv_series_reviews
      WHERE parent_review_id IS NULL
      GROUP BY tmdb_series_id
    )
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY latest_activity DESC NULLS LAST, interaction_count DESC, tmdb_id ASC
      ) AS row_number,
      media_type,
      tmdb_id,
      interaction_count,
      average_rating
    FROM media_activity
    ORDER BY latest_activity DESC NULLS LAST, interaction_count DESC, tmdb_id ASC
    LIMIT 80
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

const getAdminUserRows = async () =>
  safeRows(`
    SELECT
      u.id_user,
      u.username,
      u.email,
      u.email_verified,
      u.profile_image_url,
      u.created_at,
      r.role_name
    FROM flix.users u
    JOIN flix.roles r ON u.id_role = r.id_role
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
    status: row.email_verified === false ? "Belum Verifikasi" : "Aktif",
    joinedAt: formatDate(row.created_at),
    profileImageUrl: row.profile_image_url,
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
        u.profile_image_url,
        u.banner_image_url,
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

export const getAdminMovies = async (req, res) => {
  try {
    const managedRows = await getManagedMediaRows();
    const movies = await enrichMediaRows(managedRows);

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
        status: userRow.email_verified === false ? "Belum Verifikasi" : "Aktif",
        joinedAt: formatDate(userRow.created_at),
        joinedAtDetail: formatDateTime(userRow.created_at),
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
