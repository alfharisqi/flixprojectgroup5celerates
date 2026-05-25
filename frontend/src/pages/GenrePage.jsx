import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaBookmark,
  FaFacebookF,
  FaRegBookmark,
  FaSearch,
  FaStar,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "../components/SiteNavbar";
import WatchlistConfirmModal from "../components/WatchlistConfirmModal";
import "./GenrePage.css";

const apiUrl = import.meta.env.VITE_API_URL;

const fallbackPosterUrl =
  "https://image.tmdb.org/t/p/w500/cdPSUck4tBRvRu6DFk6XciDrssn.jpg";
const fallbackGenreImage =
  "https://image.tmdb.org/t/p/original/tiIpajUBpLMNWMEzpjRBxo0jCbD.jpg";

const fallbackGenres = [
  { id: 28, name: "Aksi", type: "genre", query: { genre: "28" } },
  { id: 12, name: "Petualangan", type: "genre", query: { genre: "12" } },
  { id: 16, name: "Animasi", type: "genre", query: { genre: "16" } },
  { id: 35, name: "Komedi", type: "genre", query: { genre: "35" } },
  { id: 80, name: "Kriminal", type: "genre", query: { genre: "80" } },
  { id: 18, name: "Drama", type: "genre", query: { genre: "18" } },
  { id: 14, name: "Fantasi", type: "genre", query: { genre: "14" } },
  { id: 27, name: "Horor", type: "genre", query: { genre: "27" } },
  { id: 9648, name: "Misteri", type: "genre", query: { genre: "9648" } },
  { id: 10749, name: "Romantis", type: "genre", query: { genre: "10749" } },
  { id: 878, name: "Sci-Fi", type: "genre", query: { genre: "878" } },
  { id: 53, name: "Thriller", type: "genre", query: { genre: "53" } },
  { id: 10751, name: "Keluarga", type: "genre", query: { genre: "10751" } },
  { id: 36, name: "Sejarah", type: "genre", query: { genre: "36" } },
  { id: 10402, name: "Musik", type: "genre", query: { genre: "10402" } },
  { id: 10752, name: "Perang", type: "genre", query: { genre: "10752" } },
  {
    id: "hollywood",
    name: "Hollywood",
    type: "regional",
    query: { with_origin_country: "US", with_original_language: "en" },
  },
  {
    id: "bollywood",
    name: "Bollywood",
    type: "regional",
    query: { with_origin_country: "IN", with_original_language: "hi" },
  },
  {
    id: "k-drama",
    name: "K-Drama",
    type: "regional",
    query: { genre: "18", with_origin_country: "KR", with_original_language: "ko" },
  },
  {
    id: "china-drama",
    name: "Cina Drama",
    type: "regional",
    query: { genre: "18", with_origin_country: "CN", with_original_language: "zh" },
  },
  {
    id: "japan",
    name: "Japan",
    type: "regional",
    query: { with_origin_country: "JP", with_original_language: "ja" },
  },
];

const genreDescriptions = {
  Aksi: "Adegan cepat, konflik besar, dan energi tinggi.",
  Petualangan: "Perjalanan besar, dunia baru, dan misi penuh risiko.",
  Animasi: "Visual ekspresif untuk keluarga, fantasi, dan cerita hangat.",
  Komedi: "Cerita ringan dengan momen lucu dan karakter santai.",
  Kriminal: "Kasus, investigasi, dan dunia gelap penuh intrik.",
  Drama: "Cerita emosional dengan konflik manusia yang kuat.",
  Fantasi: "Dunia imajinatif, kekuatan magis, dan petualangan epik.",
  Horor: "Ketegangan gelap, teror, dan kejutan yang intens.",
  Misteri: "Rahasia, teka-teki, dan jawaban yang perlahan terbuka.",
  Romantis: "Kisah hubungan, rasa, dan pilihan hati.",
  "Sci-Fi": "Teknologi, masa depan, dan gagasan besar.",
  Thriller: "Alur tegang dengan ancaman yang terus meningkat.",
  Keluarga: "Tontonan nyaman untuk dinikmati bersama.",
  Sejarah: "Cerita masa lalu, tokoh besar, dan peristiwa penting.",
  Musik: "Cerita yang hidup lewat lagu, panggung, dan ritme.",
  Perang: "Konflik besar, strategi, dan sisi manusia dari pertempuran.",
  Hollywood: "Film produksi Amerika dengan skala populer.",
  Bollywood: "Film India dengan drama, musik, dan emosi besar.",
  "K-Drama": "Drama Korea dengan cerita emosional dan karakter kuat.",
  "Cina Drama": "Drama Cina dengan relasi, konflik, dan visual elegan.",
  Japan: "Film Jepang dengan gaya cerita khas dan atmosfer kuat.",
};

