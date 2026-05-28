import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaPlay,
  FaRegBookmark,
  FaSlidersH,
  FaStar,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "../../components/layout/SiteNavbar";
import FilterPopup from "../../components/common/FilterPopup";
import Footer from "../../components/layout/Footer";
import WatchlistConfirmModal from "../../components/watchlist/WatchlistConfirmModal";
import {
  addWatchlistItem,
  deleteWatchlistItem,
  fetchWatchlist,
  mapMovieToWatchlistPayload,
} from "../../utils/watchlist";
import menegangkanIcon from "../../assets/emoticon/menegangkan-emoticon.png";
import pikiranIcon from "../../assets/emoticon/pikiran-emoticon.png";
import romantisIcon from "../../assets/emoticon/romantis-emoticon.png";
import santaiIcon from "../../assets/emoticon/santai-emoticon.png";
import sedihIcon from "../../assets/emoticon/sedih-emoticon.png";
import seruIcon from "../../assets/emoticon/seru-emoticon.png";
import "./Homepage.css";

const fallbackHeroMovie = {
  id: "space-force",
  title: "Space Force",
  rating: "4.9",
  year: "2024",
  poster: "https://image.tmdb.org/t/p/w780/zgu3p4NvisS8CI68cUfBKbvAvu8.jpg",
  backdrop: "https://image.tmdb.org/t/p/original/lV6WA95QboTUQDkFWjP3wI9U8xp.jpg",
  overview: "Sekelompok orang menjalankan cabang baru angkatan bersenjata dengan misi besar dan situasi yang tidak selalu berjalan sesuai rencana.",
  genre_ids: [35],
};

const moods = [
  { id: "santai", label: "Santai", icon: santaiIcon, genre: "35|10751|16" },
  { id: "seru", label: "Seru", icon: seruIcon, genre: "28|12" },
  { id: "sedih", label: "Sedih", icon: sedihIcon, genre: "18" },
  { id: "menegangkan", label: "Menegangkan", icon: menegangkanIcon, genre: "53|27" },
  { id: "romantis", label: "Romantis", icon: romantisIcon, genre: "10749" },
  { id: "pikiran", label: "Pikiran", icon: pikiranIcon, genre: "878|9648" },
];

const fallbackPosterUrl = "https://image.tmdb.org/t/p/w500/cdPSUck4tBRvRu6DFk6XciDrssn.jpg";
const fallbackBackdropUrl = "https://image.tmdb.org/t/p/original/tiIpajUBpLMNWMEzpjRBxo0jCbD.jpg";

const defaultGenreLookup = {
  12: "Petualangan",
  14: "Fantasi",
  16: "Animasi",
  18: "Drama",
  27: "Horor",
  28: "Aksi",
  35: "Komedi",
  53: "Thriller",
  878: "Sci-Fi",
  9648: "Misteri",
  10749: "Romantis",
  10751: "Keluarga",
};

const movieFilterGenreOptions = [
  { value: "all", label: "Semua" },
  { value: "18", label: "Drama" },
  { value: "53", label: "Thriller" },
  { value: "16", label: "Animasi" },
  { value: "35", label: "Komedi" },
  { value: "12", label: "Adventure" },
  { value: "14", label: "Fantasy" },
  { value: "27", label: "Horror" },
  { value: "28", label: "Aksi" },
  { value: "10749", label: "Romantis" },
];

const platformFilterOptions = [
  { value: "all", label: "Semua" },
  { value: "netflix", label: "Netflix" },
  { value: "disney", label: "Disney+" },
  { value: "prime", label: "Prime Video" },
  { value: "vidio", label: "Vidio" },
  { value: "viu", label: "Viu" },
  { value: "wetv", label: "WeTV" },
  { value: "hbo", label: "HBO Max" },
  { value: "apple", label: "Apple TV" },
  { value: "catchplay", label: "Catchplay" },
];

const platformMatchers = {
  netflix: ["netflix"],
  disney: ["disney", "hotstar"],
  prime: ["prime video", "amazon"],
  vidio: ["vidio"],
  viu: ["viu"],
  wetv: ["wetv", "we tv"],
  hbo: ["hbo", "max"],
  apple: ["apple tv"],
  catchplay: ["catchplay"],
};

