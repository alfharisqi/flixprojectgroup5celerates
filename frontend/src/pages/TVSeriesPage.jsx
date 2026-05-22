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
import SiteNavbar from "../components/SiteNavbar";
import amazonPrimeVideoIcon from "../assets/platformstream-logo/amazonprimevideo-icon.png";
import appleTvIcon from "../assets/platformstream-logo/appletv-icon.png";
import catchplayIcon from "../assets/platformstream-logo/catchplay-icon.png";
import disneyHotstarIcon from "../assets/platformstream-logo/disneyhotstar-icon.png";
import hboMaxIcon from "../assets/platformstream-logo/HBOmax-icon.png";
import netflixIcon from "../assets/platformstream-logo/netflix-icon.png";
import "./TVSeriesPage.css";

const apiUrl = import.meta.env.VITE_API_URL;

const fallbackPosterUrl =
  "https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg";
const fallbackBackdropUrl =
  "https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg";

const fallbackSeries = Array.from({ length: 10 }, (_, index) => ({
  id: `fallback-tv-${index + 1}`,
  title: "The Last of Us",
  year: "2023",
  rating: "4.2",
  poster: fallbackPosterUrl,
  backdrop: fallbackBackdropUrl,
  overview:
    "Dua penyintas melakukan perjalanan melewati dunia yang berubah, membawa harapan di tengah bahaya dan kehilangan.",
  releaseLabel: "15 Januari 2023",
  providers: [],
  genre_ids: [18, 10765],
}));

const defaultGenreLookup = {
  16: "Animasi",
  18: "Drama",
  35: "Komedi",
  37: "Western",
  80: "Kriminal",
  99: "Dokumenter",
  9648: "Misteri",
  10751: "Keluarga",
  10759: "Aksi & Petualangan",
  10762: "Anak",
  10763: "Berita",
  10764: "Reality",
  10765: "Sci-Fi & Fantasi",
  10766: "Soap",
  10767: "Talk",
  10768: "Perang & Politik",
};

const providerIconMatchers = [
  { icon: netflixIcon, matches: ["netflix"] },
  { icon: disneyHotstarIcon, matches: ["disney", "hotstar"] },
  { icon: hboMaxIcon, matches: ["hbo", "max"] },
  { icon: catchplayIcon, matches: ["catchplay"] },
  { icon: appleTvIcon, matches: ["apple tv"] },
  { icon: amazonPrimeVideoIcon, matches: ["amazon", "prime video"] },
];

const getLocalProviderIcon = (providerName = "") => {
  const normalizedName = providerName.toLowerCase();
  const match = providerIconMatchers.find(({ matches }) =>
    matches.some((keyword) => normalizedName.includes(keyword)),
  );

  return match?.icon || null;
};

const getSeriesYear = (date) => date?.slice(0, 4) || "-";

const formatAirDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const getSeriesRating = (voteAverage) => {
  const numericRating = Number(voteAverage);

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return "-";
  }

  return (numericRating / 2).toFixed(1);
};