const fallbackMovies = Array.from({ length: 10 }, (_, index) => ({
  id: `genre-fallback-${index + 1}`,
  title: "Cargo",
  year: "2023",
  rating: "4.9",
  poster: fallbackPosterUrl,
  overview:
    "Seorang ayah berusaha melindungi bayinya dalam perjalanan penuh risiko setelah wabah mengubah dunia.",
  genre_ids: [18, 53],
}));

const getMediaType = (media) => (media === "tv" ? "tv" : "movie");

const getMovieYear = (date) => date?.slice(0, 4) || "-";

const getMovieRating = (voteAverage) => {
  const numericRating = Number(voteAverage);

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return "-";
  }

  return (numericRating / 2).toFixed(1);
};

const getShortOverview = (overview) => {
  const cleanOverview = overview?.trim();

  if (!cleanOverview) {
    return "Deskripsi film belum tersedia.";
  }

  if (cleanOverview.length <= 150) {
    return cleanOverview;
  }

  return `${cleanOverview.slice(0, 147).trim()}...`;
};

const mapTmdbMediaItem = (movie, mediaType = "movie") => ({
  id: movie.id,
  title:
    movie.title ||
    movie.name ||
    movie.original_title ||
    movie.original_name ||
    "Untitled",
  year: getMovieYear(movie.release_date || movie.first_air_date),
  rating: getMovieRating(movie.vote_average),
  poster: movie.poster_url,
  backdrop: movie.backdrop_url || movie.poster_url,
  overview: getShortOverview(movie.overview),
  genre_ids: movie.genre_ids || [],
  media_type: mediaType,
});

const normalizeGenre = (genre) => ({
  ...genre,
  id: genre.id,
  name: genre.name,
  type: genre.type || "genre",
  query: genre.query || { genre: String(genre.id) },
  description:
    genre.description ||
    genreDescriptions[genre.name] ||
    "Rekomendasi film pilihan berdasarkan kategori ini.",
});

const buildDiscoverUrl = (query = {}, mediaType = "movie") => {
  const params = new URLSearchParams({
    sort_by: "popularity.desc",
    language: "id-ID",
    page: "1",
  });

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const endpoint = mediaType === "tv" ? "tv-series" : "movies";

  return `${apiUrl}/api/${endpoint}/discover?${params.toString()}`;
};

const uniqueById = (movies) => {
  const seen = new Set();

  return movies.filter((movie) => {
    if (!movie.id || seen.has(movie.id) || !movie.poster) {
      return false;
    }

    seen.add(movie.id);
    return true;
  });
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const getMovieWatchlistKey = (user) =>
  `flix_movie_watchlist_${user?.id_user || "guest"}`;

const getSeriesWatchlistKey = (user) =>
  `flix_tv_watchlist_${user?.id_user || "guest"}`;

const readWatchlist = (key) => {
  try {
    const savedWatchlist = JSON.parse(localStorage.getItem(key));
    return Array.isArray(savedWatchlist) ? savedWatchlist : [];
  } catch {
    return [];
  }
};

function GenreMovieCard({
  movie,
  mediaType,
  isSaved,
  genreLookup,
  onOpen,
  onToggleWatchlist,
}) {
  const movieGenres = (movie.genre_ids || [])
    .map((genreId) => genreLookup[genreId])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article
      className="genre-movie-card"
      onClick={() => onOpen(movie.id, movie.media_type || mediaType)}
    >
      <div className="genre-movie-poster">
        <img src={movie.poster} alt={movie.title} />
        <button
          className="genre-movie-save"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatchlist(movie);
          }}
          aria-label={
            isSaved ? `Hapus ${movie.title} dari watchlist` : `Simpan ${movie.title}`
          }
        >
          {isSaved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
        <div className="genre-movie-overlay" aria-hidden="true">
          <div className="genre-movie-tags">
            {(movieGenres.length > 0
              ? movieGenres
              : [mediaType === "tv" ? "TV Series" : "Film"]
            ).map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>
          <p>{getShortOverview(movie.overview)}</p>
        </div>
      </div>
      <h3>{movie.title}</h3>
      <p>
        {movie.year}
        <span />
        <strong>
          <FaStar />
          {movie.rating}
        </strong>
      </p>
    </article>
  );
}

function GenrePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMedia = getMediaType(searchParams.get("media"));
  const queryGenreId = searchParams.get("genre");
  const queryGenreName = searchParams.get("name");
  const user = useMemo(() => getStoredUser(), []);
  const movieWatchlistKey = useMemo(() => getMovieWatchlistKey(user), [user]);
  const seriesWatchlistKey = useMemo(() => getSeriesWatchlistKey(user), [user]);
  const [movieWatchlist, setMovieWatchlist] = useState(() =>
    readWatchlist(movieWatchlistKey),
  );
  const [seriesWatchlist, setSeriesWatchlist] = useState(() =>
    readWatchlist(seriesWatchlistKey),
  );
  const [pendingWatchlistItem, setPendingWatchlistItem] = useState(null);
  const [genres, setGenres] = useState(fallbackGenres.map(normalizeGenre));
  const [genreImages, setGenreImages] = useState({});
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(queryMedia);
  const [movies, setMovies] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const genreLookup = useMemo(
    () =>
      Object.fromEntries(
        genres
          .filter((genre) => genre.type === "genre")
          .map((genre) => [genre.id, genre.name]),
      ),
    [genres],
  );

  const savedMovieIds = useMemo(
    () => new Set(movieWatchlist.map((movie) => String(movie.id))),
    [movieWatchlist],
  );
  const savedSeriesIds = useMemo(
    () => new Set(seriesWatchlist.map((series) => String(series.id))),
    [seriesWatchlist],
  );
  const selectedMediaLabel = selectedMedia === "tv" ? "TV Series" : "Film";
  const selectedMediaCountLabel = selectedMedia === "tv" ? "series" : "film";

  useEffect(() => {
    localStorage.setItem(movieWatchlistKey, JSON.stringify(movieWatchlist));
  }, [movieWatchlist, movieWatchlistKey]);

  useEffect(() => {
    localStorage.setItem(seriesWatchlistKey, JSON.stringify(seriesWatchlist));
  }, [seriesWatchlist, seriesWatchlistKey]);

  useEffect(() => {
    if (!queryGenreId && !queryGenreName) {
      return;
    }

    const matchingGenre =
      genres.find((genre) => String(genre.id) === String(queryGenreId)) ||
      genres.find(
        (genre) =>
          queryGenreName &&
          genre.name.toLowerCase() === queryGenreName.toLowerCase(),
      );

    setSelectedMedia(queryMedia);
    setSelectedGenre(
      matchingGenre ||
        normalizeGenre({
          id: queryGenreId || queryGenreName,
          name: queryGenreName || "Genre",
          query: queryGenreId ? { genre: queryGenreId } : {},
        }),
    );
  }, [genres, queryGenreId, queryGenreName, queryMedia]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setGenreLoading(true);
        const genreEndpoint = queryMedia === "tv" ? "tv-series" : "movies";
        const response = await fetch(
          `${apiUrl}/api/${genreEndpoint}/genres?language=id-ID`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil genre");
        }

        const data = await response.json();
        const fetchedGenres = data.genres || [];

        if (fetchedGenres.length > 0) {
          const fetchedGenreCards = fetchedGenres.map((genre) =>
            normalizeGenre({
              ...genre,
              query: { genre: String(genre.id) },
            }),
          );
          const customGenreCards =
            queryMedia === "movie"
              ? fallbackGenres
                  .filter((genre) => genre.type === "regional")
                  .map(normalizeGenre)
              : [];

          setGenres([...fetchedGenreCards, ...customGenreCards]);
        }
      } catch {
        setGenres(fallbackGenres.map(normalizeGenre));
      } finally {
        setGenreLoading(false);
      }
    };

    loadGenres();
  }, [queryMedia]);

  useEffect(() => {
    const genresWithoutImage = genres.filter((genre) => !genreImages[genre.id]);

    if (genresWithoutImage.length === 0) {
      return undefined;
    }

    let shouldIgnore = false;

    const loadGenreImages = async () => {
      const imageEntries = await Promise.all(
        genresWithoutImage.map(async (genre) => {
          try {
            const response = await fetch(buildDiscoverUrl(genre.query, queryMedia));

            if (!response.ok) {
              throw new Error("Gagal mengambil gambar genre");
            }

            const data = await response.json();
            const referenceMovie = (data.results || []).find(
              (movie) => movie.backdrop_url || movie.poster_url,
            );

            return [
              genre.id,
              referenceMovie?.backdrop_url || referenceMovie?.poster_url || fallbackGenreImage,
            ];
          } catch {
            return [genre.id, fallbackGenreImage];
          }
        }),
      );

      if (!shouldIgnore) {
        setGenreImages((currentImages) => ({
          ...currentImages,
          ...Object.fromEntries(imageEntries),
        }));
      }
    };

    loadGenreImages();

    return () => {
      shouldIgnore = true;
    };
  }, [genreImages, genres, queryMedia]);

  useEffect(() => {
    if (!selectedGenre) {
      setMovies([]);
      return undefined;
    }

    let shouldIgnore = false;

    const loadMoviesByGenre = async () => {
      try {
        setMoviesLoading(true);
        setErrorMessage("");
        const response = await fetch(buildDiscoverUrl(selectedGenre.query, selectedMedia));

        if (!response.ok) {
          throw new Error("Gagal mengambil rekomendasi film");
        }

        const data = await response.json();
        const mappedMovies = uniqueById(
          (data.results || []).map((item) => mapTmdbMediaItem(item, selectedMedia)),
        );

        if (!shouldIgnore) {
          setMovies(mappedMovies.length > 0 ? mappedMovies.slice(0, 15) : []);
        }
      } catch {
        if (!shouldIgnore) {
          setMovies(fallbackMovies);
          setErrorMessage("Gagal mengambil data terbaru, menampilkan fallback sementara.");
        }
      } finally {
        if (!shouldIgnore) {
          setMoviesLoading(false);
        }
      }
    };

    loadMoviesByGenre();

    return () => {
      shouldIgnore = true;
    };
  }, [selectedGenre, selectedMedia]);

  const openMovie = (movieId, mediaType = selectedMedia) => {
    if (Number.isInteger(Number(movieId))) {
      navigate(mediaType === "tv" ? `/tv-series/${movieId}` : `/movie/${movieId}`);
    }
  };

  const selectGenre = (genre) => {
    const mediaType = selectedMedia;

    setSelectedMedia(mediaType);
    setSelectedGenre(genre);
    setSearchParams({
      media: mediaType,
      genre: String(genre.id),
      name: genre.name,
    });
  };

  const isMediaSaved = (mediaItem) => {
    const mediaType = getMediaType(mediaItem.media_type || selectedMedia);
    const mediaId = String(mediaItem.id);

    return mediaType === "tv" ? savedSeriesIds.has(mediaId) : savedMovieIds.has(mediaId);
  };

  const saveItemToWatchlist = (mediaItem) => {
    const mediaType = getMediaType(mediaItem.media_type || selectedMedia);
    const listSetter = mediaType === "tv" ? setSeriesWatchlist : setMovieWatchlist;

    listSetter((currentWatchlist) => {
      const mediaId = String(mediaItem.id);

      if (currentWatchlist.some((savedItem) => String(savedItem.id) === mediaId)) {
        return currentWatchlist;
      }

      return [{ ...mediaItem, media_type: mediaType }, ...currentWatchlist].slice(0, 20);
    });
  };

  const toggleWatchlist = (mediaItem) => {
    const mediaType = getMediaType(mediaItem.media_type || selectedMedia);
    const mediaId = String(mediaItem.id);

    if (isMediaSaved(mediaItem)) {
      const listSetter = mediaType === "tv" ? setSeriesWatchlist : setMovieWatchlist;

      listSetter((currentWatchlist) =>
        currentWatchlist.filter((savedItem) => String(savedItem.id) !== mediaId),
      );
      return;
    }

    setPendingWatchlistItem({
      mediaLabel: mediaType === "tv" ? "Series" : "Film",
      item: {
        ...mediaItem,
        media_type: mediaType,
      },
    });
  };

  const confirmSaveToWatchlist = () => {
    if (pendingWatchlistItem?.item) {
      saveItemToWatchlist(pendingWatchlistItem.item);
    }

    setPendingWatchlistItem(null);
  };

  return (
    <main className="genre-page">
      <SiteNavbar mode="fixed" activeKey="genre" />

      <section className="genre-hero">
        <div className="genre-hero__eyebrow">
          <span />
          Genre Film
        </div>
        <h1>
          Pilih Genre, Temukan <strong>Rekomendasi</strong> Film yang Pas
        </h1>
        <p>
          Jelajahi film berdasarkan kategori favoritmu. Rekomendasi di bawah akan
          muncul setelah kamu memilih salah satu genre.
        </p>
      </section>

      <section className="genre-picker" aria-labelledby="genre-picker-title">
        <div className="genre-section-header">
          <div>
            <p>Pilih Genre</p>
            <h2 id="genre-picker-title">Genre yang tersedia</h2>
          </div>
          {genreLoading && <span>Memuat genre...</span>}
        </div>

        <div className="genre-chip-grid">
          {genres.map((genre) => (
            <button
              className={selectedGenre?.id === genre.id ? "is-active" : ""}
              key={genre.id}
              type="button"
              onClick={() => selectGenre(genre)}
              style={{
                "--genre-card-image": `url(${genreImages[genre.id] || fallbackGenreImage})`,
              }}
            >
              <span>{genre.type === "regional" ? "Regional" : "Genre"}</span>
              <strong>{genre.name}</strong>
              <small>{genre.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="genre-recommendations" aria-live="polite">
        <div className="genre-section-header">
          <div>
            <p>Rekomendasi {selectedMediaLabel}</p>
            <h2>
              {selectedGenre
                ? `${selectedMediaLabel} untuk genre ${selectedGenre.name}`
                : "Pilih genre untuk melihat rekomendasi"}
            </h2>
          </div>
          {selectedGenre && (
            <span>
              <FaSearch />
              {moviesLoading ? "Mencari..." : `${movies.length} ${selectedMediaCountLabel}`}
            </span>
          )}
        </div>

        {!selectedGenre ? (
          <div className="genre-empty-state">
            <h3>Rekomendasi belum ditampilkan</h3>
            <p>
              Pilih satu genre di atas untuk menampilkan daftar{" "}
              {selectedMediaCountLabel} yang sesuai.
            </p>
          </div>
        ) : (
          <>
            {errorMessage && <p className="genre-status">{errorMessage}</p>}
            {moviesLoading && (
              <p className="genre-status">
                Memuat rekomendasi {selectedMediaCountLabel}...
              </p>
            )}
            {!moviesLoading && movies.length === 0 && (
              <p className="genre-status">
                {selectedMediaLabel} untuk genre ini belum ditemukan.
              </p>
            )}

            <div className="genre-movie-grid">
              {movies.map((movie) => (
                <GenreMovieCard
                  key={movie.id}
                  movie={movie}
                  mediaType={selectedMedia}
                  isSaved={isMediaSaved(movie)}
                  genreLookup={genreLookup}
                  onOpen={openMovie}
                  onToggleWatchlist={toggleWatchlist}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="genre-footer">
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

      <WatchlistConfirmModal
        open={Boolean(pendingWatchlistItem)}
        item={pendingWatchlistItem?.item}
        mediaLabel={pendingWatchlistItem?.mediaLabel || "Film"}
        onCancel={() => setPendingWatchlistItem(null)}
        onConfirm={confirmSaveToWatchlist}
      />
    </main>
  );
}

export default GenrePage;
