import pool from "../config/db.js";

const validMediaTypes = new Set(["movie", "tv"]);
const validStatuses = new Set(["pending", "watched"]);

const getAuthenticatedUserId = (req) => req.user?.id_user || req.user?.id;

const ensureUserId = (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: "User belum login" });
    return null;
  }

  return userId;
};

const mapWatchlistItem = (item) => ({
  id_watchlist: item.id_watchlist,
  media_type: item.media_type,
  tmdb_id: item.tmdb_id,
  title: item.title,
  poster_url: item.poster_url,
  backdrop_url: item.backdrop_url,
  release_date: item.release_date,
  overview: item.overview,
  vote_average: item.vote_average === null ? null : Number(item.vote_average),
  status: item.status,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const getSummary = async (userId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'watched')::int AS watched,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
     FROM flix.watchlist
     WHERE id_user = $1`,
    [userId],
  );

  return result.rows[0] || { total: 0, watched: 0, pending: 0 };
};

export const getWatchlist = async (req, res) => {
  try {
    const { media_type, status, search = "" } = req.query;
    const userId = ensureUserId(req, res);

    if (!userId) {
      return null;
    }

    const params = [userId];
    const conditions = ["id_user = $1"];

    if (media_type && validMediaTypes.has(media_type)) {
      params.push(media_type);
      conditions.push(`media_type = $${params.length}`);
    }

    if (status && validStatuses.has(status)) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    const result = await pool.query(
      `SELECT *
       FROM flix.watchlist
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      params,
    );

    return res.json({
      summary: await getSummary(userId),
      items: result.rows.map(mapWatchlistItem),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil watchlist",
      error: error.message,
    });
  }
};

export const getWatchlistItemStatus = async (req, res) => {
  try {
    const { mediaType, tmdbId } = req.params;
    const userId = ensureUserId(req, res);

    if (!userId) {
      return null;
    }

    if (!validMediaTypes.has(mediaType)) {
      return res.status(400).json({ message: "Tipe media tidak valid" });
    }

    const result = await pool.query(
      `SELECT *
       FROM flix.watchlist
       WHERE id_user = $1 AND media_type = $2 AND tmdb_id = $3`,
      [userId, mediaType, Number(tmdbId)],
    );

    return res.json({
      saved: result.rows.length > 0,
      item: result.rows[0] ? mapWatchlistItem(result.rows[0]) : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengecek watchlist",
      error: error.message,
    });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const userId = ensureUserId(req, res);

    if (!userId) {
      return null;
    }

    const {
      media_type,
      tmdb_id,
      title,
      poster_url,
      backdrop_url,
      release_date,
      overview,
      vote_average,
    } = req.body;

    if (!validMediaTypes.has(media_type) || !tmdb_id || !title) {
      return res.status(400).json({
        message: "media_type, tmdb_id, dan title wajib diisi",
      });
    }

    const result = await pool.query(
      `INSERT INTO flix.watchlist
       (id_user, media_type, tmdb_id, title, poster_url, backdrop_url, release_date, overview, vote_average)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id_user, media_type, tmdb_id) DO UPDATE
         SET title = EXCLUDED.title,
             poster_url = EXCLUDED.poster_url,
             backdrop_url = EXCLUDED.backdrop_url,
             release_date = EXCLUDED.release_date,
             overview = EXCLUDED.overview,
             vote_average = EXCLUDED.vote_average,
             updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId,
        media_type,
        Number(tmdb_id),
        title,
        poster_url || null,
        backdrop_url || null,
        release_date || null,
        overview || null,
        vote_average ?? null,
      ],
    );

    return res.status(201).json({
      message: "Berhasil disimpan ke watchlist",
      item: mapWatchlistItem(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menyimpan watchlist",
      error: error.message,
    });
  }
};

export const updateWatchlistStatus = async (req, res) => {
  try {
    const userId = ensureUserId(req, res);

    if (!userId) {
      return null;
    }

    const { status } = req.body;

    if (!validStatuses.has(status)) {
      return res.status(400).json({ message: "Status watchlist tidak valid" });
    }

    const result = await pool.query(
      `UPDATE flix.watchlist
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id_watchlist = $2 AND id_user = $3
       RETURNING *`,
      [status, req.params.id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Watchlist tidak ditemukan" });
    }

    return res.json({
      message: "Status watchlist diperbarui",
      item: mapWatchlistItem(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui watchlist",
      error: error.message,
    });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = ensureUserId(req, res);

    if (!userId) {
      return null;
    }

    const result = await pool.query(
      `DELETE FROM flix.watchlist
       WHERE id_watchlist = $1 AND id_user = $2
       RETURNING id_watchlist`,
      [req.params.id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Watchlist tidak ditemukan" });
    }

    return res.json({ message: "Watchlist dihapus" });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus watchlist",
      error: error.message,
    });
  }
};
