import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaFilter,
  FaPlay,
  FaRegBookmark,
  FaSearch,
  FaShareAlt,
  FaStar,
  FaTimes,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import SiteNavbar from "../../components/layout/SiteNavbar";
import FilterPopup from "../../components/common/FilterPopup";
import WatchlistConfirmModal from "../../components/watchlist/WatchlistConfirmModal";
import { buildApiUrl } from "../../utils/api";
import {
  addWatchlistItem,
  deleteWatchlistItem,
  fetchWatchlist,
  mapMovieToWatchlistPayload,
} from "../../utils/watchlist";
import amazonPrimeVideoIcon from "../../assets/platformstream-logo/amazonprimevideo-icon.png";
import appleTvIcon from "../../assets/platformstream-logo/appletv-icon.png";
import catchplayIcon from "../../assets/platformstream-logo/catchplay-icon.png";
import disneyHotstarIcon from "../../assets/platformstream-logo/disneyhotstar-icon.png";
import hboMaxIcon from "../../assets/platformstream-logo/HBOmax-icon.png";
import netflixIcon from "../../assets/platformstream-logo/netflix-icon.png";
import "./MoviesPage.css";

const fallbackPosterUrl =
  "https://image.tmdb.org/t/p/w500/cdPSUck4tBRvRu6DFk6XciDrssn.jpg";
const fallbackBackdropUrl =
  "https://image.tmdb.org/t/p/original/tiIpajUBpLMNWMEzpjRBxo0jCbD.jpg";

const fallbackMovies = Array.from({ length: 10 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  title: "Cargo",
  year: "2023",
  rating: "4.9",
  poster: fallbackPosterUrl,
  backdrop: fallbackBackdropUrl,
  overview:
    "Seorang ayah berusaha melindungi bayinya dalam perjalanan penuh risiko setelah wabah mengubah dunia.",
  releaseLabel: "15 February 2024",
  genre_ids: [18, 53],
}));

const defaultGenreLookup = {
  12: "Petualangan",
  14: "Fantasi",
  16: "Animasi",
  18: "Drama",
  27: "Horor",
  28: "Aksi",
  35: "Komedi",
  53: "Thriller",
  80: "Kriminal",
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
    matches.some((keyword) => normalizedName.includes(keyword)),
  );

  return match?.icon || null;
};

const getMovieYear = (date) => date?.slice(0, 4) || "-";

const formatReleaseDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

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

  if (cleanOverview.length <= 160) {
    return cleanOverview;
  }

  return `${cleanOverview.slice(0, 157).trim()}...`;
};

const getProviderLogos = (watchProviders) => {
  const preferredProviders =
    watchProviders?.flatrate?.length > 0
      ? watchProviders.flatrate
      : watchProviders?.all || [];
  const seenProviderKeys = new Set();

  return preferredProviders
    .map((provider) => {
      const localIcon = getLocalProviderIcon(provider.provider_name);
      const icon = localIcon || provider.logo_url;
      const providerKey = localIcon || provider.provider_id || provider.provider_name;

      return {
        id: provider.provider_id,
        name: provider.provider_name,
        icon,
        providerKey,
      };
    })
    .filter((provider) => {
      if (!provider.icon || seenProviderKeys.has(provider.providerKey)) {
        return false;
      }

      seenProviderKeys.add(provider.providerKey);
      return true;
    })
    .slice(0, 4);
};