const movieSortOptions = [
  { value: "latest", label: "Terbaru" },
  { value: "za", label: "Z - A" },
  { value: "az", label: "A - Z" },
  { value: "rating", label: "Rating Tertinggi" },
];

const defaultFilterValues = {
  genre: "all",
  platform: "all",
  sort: "latest",
};

const fallbackMovies = Array.from({ length: 8 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  title: "Cargo",
  year: "2023",
  rating: "4.9",
  poster: fallbackPosterUrl,
  backdrop: fallbackBackdropUrl,
  overview: "Seorang ayah berusaha melindungi bayinya dalam perjalanan penuh risiko setelah wabah mengubah dunia menjadi tempat yang berbahaya.",
  genre_ids: [18, 53],
}));

const heroMovieLimit = 4;

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
    return "Deskripsi belum tersedia.";
  }

  if (cleanOverview.length <= 96) {
    return cleanOverview;
  }

  return `${cleanOverview.slice(0, 93).trim()}...`;
};

const getProviderNames = (watchProviders = {}) => {
  const providers = [
    ...(watchProviders.all || []),
    ...(watchProviders.flatrate || []),
    ...(watchProviders.free || []),
    ...(watchProviders.ads || []),
    ...(watchProviders.rent || []),
    ...(watchProviders.buy || []),
  ];

  return [...new Set(providers.map((provider) => provider.provider_name || ""))]
    .map((providerName) => providerName.toLowerCase())
    .filter(Boolean);
};

const matchesPlatformFilter = (watchProviders, selectedPlatform) => {
  if (selectedPlatform === "all") {
    return true;
  }

  const keywords = platformMatchers[selectedPlatform] || [selectedPlatform];
  return getProviderNames(watchProviders).some((providerName) =>
    keywords.some((keyword) => providerName.includes(keyword)),
  );
};

const getRatingSortScore = (rating) => {
  const score = Number(rating);
  return Number.isFinite(score) ? score : 0;
};

const sortMovieList = (movies, sortKey) => {
  const sortedMovies = [...movies];

  if (sortKey === "az") {
    return sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortKey === "za") {
    return sortedMovies.sort((a, b) => b.title.localeCompare(a.title));
  }

  if (sortKey === "rating") {
    return sortedMovies.sort(
      (a, b) => getRatingSortScore(b.rating) - getRatingSortScore(a.rating),
    );
  }

  return sortedMovies;
};

const applyMovieFilters = (movies, filters, providersByMovieId) => {
  const filteredMovies = movies.filter((movie) => {
    const movieId = String(movie.id);
    const matchesGenre =
      filters.genre === "all" ||
      (movie.genre_ids || []).map((genreId) => String(genreId)).includes(filters.genre);
    const hasLoadedProvider = Object.prototype.hasOwnProperty.call(
      providersByMovieId,
      movieId,
    );
    const matchesPlatform =
      filters.platform === "all" ||
      !hasLoadedProvider ||
      matchesPlatformFilter(providersByMovieId[movieId], filters.platform);

    return matchesGenre && matchesPlatform;
  });

  return sortMovieList(filteredMovies, filters.sort);
};

