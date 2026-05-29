import { buildApiUrl } from "./api";

const getYear = (date) => date?.slice(0, 4) || "-";

const formatRatingFromVoteAverage = (voteAverage) => {
  const numericRating = Number(voteAverage);

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return "-";
  }

  return (numericRating / 2).toFixed(1);
};

const toVoteAverage = (rating) => {
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return null;
  }

  return numericRating * 2;
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Gagal memproses watchlist");
  }

  return data;
};

export const mapApiWatchlistItem = (item) => ({
  id_watchlist: item.id_watchlist,
  id: item.tmdb_id,
  tmdb_id: item.tmdb_id,
  media_type: item.media_type,
  mediaType: item.media_type,
  title: item.title,
  year: getYear(item.release_date),
  rating: formatRatingFromVoteAverage(item.vote_average),
  poster: item.poster_url || "https://placehold.co/300x450/141414/ffffff?text=FLIX",
  poster_url: item.poster_url,
  backdrop: item.backdrop_url || item.poster_url,
  backdrop_url: item.backdrop_url,
  overview: item.overview,
  releaseLabel: item.release_date || "-",
  release_date: item.release_date,
  vote_average: item.vote_average,
  status: item.status,
  genre_ids: [],
});

export const mapMovieToWatchlistPayload = (movie) => ({
  media_type: "movie",
  tmdb_id: Number(movie.id),
  title: movie.title || "Untitled",
  poster_url: movie.poster || movie.poster_url || null,
  backdrop_url: movie.backdrop || movie.backdrop_url || movie.poster || null,
  release_date: movie.release_date || movie.releaseLabel || null,
  overview: movie.overview || null,
  vote_average: movie.vote_average ?? toVoteAverage(movie.rating),
});

export const mapSeriesToWatchlistPayload = (series) => ({
  media_type: "tv",
  tmdb_id: Number(series.id),
  title: series.title || series.name || "Untitled",
  poster_url: series.poster || series.poster_url || null,
  backdrop_url: series.backdrop || series.backdrop_url || series.poster || null,
  release_date: series.first_air_date || series.releaseLabel || null,
  overview: series.overview || null,
  vote_average: series.vote_average ?? toVoteAverage(series.rating),
});

export const fetchWatchlist = async ({ token, mediaType, search, status } = {}) => {
  const params = new URLSearchParams();

  if (mediaType) {
    params.set("media_type", mediaType);
  }

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  const data = await requestJson(`/api/watchlist${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    summary: data.summary,
    items: (data.items || []).map(mapApiWatchlistItem),
  };
};

export const addWatchlistItem = async ({ token, payload }) => {
  const data = await requestJson("/api/watchlist", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return mapApiWatchlistItem(data.item);
};

export const deleteWatchlistItem = async ({ token, idWatchlist }) => {
  await requestJson(`/api/watchlist/${idWatchlist}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateWatchlistItemStatus = async ({ token, idWatchlist, status }) => {
  const data = await requestJson(`/api/watchlist/${idWatchlist}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  return mapApiWatchlistItem(data.item);
};

export const findSavedWatchlistItem = (watchlist, mediaType, tmdbId) =>
  watchlist.find(
    (item) => item.media_type === mediaType && String(item.tmdb_id) === String(tmdbId),
  );