const getTrailerUrl = (videos = []) => {
  const youtubeVideos = videos.filter((video) => video.youtube_url);
  const trailer =
    youtubeVideos.find(
      (video) => video.official && video.type?.toLowerCase() === "trailer",
    ) ||
    youtubeVideos.find((video) => video.type?.toLowerCase() === "trailer") ||
    youtubeVideos.find((video) => video.type?.toLowerCase() === "teaser") ||
    youtubeVideos[0];

  return trailer?.youtube_url || null;
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
  backdrop: movie.backdrop_url || movie.poster_url,
  overview: getShortOverview(movie.overview),
  release_date: movie.release_date,
  releaseLabel: formatReleaseDate(movie.release_date),
  providers: [],
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

function MovieCard({
  movie,
  isSaved,
  onOpen,
  onToggleWatchlist,
  genreLookup = defaultGenreLookup,
  removeMode = false,
}) {
  const movieGenres = (movie.genre_ids || [])
    .map((genreId) => genreLookup[genreId])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article className="movies-card" onClick={() => onOpen(movie.id)}>
      <div className="movies-card-poster">
        <img src={movie.poster} alt={movie.title} />
        <button
          className="movies-card-save"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatchlist(movie);
          }}
          aria-label={
            isSaved ? `Hapus ${movie.title} dari watchlist` : `Simpan ${movie.title}`
          }
        >
          {removeMode ? <FaTimes /> : isSaved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
        <div className="movies-card-overlay" aria-hidden="true">
          <div className="movies-card-genres">
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

function MoviesPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [watchlist, setWatchlist] = useState([]);
  const [pendingWatchlistMovie, setPendingWatchlistMovie] = useState(null);
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [watchlistError, setWatchlistError] = useState("");
  const [trendingMovies, setTrendingMovies] = useState(fallbackMovies.slice(0, 3));
  const [allMovies, setAllMovies] = useState(fallbackMovies);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroProvidersByMovieId, setHeroProvidersByMovieId] = useState({});
  const [heroTrailerUrls, setHeroTrailerUrls] = useState({});
  const [providersByMovieId, setProvidersByMovieId] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [genreLookup, setGenreLookup] = useState(defaultGenreLookup);
  const [loading, setLoading] = useState(true);

  const savedMovieIds = useMemo(
    () => new Set(watchlist.map((movie) => String(movie.id))),
    [watchlist],
  );

  const heroMovies = trendingMovies.slice(0, 4);
  const activeHeroMovie = heroMovies[activeHeroIndex] || heroMovies[0] || fallbackMovies[0];
  const activeHeroProviders =
    heroProvidersByMovieId[activeHeroMovie.id] || activeHeroMovie.providers || [];
  const hasLoadedActiveHeroProviders = Object.prototype.hasOwnProperty.call(
    heroProvidersByMovieId,
    activeHeroMovie.id,
  );
  const searchedAllMovies = allMovies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );
  const filteredAllMovies = applyMovieFilters(
    searchedAllMovies,
    filterValues,
    providersByMovieId,
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
    const loadGenres = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/movies/genres?language=id-ID"));

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const genres = Object.fromEntries(
          (data.genres || []).map((genre) => [genre.id, genre.name]),
        );

        setGenreLookup({
          ...defaultGenreLookup,
          ...genres,
        });
      } catch {
        setGenreLookup(defaultGenreLookup);
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const [trendingResponse, latestResponse] = await Promise.all([
          fetch(buildApiUrl("/api/movies/trending?time_window=week&language=id-ID")),
          fetch(
            buildApiUrl("/api/movies/discover?sort_by=primary_release_date.desc&language=id-ID&page=1"),
          ),
        ]);

        const trendingData = trendingResponse.ok
          ? await trendingResponse.json()
          : { results: [] };
        const latestData = latestResponse.ok ? await latestResponse.json() : { results: [] };
        const mappedTrending = uniqueById(
          (trendingData.results || []).map(mapTmdbMovie),
        );
        const mappedLatest = uniqueById((latestData.results || []).map(mapTmdbMovie));

        if (mappedTrending.length > 0) {
          setTrendingMovies(mappedTrending.slice(0, 3));
        }

        if (mappedLatest.length > 0) {
          setAllMovies(mappedLatest.slice(0, 10));
        }
      } catch {
        setTrendingMovies(fallbackMovies.slice(0, 3));
        setAllMovies(fallbackMovies);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  useEffect(() => {
    if (heroMovies.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroMovies.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [heroMovies.length]);

  useEffect(() => {
    const missingMovieIds = allMovies
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
            const response = await fetch(buildApiUrl(`/api/movies/${movieId}/watch-providers`));

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
  }, [allMovies, providersByMovieId]);

  useEffect(() => {
    const movieId = activeHeroMovie?.id;

    if (!Number.isInteger(Number(movieId)) || heroProvidersByMovieId[movieId]) {
      return undefined;
    }

    let shouldIgnore = false;

    const loadHeroProvider = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/movies/${movieId}/watch-providers`));

        if (!response.ok) {
          throw new Error("Gagal mengambil provider film");
        }

        const data = await response.json();
        const providerLogos = getProviderLogos(data);

        if (!shouldIgnore) {
          setHeroProvidersByMovieId((currentProviders) => ({
            ...currentProviders,
            [movieId]: providerLogos,
          }));
        }
      } catch {
        if (!shouldIgnore) {
          setHeroProvidersByMovieId((currentProviders) => ({
            ...currentProviders,
            [movieId]: [],
          }));
        }
      }
    };

    loadHeroProvider();

    return () => {
      shouldIgnore = true;
    };
  }, [activeHeroMovie?.id, heroProvidersByMovieId]);

  const openMovie = (movieId) => {
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
    if (!pendingWatchlistMovie || watchlistSaving) {
      return;
    }

    try {
      setWatchlistSaving(true);
      setWatchlistError("");
      await saveMovieToWatchlist(pendingWatchlistMovie);
      setPendingWatchlistMovie(null);
    } catch (error) {
      setWatchlistError(error.message || "Gagal menyimpan watchlist");
    } finally {
      setWatchlistSaving(false);
    }
  };

  const moveHero = (direction) => {
    setActiveHeroIndex((currentIndex) => {
      const totalMovies = heroMovies.length || 1;
      return (currentIndex + direction + totalMovies) % totalMovies;
    });
  };

  const handleShareHero = async () => {
    const url = `${window.location.origin}/movie/${activeHeroMovie.id}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Salin link film:", url);
    }
  };

  const handleWatchTrailer = async () => {
    const movieId = activeHeroMovie.id;

    if (!Number.isInteger(Number(movieId))) {
      return;
    }

    if (heroTrailerUrls[movieId]) {
      window.open(heroTrailerUrls[movieId], "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const fetchVideos = async (language) => {
        const response = await fetch(
          buildApiUrl(`/api/movies/${movieId}/videos?language=${language}`),
        );

        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        return data.results || [];
      };

      const localizedVideos = await fetchVideos("id-ID");
      const fallbackVideos =
        localizedVideos.length > 0 ? [] : await fetchVideos("en-US");
      const trailerUrl = getTrailerUrl([...localizedVideos, ...fallbackVideos]);

      if (!trailerUrl) {
        window.alert("Trailer belum tersedia untuk film ini.");
        return;
      }

      setHeroTrailerUrls((currentUrls) => ({
        ...currentUrls,
        [movieId]: trailerUrl,
      }));
      window.open(trailerUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Gagal membuka trailer film.");
    }
  };

  return (
    <main className="movies-page">
      <SiteNavbar mode="fixed" activeKey="movies" />

      <section
        className="movies-hero"
        style={{ "--movies-hero-backdrop": `url(${activeHeroMovie.backdrop})` }}
      >
        <button
          className="movies-hero-arrow movies-hero-arrow-left"
          type="button"
          onClick={() => moveHero(-1)}
          aria-label="Film sebelumnya"
        >
          <FaChevronLeft />
        </button>

        <div className="movies-hero-copy">
          <div className="movies-hero-eyebrow">
            <span className="movies-hero-available-label">AVAILABLE ON</span>
            {activeHeroProviders.length > 0 ? (
              <div className="movies-hero-provider-logos" aria-label="Platform streaming">
                {activeHeroProviders.map((provider) => (
                  <img
                    src={provider.icon}
                    alt={provider.name}
                    key={`${provider.providerKey}-${provider.name}`}
                    title={provider.name}
                  />
                ))}
              </div>
            ) : (
              <strong>
                {hasLoadedActiveHeroProviders ? "Belum tersedia" : "Memuat..."}
              </strong>
            )}
            <span className="movies-hero-divider" />
            <span>{activeHeroMovie.releaseLabel}</span>
          </div>
          <h1>{activeHeroMovie.title}</h1>
          <div className="movies-hero-meta">
            <span className="movies-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar key={star} />
              ))}
            </span>
            <span>{activeHeroMovie.rating}</span>
            <span>Film</span>
            <span>Trending</span>
          </div>
          <p>{activeHeroMovie.overview}</p>

          <div className="movies-hero-buttons">
            <button type="button" onClick={handleWatchTrailer}>
              <FaPlay />
              Tonton Trailer
            </button>
            <button type="button" onClick={() => toggleWatchlist(activeHeroMovie)}>
              {savedMovieIds.has(String(activeHeroMovie.id)) ? (
                <FaBookmark />
              ) : (
                <FaRegBookmark />
              )}
              Simpan ke Watchlist
            </button>
            <button type="button" onClick={handleShareHero} aria-label="Bagikan film">
              <FaShareAlt />
            </button>
          </div>
        </div>

        <button
          className="movies-hero-arrow movies-hero-arrow-right"
          type="button"
          onClick={() => moveHero(1)}
          aria-label="Film berikutnya"
        >
          <FaChevronRight />
        </button>

        <div className="movies-hero-dots" aria-label="Pilih film hero">
          {heroMovies.map((movie, index) => (
            <button
              className={activeHeroIndex === index ? "is-active" : ""}
              type="button"
              key={movie.id}
              onClick={() => setActiveHeroIndex(index)}
              aria-label={`Tampilkan ${movie.title}`}
            />
          ))}
        </div>
      </section>

      <section className="movies-section">
        <div className="movies-section-header">
          <h2>Tonton Watchlist Kamu</h2>
          {watchlist.length > 0 && (
            <button type="button" onClick={() => navigate("/watchlist")}>
              Lihat Semua
            </button>
          )}
        </div>

        {watchlist.length > 0 ? (
          <div className="movies-card-row">
            {watchlist.slice(0, 5).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isSaved={savedMovieIds.has(String(movie.id))}
                onOpen={openMovie}
                onToggleWatchlist={toggleWatchlist}
                genreLookup={genreLookup}
                removeMode
              />
            ))}
          </div>
        ) : (
          <div className="movies-empty-watchlist">
            <h3>Ayo cari film dan simpan ke watchlist</h3>
            <p>Film yang kamu simpan akan muncul di section ini.</p>
            <a href="#all-movies">Cari Film</a>
          </div>
        )}
      </section>

      <section className="movies-section movies-trending-section">
        <h2>
          Trending <strong>Sekarang</strong>
        </h2>
        <div className="movies-trending-list">
          {trendingMovies.slice(0, 3).map((movie, index) => (
            <div className="movies-trending-item" key={movie.id}>
              <span className="movies-rank">{index + 1}</span>
              <MovieCard
                movie={movie}
                isSaved={savedMovieIds.has(String(movie.id))}
                onOpen={openMovie}
                onToggleWatchlist={toggleWatchlist}
                genreLookup={genreLookup}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="movies-section movies-all-section" id="all-movies">
        <div className="movies-section-header movies-all-header">
          <h2>Semua Film</h2>
          <div className="movies-all-tools">
            <label>
              <FaSearch />
              <input
                type="search"
                placeholder="Cari Film..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <button type="button" onClick={() => setIsFilterOpen(true)}>
              <FaFilter />
              Filter
            </button>
          </div>
        </div>

        {loading && <p className="movies-status">Memuat film...</p>}
        {!loading && filteredAllMovies.length === 0 && (
          <p className="movies-status">Film tidak ditemukan.</p>
        )}

        <div className="movies-grid">
          {filteredAllMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isSaved={savedMovieIds.has(String(movie.id))}
              onOpen={openMovie}
              onToggleWatchlist={toggleWatchlist}
              genreLookup={genreLookup}
            />
          ))}
        </div>
      </section>

      <footer className="movies-footer">
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

      <FilterPopup
        open={isFilterOpen}
        title="Filter Film"
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
        onCancel={() => {
          setPendingWatchlistMovie(null);
          setWatchlistError("");
        }}
        onConfirm={confirmSaveToWatchlist}
        loading={watchlistSaving}
        errorMessage={watchlistError}
      />
    </main>
  );
}

export default MoviesPage;