const mapTmdbMovie = (movie) => ({
  id: movie.id,
  title: movie.title || movie.original_title || "Untitled",
  year: getMovieYear(movie.release_date),
  rating: getMovieRating(movie.vote_average),
  poster: movie.poster_url,
  backdrop: movie.backdrop_url,
  overview: getShortOverview(movie.overview),
  release_date: movie.release_date,
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

function Homepage() {
  const navigate = useNavigate();
  const moodScrollerRef = useRef(null);
  const token = localStorage.getItem("token");

  const [selectedMood, setSelectedMood] = useState(moods[0]);

  const [hitMovies, setHitMovies] = useState([fallbackHeroMovie, ...fallbackMovies]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [moodMovies, setMoodMovies] = useState(fallbackMovies);
  const [watchlist, setWatchlist] = useState([]);
  const [pendingWatchlistMovie, setPendingWatchlistMovie] = useState(null);
  const [providersByMovieId, setProvidersByMovieId] = useState({});
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [moodLoading, setMoodLoading] = useState(true);
  const [moodError, setMoodError] = useState("");
  const [genreLookup, setGenreLookup] = useState(defaultGenreLookup);

  const filteredMoodMovies = applyMovieFilters(
    moodMovies,
    filterValues,
    providersByMovieId,
  );
  const savedMovieIds = useMemo(
    () => new Set(watchlist.map((movie) => String(movie.id))),
    [watchlist],
  );

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!token) {
        setWatchlist([]);
        return;
      }

      try {
        const data = await fetchWatchlist({ token, mediaType: "movie" });
        setWatchlist(data.items);
      } catch {
        setWatchlist([]);
      }
    };

    loadWatchlist();
  }, [token]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/movies/genres?language=id-ID`);

        if (!response.ok) {
          throw new Error("Gagal mengambil genre");
        }

        const data = await response.json();
        const genres = Object.fromEntries(
          (data.genres || []).map((genre) => [genre.id, genre.name])
        );

        setGenreLookup({
          ...defaultGenreLookup,
          ...genres,
        });
      } catch {
        setGenreLookup(defaultGenreLookup);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchHitMovies = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const [nowPlayingResponse, trendingResponse] = await Promise.all([
          fetch(`${apiUrl}/api/movies/now-playing?region=ID&language=id-ID`),
          fetch(`${apiUrl}/api/movies/trending?time_window=week&language=id-ID`),
        ]);

        if (!nowPlayingResponse.ok && !trendingResponse.ok) {
          throw new Error("Gagal mengambil film hits");
        }

        const nowPlayingData = nowPlayingResponse.ok
          ? await nowPlayingResponse.json()
          : { results: [] };
        const trendingData = trendingResponse.ok
          ? await trendingResponse.json()
          : { results: [] };

        const movies = uniqueById([
          ...(nowPlayingData.results || []),
          ...(trendingData.results || []),
        ].map(mapTmdbMovie)).slice(0, heroMovieLimit);

        if (movies.length > 0) {
          setHitMovies(movies);
          setActiveHeroIndex(0);
        }
      } catch {
        setHitMovies([fallbackHeroMovie, ...fallbackMovies].slice(0, heroMovieLimit));
      }
    };

    fetchHitMovies();
  }, []);

  useEffect(() => {
    if (hitMovies.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % hitMovies.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [hitMovies]);

  useEffect(() => {
    const fetchMoodMovies = async () => {
      try {
        setMoodLoading(true);
        setMoodError("");

        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/movies/discover?genre=${encodeURIComponent(
            selectedMood.genre
          )}&sort_by=popularity.desc&language=id-ID&page=1`
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil rekomendasi mood");
        }

        const data = await response.json();
        const movies = uniqueById((data.results || []).map(mapTmdbMovie)).slice(0, 16);

        if (movies.length > 0) {
          setMoodMovies(movies);
          moodScrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
        }
      } catch {
        setMoodError("Rekomendasi mood belum bisa dimuat, menampilkan data contoh.");
        setMoodMovies(fallbackMovies);
      } finally {
        setMoodLoading(false);
      }
    };

    fetchMoodMovies();
  }, [selectedMood]);

  useEffect(() => {
    const missingMovieIds = moodMovies
      .map((movie) => String(movie.id))
      .filter(
        (movieId) =>
          Number.isInteger(Number(movieId)) &&
          !Object.prototype.hasOwnProperty.call(providersByMovieId, movieId),
      );

    if (missingMovieIds.length === 0) {
      return undefined;
    }

    let shouldIgnore = false;

    const loadMovieProviders = async () => {
      const providerEntries = await Promise.all(
        missingMovieIds.map(async (movieId) => {
          try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/movies/${movieId}/watch-providers`);

            if (!response.ok) {
              throw new Error("Gagal mengambil provider film");
            }

            const data = await response.json();
            return [movieId, data];
          } catch {
            return [movieId, { all: [] }];
          }
        }),
      );

      if (!shouldIgnore) {
        setProvidersByMovieId((currentProviders) => ({
          ...currentProviders,
          ...Object.fromEntries(providerEntries),
        }));
      }
    };

    loadMovieProviders();

    return () => {
      shouldIgnore = true;
    };
  }, [moodMovies, providersByMovieId]);

  const moveHero = (direction) => {
    setActiveHeroIndex((currentIndex) => {
      const totalMovies = hitMovies.length || 1;
      return (currentIndex + direction + totalMovies) % totalMovies;
    });
  };

  const heroMovies = hitMovies.slice(0, heroMovieLimit);
  const currentHeroMovie = heroMovies[activeHeroIndex] || fallbackHeroMovie;
  const heroBackdrop = currentHeroMovie.backdrop || fallbackHeroMovie.backdrop;
  const openMovieDetail = (movieId) => {
    if (Number.isInteger(Number(movieId))) {
      navigate(`/movie/${movieId}`);
    }
  };

  const saveMovieToWatchlist = async (movie) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const savedItem = await addWatchlistItem({
      token,
      payload: mapMovieToWatchlistPayload(movie),
    });

    setWatchlist((currentWatchlist) => {
      const movieId = String(savedItem.id);
      const withoutDuplicate = currentWatchlist.filter(
        (savedMovie) => String(savedMovie.id) !== movieId,
      );

      return [savedItem, ...withoutDuplicate];
    });
  };

  const toggleWatchlist = async (movie) => {
    const movieId = String(movie.id);

    if (savedMovieIds.has(movieId)) {
      const savedItem = watchlist.find((savedMovie) => String(savedMovie.id) === movieId);

      if (savedItem?.id_watchlist && token) {
        await deleteWatchlistItem({ token, idWatchlist: savedItem.id_watchlist });
      }

      setWatchlist((currentWatchlist) =>
        currentWatchlist.filter((savedMovie) => String(savedMovie.id) !== movieId),
      );
      return;
    }

    setPendingWatchlistMovie(movie);
  };

  const confirmSaveToWatchlist = async () => {
    if (pendingWatchlistMovie) {
      await saveMovieToWatchlist(pendingWatchlistMovie);
    }

    setPendingWatchlistMovie(null);
  };

  return (
    <main className="homepage">
      <SiteNavbar mode="absolute" activeKey="home" />

      <section
        className="homepage-hero"
        style={{ "--hero-backdrop": `url(${heroBackdrop})` }}
      >
        <div className="homepage-hero-inner">
          <div className="homepage-copy">
            <div className="homepage-kicker">
              <span />
              WEBSITE REKOMENDASI FILM
            </div>

            <h1>
              Temukan Film
              <br />
              yang <strong>Tepat</strong>
              <br />
              untuk Harimu
            </h1>

            <p>
              Pilih suasana hatimu sekarang! FLIX akan merekomendasikan film &amp;
              series terbaik yang sesuai perasaanmu.
            </p>

            <div className="homepage-hero-buttons">
              <a className="homepage-primary-btn" href="#mood">
                <FaPlay />
                Pilih Mood
              </a>
              <button
                className="homepage-secondary-btn"
                type="button"
                onClick={() => navigate("/watchlist")}
              >
                Lihat Watchlist
              </button>
            </div>
          </div>

          <div className="homepage-feature-wrap">
            <article
              className="homepage-feature-card"
              role="button"
              tabIndex={0}
              onClick={() => openMovieDetail(currentHeroMovie.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  openMovieDetail(currentHeroMovie.id);
                }
              }}
            >
              <div className="homepage-feature-poster">
                <img src={currentHeroMovie.poster} alt={currentHeroMovie.title} />
              </div>
              <div className="homepage-feature-meta">
                <span>
                  <FaStar />
                  {currentHeroMovie.rating}
                </span>
                <span>{currentHeroMovie.year}</span>
              </div>
              <h2>{currentHeroMovie.title}</h2>
            </article>

            <div className="homepage-feature-controls">
              <button
                className="homepage-hero-arrow"
                type="button"
                onClick={() => moveHero(-1)}
                aria-label="Film hits sebelumnya"
              >
                <FaChevronLeft />
              </button>

              <div className="homepage-dots" aria-label="Pilih film hits">
                {heroMovies.map((movie, index) => (
                  <button
                    className={activeHeroIndex === index ? "is-active" : ""}
                    key={movie.id}
                    type="button"
                    onClick={() => setActiveHeroIndex(index)}
                    aria-label={`Tampilkan ${movie.title}`}
                  />
                ))}
              </div>

              <button
                className="homepage-hero-arrow"
                type="button"
                onClick={() => moveHero(1)}
                aria-label="Film hits berikutnya"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="homepage-mood-section" id="mood">
        <div className="homepage-section-header">
          <div className="homepage-section-kicker">
            <span />
            PILIH MOOD
          </div>
          <h2>
            Bagaimana <strong>Mood Mu</strong> Hari Ini?
          </h2>
          <p>Pilih suasana hatimu - kami siapkan tontonan yang pas</p>
        </div>

        <div className="homepage-mood-grid">
          {moods.map((mood) => (
            <button
              className={`homepage-mood-card ${selectedMood.id === mood.id ? "is-selected" : ""
                }`}
              key={mood.id}
              type="button"
              onClick={() => setSelectedMood(mood)}
            >
              <span className="homepage-mood-icon">
                <img src={mood.icon} alt="" aria-hidden="true" />
              </span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="homepage-recommendations" id="recommendations">
        <div className="homepage-recommendation-top">
          <div className="homepage-recommendation-label">
            Rekomendasi Film Untuk Mood {selectedMood.label}
          </div>
          <div className="homepage-recommendation-actions">
            <button
              className="homepage-filter"
              type="button"
              onClick={() => setIsFilterOpen(true)}
            >
              <FaSlidersH />
              Filter
            </button>
          </div>
        </div>

        {moodError && <p className="homepage-movie-status">{moodError}</p>}
        {moodLoading && <p className="homepage-movie-status">Memuat rekomendasi mood...</p>}
        {!moodLoading && filteredMoodMovies.length === 0 && (
          <p className="homepage-movie-status">
            Tidak ada film yang cocok dengan filter ini.
          </p>
        )}

        <div className="homepage-movie-carousel" ref={moodScrollerRef}>
          {filteredMoodMovies.map((movie) => {
            const movieGenres = (movie.genre_ids || [])
              .map((genreId) => genreLookup[genreId])
              .filter(Boolean)
              .slice(0, 2);

            return (
              <article
                className="homepage-movie-card"
                key={movie.id}
                role="button"
                tabIndex={0}
                onClick={() => openMovieDetail(movie.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openMovieDetail(movie.id);
                  }
                }}
              >
                <div className="homepage-movie-poster">
                  <img src={movie.poster} alt={movie.title} />
                  <button
                    type="button"
                    aria-label={
                      savedMovieIds.has(String(movie.id))
                        ? `Hapus ${movie.title} dari watchlist`
                        : `Simpan ${movie.title}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleWatchlist(movie);
                    }}
                  >
                    {savedMovieIds.has(String(movie.id)) ? (
                      <FaBookmark />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                  <div className="homepage-movie-overlay" aria-hidden="true">
                    <div className="homepage-movie-genres">
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
                  <span>
                    <FaStar />
                    {movie.rating}
                  </span>
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <Footer />

      <FilterPopup
        open={isFilterOpen}
        title="Filter Rekomendasi"
        values={filterValues}
        genreOptions={movieFilterGenreOptions}
        platformOptions={platformFilterOptions}
        sortOptions={movieSortOptions}
        onChange={setFilterValues}
        onClose={() => setIsFilterOpen(false)}
      />

      <WatchlistConfirmModal
        open={Boolean(pendingWatchlistMovie)}
        item={pendingWatchlistMovie}
        mediaLabel="Film"
        onCancel={() => setPendingWatchlistMovie(null)}
        onConfirm={confirmSaveToWatchlist}
      />
    </main>
  );
}

export default Homepage;
