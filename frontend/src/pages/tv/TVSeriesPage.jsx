import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaFacebookF,
  FaFilter,
  FaRegBookmark,
  FaSearch,
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
  mapSeriesToWatchlistPayload,
} from "../../utils/watchlist";
import "./TVSeriesPage.css";

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

const seriesFilterGenreOptions = [
  { value: "all", label: "Semua" },
  { value: "18", label: "Drama" },
  { value: "9648", label: "Thriller" },
  { value: "16", label: "Animasi" },
  { value: "35", label: "Komedi" },
  { value: "10759", label: "Adventure" },
  { value: "10765", label: "Fantasy" },
  { value: "80", label: "Kriminal" },
  { value: "10751", label: "Keluarga" },
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

const seriesSortOptions = [
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

const sortSeriesList = (seriesList, sortKey) => {
  const sortedSeries = [...seriesList];

  if (sortKey === "az") {
    return sortedSeries.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortKey === "za") {
    return sortedSeries.sort((a, b) => b.title.localeCompare(a.title));
  }

  if (sortKey === "rating") {
    return sortedSeries.sort(
      (a, b) => getRatingSortScore(b.rating) - getRatingSortScore(a.rating),
    );
  }

  return sortedSeries;
};

const applySeriesFilters = (seriesList, filters, providersBySeriesId) => {
  const filteredSeries = seriesList.filter((series) => {
    const seriesId = String(series.id);
    const matchesGenre =
      filters.genre === "all" ||
      (series.genre_ids || []).map((genreId) => String(genreId)).includes(filters.genre);
    const hasLoadedProvider = Object.prototype.hasOwnProperty.call(
      providersBySeriesId,
      seriesId,
    );
    const matchesPlatform =
      filters.platform === "all" ||
      !hasLoadedProvider ||
      matchesPlatformFilter(providersBySeriesId[seriesId], filters.platform);

    return matchesGenre && matchesPlatform;
  });

  return sortSeriesList(filteredSeries, filters.sort);
};

const mapTmdbSeries = (series) => ({
  id: series.id,
  title: series.title || series.name || series.original_name || "Untitled",
  year: getSeriesYear(series.first_air_date),
  rating: getSeriesRating(series.vote_average),
  poster: series.poster_url,
  backdrop: series.backdrop_url || series.poster_url,
  overview: getShortOverview(series.overview),
  first_air_date: series.first_air_date,
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
  const token = localStorage.getItem("token");
  const [watchlist, setWatchlist] = useState([]);
  const [pendingWatchlistSeries, setPendingWatchlistSeries] = useState(null);
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [watchlistError, setWatchlistError] = useState("");
  const [trendingSeries, setTrendingSeries] = useState(fallbackSeries.slice(0, 4));
  const [popularSeries, setPopularSeries] = useState(fallbackSeries);
  const [allSeries, setAllSeries] = useState(fallbackSeries);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [popularCarouselIndex, setPopularCarouselIndex] = useState(0);
  const [providersBySeriesId, setProvidersBySeriesId] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [genreLookup, setGenreLookup] = useState(defaultGenreLookup);
  const [loading, setLoading] = useState(true);

  const savedSeriesIds = useMemo(
    () => new Set(watchlist.map((series) => String(series.id))),
    [watchlist],
  );

  const heroSeries = trendingSeries.slice(0, 4);
  const activeHeroSeries =
    heroSeries[activeHeroIndex] || heroSeries[0] || fallbackSeries[0];
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
  const searchedAllSeries = allSeries.filter((series) =>
    series.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );
  const filteredAllSeries = applySeriesFilters(
    searchedAllSeries,
    filterValues,
    providersBySeriesId,
  );

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!token) {
        setWatchlist([]);
        return;
      }

      try {
        const data = await fetchWatchlist({ token, mediaType: "tv" });
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
        const response = await fetch(buildApiUrl("/api/tv-series/genres?language=id-ID"));

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
            fetch(buildApiUrl("/api/tv-series/trending?time_window=week&language=id-ID")),
            fetch(buildApiUrl("/api/tv-series/popular?language=id-ID&page=1")),
            fetch(
              buildApiUrl("/api/tv-series/discover?sort_by=first_air_date.desc&language=id-ID&page=1"),
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
    const missingSeriesIds = allSeries
      .map((series) => String(series.id))
      .filter(
        (seriesId) =>
          Number.isInteger(Number(seriesId)) &&
          !Object.prototype.hasOwnProperty.call(providersBySeriesId, seriesId),
      );

    if (missingSeriesIds.length === 0) {
      return undefined;
    }

    let shouldIgnore = false;

    const loadSeriesProviders = async () => {
      const providerEntries = await Promise.all(
        missingSeriesIds.map(async (seriesId) => {
          try {
            const response = await fetch(
              buildApiUrl(`/api/tv-series/${seriesId}/watch-providers`),
            );

            if (!response.ok) {
              throw new Error("Gagal mengambil provider series");
            }

            const data = await response.json();
            return [seriesId, data];
          } catch {
            return [seriesId, { all: [] }];
          }
        }),
      );

      if (!shouldIgnore) {
        setProvidersBySeriesId((currentProviders) => ({
          ...currentProviders,
          ...Object.fromEntries(providerEntries),
        }));
      }
    };

    loadSeriesProviders();

    return () => {
      shouldIgnore = true;
    };
  }, [allSeries, providersBySeriesId]);

  const openSeries = (seriesId) => {
    if (Number.isInteger(Number(seriesId))) {
      navigate(`/tv-series/${seriesId}`);
    }
  };

  const saveSeriesToWatchlist = async (series) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const savedItem = await addWatchlistItem({
      token,
      payload: mapSeriesToWatchlistPayload(series),
    });

    setWatchlist((currentWatchlist) => {
      const seriesId = String(savedItem.id);
      const withoutDuplicate = currentWatchlist.filter(
        (savedSeries) => String(savedSeries.id) !== seriesId,
      );

      return [savedItem, ...withoutDuplicate];
    });
  };

  const toggleWatchlist = async (series) => {
    const seriesId = String(series.id);

    if (savedSeriesIds.has(seriesId)) {
      const savedItem = watchlist.find((savedSeries) => String(savedSeries.id) === seriesId);
      if (savedItem?.id_watchlist && token) {
        await deleteWatchlistItem({ token, idWatchlist: savedItem.id_watchlist });
      }

      setWatchlist((currentWatchlist) =>
        currentWatchlist.filter((savedSeries) => String(savedSeries.id) !== seriesId),
      );
      return;
    }

    setPendingWatchlistSeries(series);
  };

  const confirmSaveToWatchlist = async () => {
    if (!pendingWatchlistSeries || watchlistSaving) {
      return;
    }

    try {
      setWatchlistSaving(true);
      setWatchlistError("");
      await saveSeriesToWatchlist(pendingWatchlistSeries);
      setPendingWatchlistSeries(null);
    } catch (error) {
      setWatchlistError(error.message || "Gagal menyimpan watchlist");
    } finally {
      setWatchlistSaving(false);
    }
  };

  return (
    <main className="tv-series-page">
      <SiteNavbar mode="fixed" activeKey="tv" />

      <section
        className="tv-series-showcase"
        style={{ "--tv-series-showcase-backdrop": `url(${activeHeroSeries.backdrop})` }}
      >
        <div className="tv-series-showcase-copy">
          <div className="tv-series-showcase-eyebrow">
            <span />
            TV SERIES
          </div>
          <h1>
            Jelajahi <strong>Series</strong> Terbaik
          </h1>
          <p>Dari drama Korea hingga thriller Amerika - semua ada di FLIX</p>
        </div>
      </section>

      <section
        className="tv-series-section tv-series-popular-section"
        id="series-popular"
      >
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
          {watchlist.length > 0 && (
            <button type="button" onClick={() => navigate("/watchlist")}>
              Lihat Semua
            </button>
          )}
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
            <button type="button" onClick={() => setIsFilterOpen(true)}>
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
        title="Filter Series"
        values={filterValues}
        genreOptions={seriesFilterGenreOptions}
        platformOptions={platformFilterOptions}
        sortOptions={seriesSortOptions}
        onChange={setFilterValues}
        onClose={() => setIsFilterOpen(false)}
      />

      <WatchlistConfirmModal
        open={Boolean(pendingWatchlistSeries)}
        item={pendingWatchlistSeries}
        mediaLabel="Series"
        onCancel={() => {
          setPendingWatchlistSeries(null);
          setWatchlistError("");
        }}
        onConfirm={confirmSaveToWatchlist}
        loading={watchlistSaving}
        errorMessage={watchlistError}
      />
    </main>
  );
}

export default TVSeriesPage;