const getShortOverview = (overview) => {
  const cleanOverview = overview?.trim();

  if (!cleanOverview) {
    return "Deskripsi series belum tersedia.";
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

const mapTmdbSeries = (series) => ({
  id: series.id,
  title: series.title || series.name || series.original_name || "Untitled",
  year: getSeriesYear(series.first_air_date),
  rating: getSeriesRating(series.vote_average),
  poster: series.poster_url,
  backdrop: series.backdrop_url || series.poster_url,
  overview: getShortOverview(series.overview),
  releaseLabel: formatAirDate(series.first_air_date),
  providers: [],
  genre_ids: series.genre_ids || [],
});

const uniqueById = (seriesList) => {
  const seen = new Set();

  return seriesList.filter((series) => {
    if (!series.id || seen.has(series.id) || !series.poster) {
      return false;
    }

    seen.add(series.id);
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
  `flix_tv_watchlist_${user?.id_user || "guest"}`;

const readWatchlist = (key) => {
  try {
    const savedWatchlist = JSON.parse(localStorage.getItem(key));
    return Array.isArray(savedWatchlist) ? savedWatchlist : [];
  } catch {
    return [];
  }
};

function SeriesCard({
  series,
  isSaved,
  onOpen,
  onToggleWatchlist,
  genreLookup = defaultGenreLookup,
  removeMode = false,
}) {
  const seriesGenres = (series.genre_ids || [])
    .map((genreId) => genreLookup[genreId])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article className="tv-series-card" onClick={() => onOpen(series.id)}>
      <div className="tv-series-card-poster">
        <img src={series.poster} alt={series.title} />
        <button
          className="tv-series-card-save"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatchlist(series);
          }}
          aria-label={
            isSaved
              ? `Hapus ${series.title} dari watchlist`
              : `Simpan ${series.title}`
          }
        >
          {removeMode ? <FaTimes /> : isSaved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
        <div className="tv-series-card-overlay" aria-hidden="true">
          <div className="tv-series-card-genres">
            {(seriesGenres.length > 0 ? seriesGenres : ["Series"]).map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>
          <p>{getShortOverview(series.overview)}</p>
        </div>
      </div>
      <h3>{series.title}</h3>
      <p>
        {series.year}
        <span />
        <strong>
          <FaStar />
          {series.rating}
        </strong>
      </p>
    </article>
  );
}

function TVSeriesPage() {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);
  const watchlistKey = useMemo(() => getWatchlistKey(user), [user]);
  const [watchlist, setWatchlist] = useState(() => readWatchlist(watchlistKey));
  const [trendingSeries, setTrendingSeries] = useState(fallbackSeries.slice(0, 4));
  const [popularSeries, setPopularSeries] = useState(fallbackSeries);
  const [allSeries, setAllSeries] = useState(fallbackSeries);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [popularCarouselIndex, setPopularCarouselIndex] = useState(0);
  const [heroProvidersBySeriesId, setHeroProvidersBySeriesId] = useState({});
  const [heroTrailerUrls, setHeroTrailerUrls] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [genreLookup, setGenreLookup] = useState(defaultGenreLookup);
  const [loading, setLoading] = useState(true);

  const savedSeriesIds = useMemo(
    () => new Set(watchlist.map((series) => String(series.id))),
    [watchlist],
  );

  const heroSeries = trendingSeries.slice(0, 4);
  const activeHeroSeries =
    heroSeries[activeHeroIndex] || heroSeries[0] || fallbackSeries[0];
  const activeHeroProviders =
    heroProvidersBySeriesId[activeHeroSeries.id] || activeHeroSeries.providers || [];
  const hasLoadedActiveHeroProviders = Object.prototype.hasOwnProperty.call(
    heroProvidersBySeriesId,
    activeHeroSeries.id,
  );
  const topTenPopularSeries = popularSeries.slice(0, 10);
  const visiblePopularSeries = useMemo(() => {
    const visibleCount = Math.min(5, topTenPopularSeries.length);

    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (popularCarouselIndex + offset) % topTenPopularSeries.length;
      return {
        ...topTenPopularSeries[index],
        rank: index + 1,
      };
    });
  }, [popularCarouselIndex, topTenPopularSeries]);
  const filteredAllSeries = allSeries.filter((series) =>
    series.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
  }, [watchlist, watchlistKey]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/tv-series/genres?language=id-ID`);

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
    const loadSeries = async () => {
      try {
        setLoading(true);
        const [trendingResponse, popularResponse, latestResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/tv-series/trending?time_window=week&language=id-ID`),
            fetch(`${apiUrl}/api/tv-series/popular?language=id-ID&page=1`),
            fetch(
              `${apiUrl}/api/tv-series/discover?sort_by=first_air_date.desc&language=id-ID&page=1`,
            ),
          ]);

        const trendingData = trendingResponse.ok
          ? await trendingResponse.json()
          : { results: [] };
        const popularData = popularResponse.ok
          ? await popularResponse.json()
          : { results: [] };
        const latestData = latestResponse.ok
          ? await latestResponse.json()
          : { results: [] };
        const mappedTrending = uniqueById(
          (trendingData.results || []).map(mapTmdbSeries),
        );
        const mappedPopular = uniqueById(
          (popularData.results || []).map(mapTmdbSeries),
        );
        const mappedLatest = uniqueById(
          (latestData.results || []).map(mapTmdbSeries),
        );

        if (mappedTrending.length > 0) {
          setTrendingSeries(mappedTrending.slice(0, 4));
        }

        if (mappedPopular.length > 0) {
          setPopularSeries(mappedPopular.slice(0, 10));
        }

        if (mappedLatest.length > 0) {
          setAllSeries(mappedLatest.slice(0, 10));
        }
      } catch {
        setTrendingSeries(fallbackSeries.slice(0, 4));
        setPopularSeries(fallbackSeries);
        setAllSeries(fallbackSeries);
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, []);

  useEffect(() => {
    if (heroSeries.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroSeries.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [heroSeries.length]);

  useEffect(() => {
    if (topTenPopularSeries.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setPopularCarouselIndex((currentIndex) =>
        (currentIndex + 1) % topTenPopularSeries.length,
      );
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, [topTenPopularSeries.length]);

  useEffect(() => {
    const seriesId = activeHeroSeries?.id;

    if (!Number.isInteger(Number(seriesId)) || heroProvidersBySeriesId[seriesId]) {
      return undefined;
    }

    let shouldIgnore = false;

    const loadHeroProvider = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/tv-series/${seriesId}/watch-providers`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil provider TV series");
        }

        const data = await response.json();
        const providerLogos = getProviderLogos(data);

        if (!shouldIgnore) {
          setHeroProvidersBySeriesId((currentProviders) => ({
            ...currentProviders,
            [seriesId]: providerLogos,
          }));
        }
      } catch {
        if (!shouldIgnore) {
          setHeroProvidersBySeriesId((currentProviders) => ({
            ...currentProviders,
            [seriesId]: [],
          }));
        }
      }
    };

    loadHeroProvider();

    return () => {
      shouldIgnore = true;
    };
  }, [activeHeroSeries?.id, heroProvidersBySeriesId]);

  const openSeries = (seriesId) => {
    if (Number.isInteger(Number(seriesId))) {
      navigate(`/tv-series/${seriesId}`);
    }
  };

  const toggleWatchlist = (series) => {
    setWatchlist((currentWatchlist) => {
      const seriesId = String(series.id);

      if (currentWatchlist.some((savedSeries) => String(savedSeries.id) === seriesId)) {
        return currentWatchlist.filter(
          (savedSeries) => String(savedSeries.id) !== seriesId,
        );
      }

      return [series, ...currentWatchlist].slice(0, 20);
    });
  };

  const moveHero = (direction) => {
    setActiveHeroIndex((currentIndex) => {
      const totalSeries = heroSeries.length || 1;
      return (currentIndex + direction + totalSeries) % totalSeries;
    });
  };

  const handleShareHero = async () => {
    const url = `${window.location.origin}/tv-series/${activeHeroSeries.id}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Salin link series:", url);
    }
  };

  const handleWatchTrailer = async () => {
    const seriesId = activeHeroSeries.id;

    if (!Number.isInteger(Number(seriesId))) {
      return;
    }

    if (heroTrailerUrls[seriesId]) {
      window.open(heroTrailerUrls[seriesId], "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const fetchVideos = async (language) => {
        const response = await fetch(
          `${apiUrl}/api/tv-series/${seriesId}/videos?language=${language}`,
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
        window.alert("Trailer belum tersedia untuk series ini.");
        return;
      }

      setHeroTrailerUrls((currentUrls) => ({
        ...currentUrls,
        [seriesId]: trailerUrl,
      }));
      window.open(trailerUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Gagal membuka trailer series.");
    }
  };

  return (
    <main className="tv-series-page">
      <SiteNavbar mode="fixed" activeKey="tv" />

      <section
        className="tv-series-hero"
        style={{ "--tv-series-hero-backdrop": `url(${activeHeroSeries.backdrop})` }}
      >
        <button
          className="tv-series-hero-arrow tv-series-hero-arrow-left"
          type="button"
          onClick={() => moveHero(-1)}
          aria-label="Series sebelumnya"
        >
          <FaChevronLeft />
        </button>

        <div className="tv-series-hero-copy">
          <div className="tv-series-hero-eyebrow">
            <span className="tv-series-available-label">AVAILABLE ON</span>
            {activeHeroProviders.length > 0 ? (
              <div
                className="tv-series-provider-logos"
                aria-label="Platform streaming"
              >
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
            <span className="tv-series-hero-divider" />
            <span>{activeHeroSeries.releaseLabel}</span>
          </div>

          <h1>{activeHeroSeries.title}</h1>

          <div className="tv-series-hero-meta">
            <span className="tv-series-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar key={star} />
              ))}
            </span>
            <span>{activeHeroSeries.rating}</span>
            <span>Series</span>
            <span>Trending</span>
          </div>

          <p>{activeHeroSeries.overview}</p>

          <div className="tv-series-hero-buttons">
            <button type="button" onClick={handleWatchTrailer}>
              <FaPlay />
              Tonton Trailer
            </button>
            <button type="button" onClick={() => toggleWatchlist(activeHeroSeries)}>
              {savedSeriesIds.has(String(activeHeroSeries.id)) ? (
                <FaBookmark />
              ) : (
                <FaRegBookmark />
              )}
              Simpan ke Watchlist
            </button>
            <button type="button" onClick={handleShareHero} aria-label="Bagikan series">
              <FaShareAlt />
            </button>
          </div>
        </div>

        <button
          className="tv-series-hero-arrow tv-series-hero-arrow-right"
          type="button"
          onClick={() => moveHero(1)}
          aria-label="Series berikutnya"
        >
          <FaChevronRight />
        </button>

        <div className="tv-series-hero-dots" aria-label="Pilih series hero">
          {heroSeries.map((series, index) => (
            <button
              className={activeHeroIndex === index ? "is-active" : ""}
              type="button"
              key={series.id}
              onClick={() => setActiveHeroIndex(index)}
              aria-label={`Tampilkan ${series.title}`}
            />
          ))}
        </div>
      </section>

      <section className="tv-series-section tv-series-popular-section">
        <div className="tv-series-section-header">
          <h2>
            Series <strong>Populer</strong>
          </h2>
          <p>Top 10 bergerak otomatis</p>
        </div>

        <div className="tv-series-popular-window" aria-live="polite">
          {visiblePopularSeries.map((series) => (
            <div className="tv-series-popular-item" key={`${series.id}-${series.rank}`}>
              <span className="tv-series-rank">{series.rank}</span>
              <SeriesCard
                series={series}
                isSaved={savedSeriesIds.has(String(series.id))}
                onOpen={openSeries}
                onToggleWatchlist={toggleWatchlist}
                genreLookup={genreLookup}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="tv-series-section">
        <div className="tv-series-section-header">
          <h2>Tonton Watchlist Series Kamu</h2>
          {watchlist.length > 0 && <button type="button">Lihat Semua</button>}
        </div>

        {watchlist.length > 0 ? (
          <div className="tv-series-card-row">
            {watchlist.slice(0, 5).map((series) => (
              <SeriesCard
                key={series.id}
                series={series}
                isSaved={savedSeriesIds.has(String(series.id))}
                onOpen={openSeries}
                onToggleWatchlist={toggleWatchlist}
                genreLookup={genreLookup}
                removeMode
              />
            ))}
          </div>
        ) : (
          <div className="tv-series-empty-watchlist">
            <h3>Ayo cari series dan simpan ke watchlist</h3>
            <p>Series yang kamu simpan akan muncul di section ini.</p>
            <a href="#all-series">Cari Series</a>
          </div>
        )}
      </section>

      <section className="tv-series-section tv-series-all-section" id="all-series">
        <div className="tv-series-section-header tv-series-all-header">
          <h2>Semua Series</h2>
          <div className="tv-series-all-tools">
            <label>
              <FaSearch />
              <input
                type="search"
                placeholder="Cari Series..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <button type="button">
              <FaFilter />
              Filter
            </button>
          </div>
        </div>

        {loading && <p className="tv-series-status">Memuat series...</p>}
        {!loading && filteredAllSeries.length === 0 && (
          <p className="tv-series-status">Series tidak ditemukan.</p>
        )}

        <div className="tv-series-grid">
          {filteredAllSeries.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              isSaved={savedSeriesIds.has(String(series.id))}
              onOpen={openSeries}
              onToggleWatchlist={toggleWatchlist}
              genreLookup={genreLookup}
            />
          ))}
        </div>
      </section>

      <footer className="tv-series-footer">
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/movies">Movie</Link>
          <Link to="/tv-series">TV Series</Link>
          <Link to="/movies">Genre</Link>
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

export default TVSeriesPage;
