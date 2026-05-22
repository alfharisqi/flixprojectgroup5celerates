import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import "./GenrePage.css";

const apiUrl = import.meta.env.VITE_API_URL;

const fallbackPosterUrl =
  "https://image.tmdb.org/t/p/w500/cdPSUck4tBRvRu6DFk6XciDrssn.jpg";

const fallbackGenres = [
  { id: 28, name: "Aksi" },
  { id: 12, name: "Petualangan" },
  { id: 16, name: "Animasi" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Kriminal" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasi" },
  { id: 27, name: "Horor" },
  { id: 9648, name: "Misteri" },
  { id: 10749, name: "Romantis" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10751, name: "Keluarga" },
  { id: 36, name: "Sejarah" },
  { id: 10402, name: "Musik" },
  { id: 10752, name: "Perang" },
];

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

const mapTmdbMovie = (movie) => ({
  id: movie.id,
  title: movie.title || movie.original_title || "Untitled",
  year: getMovieYear(movie.release_date),
  rating: getMovieRating(movie.vote_average),
  poster: movie.poster_url,
  overview: getShortOverview(movie.overview),
  genre_ids: movie.genre_ids || [],
});

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

function GenreMovieCard({
  movie,
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
    <article className="genre-movie-card" onClick={() => onOpen(movie.id)}>
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
            {(movieGenres.length > 0 ? movieGenres : ["Film"]).map((genre) => (
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
  const user = useMemo(() => getStoredUser(), []);
  const watchlistKey = useMemo(() => getWatchlistKey(user), [user]);
  const [watchlist, setWatchlist] = useState(() => readWatchlist(watchlistKey));
  const [genres, setGenres] = useState(fallbackGenres);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const genreLookup = useMemo(
    () => Object.fromEntries(genres.map((genre) => [genre.id, genre.name])),
    [genres],
  );

  const savedMovieIds = useMemo(
    () => new Set(watchlist.map((movie) => String(movie.id))),
    [watchlist],
  );

  useEffect(() => {
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
  }, [watchlist, watchlistKey]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setGenreLoading(true);
        const response = await fetch(`${apiUrl}/api/movies/genres?language=id-ID`);

        if (!response.ok) {
          throw new Error("Gagal mengambil genre");
        }

        const data = await response.json();
        const fetchedGenres = data.genres || [];

        if (fetchedGenres.length > 0) {
          setGenres(fetchedGenres);
        }
      } catch {
        setGenres(fallbackGenres);
      } finally {
        setGenreLoading(false);
      }
    };

    loadGenres();
  }, []);

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
        const response = await fetch(
          `${apiUrl}/api/movies/discover?genre=${selectedGenre.id}&sort_by=popularity.desc&language=id-ID&page=1`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil rekomendasi film");
        }

        const data = await response.json();
        const mappedMovies = uniqueById((data.results || []).map(mapTmdbMovie));

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
  }, [selectedGenre]);

  const openMovie = (movieId) => {
    if (Number.isInteger(Number(movieId))) {
      navigate(`/movie/${movieId}`);
    }
  };

  const toggleWatchlist = (movie) => {
    setWatchlist((currentWatchlist) => {
      const movieId = String(movie.id);

      if (currentWatchlist.some((savedMovie) => String(savedMovie.id) === movieId)) {
        return currentWatchlist.filter((savedMovie) => String(savedMovie.id) !== movieId);
      }

      return [movie, ...currentWatchlist].slice(0, 20);
    });
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
              onClick={() => setSelectedGenre(genre)}
            >
              <span>{genre.name.slice(0, 1)}</span>
              {genre.name}
            </button>
          ))}
        </div>
      </section>

      <section className="genre-recommendations" aria-live="polite">
        <div className="genre-section-header">
          <div>
            <p>Rekomendasi Film</p>
            <h2>
              {selectedGenre
                ? `Film untuk genre ${selectedGenre.name}`
                : "Pilih genre untuk melihat rekomendasi"}
            </h2>
          </div>
          {selectedGenre && (
            <span>
              <FaSearch />
              {moviesLoading ? "Mencari..." : `${movies.length} film`}
            </span>
          )}
        </div>

        {!selectedGenre ? (
          <div className="genre-empty-state">
            <h3>Rekomendasi belum ditampilkan</h3>
            <p>Pilih satu genre di atas untuk menampilkan daftar film yang sesuai.</p>
          </div>
        ) : (
          <>
            {errorMessage && <p className="genre-status">{errorMessage}</p>}
            {moviesLoading && <p className="genre-status">Memuat rekomendasi film...</p>}
            {!moviesLoading && movies.length === 0 && (
              <p className="genre-status">Film untuk genre ini belum ditemukan.</p>
            )}

            <div className="genre-movie-grid">
              {movies.map((movie) => (
                <GenreMovieCard
                  key={movie.id}
                  movie={movie}
                  isSaved={savedMovieIds.has(String(movie.id))}
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
    </main>
  );
}

export default GenrePage;
