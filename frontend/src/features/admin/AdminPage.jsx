import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiEye,
  FiFilm,
  FiFilter,
  FiGrid,
  FiHeart,
  FiKey,
  FiLogOut,
  FiMapPin,
  FiMessageSquare,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShare2,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import flixLogo from "@/assets/flix-logo.png";
import flixAdminLogo from "@/assets/flixadmin-logo.png";
import communityIcon from "@/assets/icon/community.png";
import emptyWalletIcon from "@/assets/icon/empty-wallet.png";
import reviewIcon from "@/assets/icon/review-icon.png";
import { resolveMediaUrl } from "@/utils/media";
import "./AdminPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const currentAdminYear = new Date().getFullYear();
const chartActivityOptions = [
  { id: "login", label: "Login" },
  { id: "review", label: "Review" },
  { id: "community", label: "Community" },
  { id: "report", label: "Report" }
];
const chartYearOptions = Array.from({ length: 6 }, (_, index) => currentAdminYear - index);
const tableLimitOptions = [5, 10, 20];

const fallbackDashboard = {
  stats: [
    { value: "0", label: "Film dan Series Direview" },
    { value: "0", label: "Total User Aktif" },
    { value: "0", label: "Community Post" },
    { value: "0", label: "Laporan Masuk" }
  ],
  chart: [
    { month: "Jan", value: 0 },
    { month: "Feb", value: 0 },
    { month: "Mar", value: 0 },
    { month: "Apr", value: 0 },
    { month: "Mei", value: 0 },
    { month: "Jun", value: 0 },
    { month: "Jul", value: 0 },
    { month: "Agu", value: 0 },
    { month: "Sep", value: 0 },
    { month: "Okt", value: 0 },
    { month: "Nov", value: 0 },
    { month: "Des", value: 0 }
  ],
  activities: [],
  watchlistMovies: []
};

const fallbackUsersSummary = {
  total: 0,
  admin: 0,
  moderator: 0,
  registeredUser: 0
};

const dummyCommunityReportedPosts = [
  {
    id: "community-report-1",
    author: "Dina Fardina",
    time: "12 minutes ago",
    content:
      "Buat yang belum nonton, ini bukan film aksi biasa. Ini film tentang dilema moral seorang ilmuwan yang menciptakan sesuatu yang menghancurkan dunia. Cillian Murphy benar-benar luar biasa.",
    status: "Dilaporkan",
    reportReason: "Alasan laporan: konten mengandung spoiler besar",
    reportedAt: "Dilaporkan oleh 2 user - 12:30 WIB",
    metrics: { views: 320, replies: 120, shares: 148 }
  },
  {
    id: "community-report-2",
    author: "Dina Fardina",
    time: "12 minutes ago",
    content:
      "Buat yang belum nonton, ini bukan film aksi biasa. Ini film tentang dilema moral seorang ilmuwan yang menciptakan sesuatu yang menghancurkan dunia. Cillian Murphy benar-benar luar biasa.",
    status: "Dilaporkan",
    reportReason: "Alasan laporan: spam/konten promosi",
    reportedAt: "Dilaporkan oleh 4 user - 13:05 WIB",
    metrics: { views: 320, replies: 120, shares: 148 }
  },
  {
    id: "community-report-3",
    author: "Dina Fardina",
    time: "12 minutes ago",
    content:
      "Buat yang belum nonton, ini bukan film aksi biasa. Ini film tentang dilema moral seorang ilmuwan yang menciptakan sesuatu yang menghancurkan dunia. Cillian Murphy benar-benar luar biasa.",
    status: "Dilaporkan",
    reportReason: "Alasan laporan: bahasa kasar",
    reportedAt: "Dilaporkan oleh 1 user - 14:12 WIB",
    metrics: { views: 320, replies: 120, shares: 148 }
  }
];

const dummyCommunityBlockedPosts = [
  {
    id: "community-blocked-1",
    author: "Dina Fardina",
    time: "12 minutes ago",
    content: "Postingan ini disembunyikan karena melanggar aturan komunitas.",
    status: "Terblokir",
    reportReason: "Alasan diblokir: spam/konten promosi",
    reportedAt: "Diblokir oleh admin - 20:09 WIB",
    metrics: { views: 0, replies: 0, shares: 0 }
  }
];

const fallbackCommunity = {
  summary: {
    totalPost: 0,
    totalReply: 0,
    reported: dummyCommunityReportedPosts.length,
    blocked: dummyCommunityBlockedPosts.length
  },
  all: [],
  reported: dummyCommunityReportedPosts,
  blocked: dummyCommunityBlockedPosts
};

const communityTabs = [
  { id: "all", label: "Semua Post", countKey: "totalPost" },
  { id: "reported", label: "Dilaporkan", countKey: "reported" },
  { id: "blocked", label: "Terblokir", countKey: "blocked" }
];

const dummyReportedReviews = [
  {
    id: "dummy-report-1",
    user: { name: "Alfha Risqi W." },
    title: "Oppenheimer",
    content: "Film ini sampah...",
    reason: "Bahasa Kasar",
    status: "Disetujui",
    date: "12 Apr 2026"
  },
  {
    id: "dummy-report-2",
    user: { name: "Alfha Risqi W." },
    title: "Oppenheimer",
    content: "Film ini sampah...",
    reason: "Bahasa Kasar",
    status: "Pending",
    date: "12 Apr 2026"
  },
  {
    id: "dummy-report-3",
    user: { name: "Alfha Risqi W." },
    title: "Oppenheimer",
    content: "Film ini sampah...",
    reason: "Bahasa Kasar",
    status: "Disetujui",
    date: "12 Apr 2026"
  },
  {
    id: "dummy-report-4",
    user: { name: "Alfha Risqi W." },
    title: "Oppenheimer",
    content: "Film ini sampah...",
    reason: "Bahasa Kasar",
    status: "Ditolak",
    date: "12 Apr 2026"
  },
  {
    id: "dummy-report-5",
    user: { name: "Alfha Risqi W." },
    title: "Oppenheimer",
    content: "Film ini sampah...",
    reason: "Bahasa Kasar",
    status: "Ditolak",
    date: "12 Apr 2026"
  }
];

const fallbackReviews = {
  summary: {
    incoming: 0,
    reported: dummyReportedReviews.length,
    blocked: 0
  },
  incoming: [],
  reported: dummyReportedReviews,
  blocked: []
};

const reviewTabs = [
  { id: "incoming", label: "Review Masuk", countKey: "incoming" },
  { id: "reported", label: "Report Review", countKey: "reported" },
  { id: "blocked", label: "Review Terblokir", countKey: "blocked" }
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "movies", label: "Kelola Film", icon: FiFilm },
  { id: "users", label: "Kelola User", icon: FiUsers },
  { id: "reviews", label: "Review", image: reviewIcon },
  { id: "community", label: "Community", image: communityIcon },
  { id: "transactions", label: "Transaksi", image: emptyWalletIcon },
  { id: "settings", label: "Pengaturan", icon: FiSettings }
];

const activityIcons = {
  user: FiUserPlus,
  review: FiMessageSquare,
  film: FiFilm,
  check: FiCheck,
  community: FiUsers,
  report: FiBell
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

const getAvatarInitial = (name) =>
  String(name || "U").trim().charAt(0).toUpperCase() || "U";

function AdminAvatar({ imageUrl, name }) {
  const resolvedImageUrl = useMemo(() => resolveMediaUrl(imageUrl), [imageUrl]);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedImageUrl]);

  if (resolvedImageUrl && !hasImageError) {
    return (
      <img
        src={resolvedImageUrl}
        alt={name || "User FLIX"}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <span>{getAvatarInitial(name)}</span>;
}

const decodeHtmlEntities = (value = "") =>
  String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

const stripHtml = (value = "") =>
  decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatPostPreview = (value = "", maxLength = 170) => {
  const text = stripHtml(value);

  if (!text) {
    return "Post belum memiliki isi.";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
};

const readStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const getUserStorageId = (user) => user?.id_user || user?.id || "guest";
const getMovieWatchlistKey = (user) => `flix_movie_watchlist_${getUserStorageId(user)}`;
const getSeriesWatchlistKey = (user) => `flix_tv_watchlist_${getUserStorageId(user)}`;

const normalizeAdminWatchlistItem = (item, mediaType) => ({
  ...item,
  mediaType: item.mediaType || item.media_type || mediaType,
  title: item.title || item.name || item.original_name || "Untitled",
  year: item.year || item.releaseLabel?.slice?.(0, 4) || item.release_date?.slice?.(0, 4) || "-",
  poster: item.poster || item.poster_url || null,
  savedAt: item.savedAt || (mediaType === "tv" ? "TV Series" : "Film"),
});

const getStoredUserWatchlist = (user) => {
  if (!user?.id && !user?.id_user) {
    return [];
  }

  return [
    ...readStorageArray(getMovieWatchlistKey(user)).map((item) => normalizeAdminWatchlistItem(item, "movie")),
    ...readStorageArray(getSeriesWatchlistKey(user)).map((item) => normalizeAdminWatchlistItem(item, "tv")),
  ];
};

const mergeWatchlistItems = (backendItems = [], localItems = []) => {
  const seenItems = new Set();

  return [...backendItems, ...localItems].filter((item) => {
    const mediaType = item.mediaType || item.media_type || "movie";
    const key = `${mediaType}:${item.id}`;

    if (seenItems.has(key)) {
      return false;
    }

    seenItems.add(key);
    return true;
  });
};

function normalizeDashboard(data) {
  if (!data || typeof data !== "object") {
    return fallbackDashboard;
  }

  return {
    stats: Array.isArray(data.stats) ? data.stats : fallbackDashboard.stats,
    chart: Array.isArray(data.chart) ? data.chart : fallbackDashboard.chart,
    activities: Array.isArray(data.activities) ? data.activities : fallbackDashboard.activities,
    watchlistMovies: Array.isArray(data.watchlistMovies)
      ? data.watchlistMovies
      : fallbackDashboard.watchlistMovies
  };
}

const formatChartNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(Number(value || 0));

const defaultAddMovieForm = {
  title: "",
  year: "",
  duration: "",
  director: "",
  synopsis: "",
  cast: "",
  posterUrl: "",
  posterDataUrl: "",
  trailerUrl: "",
  rating: "",
  country: "",
  genres: ["Drama"],
  platforms: ["Netflix"],
  moods: ["Santai"]
};

const genreOptions = [
  "Drama",
  "Thriller",
  "Animasi",
  "Komedi",
  "Adventure",
  "Fantasy",
  "Horror"
];

const platformOptions = [
  "Netflix",
  "Disney+",
  "Prime Video",
  "HBO Max",
  "Apple TV",
  "Vidio",
  "Viu"
];

const moodOptions = [
  "Santai",
  "Seru",
  "Sedih",
  "Romantis",
  "Pikiran Tertantang",
  "Menegangkan"
];

const normalizeMovieOptionArray = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value.length ? value : fallback;
  }

  if (typeof value === "string") {
    const values = value.split(",").map((item) => item.trim()).filter(Boolean);
    return values.length ? values : fallback;
  }

  return fallback;
};

const mapMovieToAdminForm = (movie) => ({
  title: movie?.title || "",
  year: movie?.year && movie.year !== "-" ? String(movie.year) : "",
  duration: movie?.duration || "",
  director: movie?.director || "",
  synopsis: movie?.synopsis || "",
  cast: movie?.cast || "",
  posterUrl: movie?.poster || "",
  posterDataUrl: "",
  trailerUrl: movie?.trailerUrl || "",
  rating: movie?.rating && movie.rating !== "-" ? String(movie.rating) : "",
  country: movie?.country || "",
  genres: normalizeMovieOptionArray(movie?.genres || movie?.genre, ["Drama"]),
  platforms: normalizeMovieOptionArray(movie?.platforms, ["Netflix"]),
  moods: normalizeMovieOptionArray(movie?.moods, ["Santai"])
});

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
};

function AdminPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [managedMovies, setManagedMovies] = useState([]);
  const [managedMoviesTotal, setManagedMoviesTotal] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersSummary, setAdminUsersSummary] = useState(fallbackUsersSummary);
  const [adminReviews, setAdminReviews] = useState(fallbackReviews);
  const [adminCommunity, setAdminCommunity] = useState(fallbackCommunity);
  const [activeAdminPage, setActiveAdminPage] = useState("dashboard");
  const [activeMoviePanel, setActiveMoviePanel] = useState("list");
  const [activeUserPanel, setActiveUserPanel] = useState("list");
  const [activeReviewTab, setActiveReviewTab] = useState("incoming");
  const [activeCommunityTab, setActiveCommunityTab] = useState("all");
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  const [addMovieForm, setAddMovieForm] = useState(defaultAddMovieForm);
  const [addMovieFeedback, setAddMovieFeedback] = useState("");
  const [isSavingMovie, setIsSavingMovie] = useState(false);
  const [selectedEditingMovie, setSelectedEditingMovie] = useState(null);
  const [nightMode, setNightMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableLimit, setTableLimit] = useState(10);
  const [filmPage, setFilmPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [communityPage, setCommunityPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserStatusLoading, setIsUserStatusLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [moviesError, setMoviesError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [communityError, setCommunityError] = useState("");
  const [userDetailError, setUserDetailError] = useState("");
  const [userStatusFeedback, setUserStatusFeedback] = useState("");
  const [selectedChartActivity, setSelectedChartActivity] = useState("login");
  const [selectedChartYear, setSelectedChartYear] = useState(currentAdminYear);
  const [openChartFilter, setOpenChartFilter] = useState(null);
  const [isTableLimitOpen, setIsTableLimitOpen] = useState(false);
  const didSkipInitialChartFetch = useRef(false);

  const user = useMemo(getStoredUser, []);
  const adminName = user?.username || user?.name || "Marsyanda F";
  const adminProfileImageUrl = user?.profile_image_url || user?.profileImageUrl || user?.avatarUrl || "";
  const selectedChartActivityLabel =
    chartActivityOptions.find((option) => option.id === selectedChartActivity)?.label || "Login";
  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      activity: selectedChartActivity,
      year: String(selectedChartYear)
    });

    return `${API_URL}/api/admin/dashboard?${params.toString()}`;
  }, [selectedChartActivity, selectedChartYear]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const [dashboardResponse, moviesResponse, usersResponse, reviewsResponse, communityResponse] = await Promise.all([
          fetch(dashboardUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/movies`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/users`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/reviews`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/community`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        if (!isMounted) {
          return;
        }

        const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : null;
        const moviesData = moviesResponse.ok ? await moviesResponse.json() : null;
        const usersData = usersResponse.ok ? await usersResponse.json() : null;
        const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : null;
        const communityData = communityResponse.ok ? await communityResponse.json() : null;

        setDashboard(normalizeDashboard(dashboardData?.dashboard || dashboardData));
        setDashboardError(dashboardResponse.ok ? "" : "Dashboard belum bisa mengambil data backend.");

        setManagedMovies(Array.isArray(moviesData?.movies) ? moviesData.movies : []);
        setManagedMoviesTotal(Number(moviesData?.total || 0));
        setMoviesError(moviesResponse.ok ? "" : "Daftar film admin belum bisa mengambil data backend.");

        setAdminUsers(Array.isArray(usersData?.users) ? usersData.users : []);
        setAdminUsersSummary(usersData?.summary || fallbackUsersSummary);
        setUsersError(usersResponse.ok ? "" : "Daftar user admin belum bisa mengambil data backend.");

        const incomingReviews = Array.isArray(reviewsData?.reviews?.incoming)
          ? reviewsData.reviews.incoming
          : [];
        const reportedReviews = Array.isArray(reviewsData?.reviews?.reported)
          ? reviewsData.reviews.reported
          : dummyReportedReviews;
        const blockedReviews = Array.isArray(reviewsData?.reviews?.blocked)
          ? reviewsData.reviews.blocked
          : [];

        setAdminReviews({
          summary: {
            incoming: Number(reviewsData?.summary?.incoming || incomingReviews.length),
            reported: Number(reviewsData?.summary?.reported || reportedReviews.length),
            blocked: Number(reviewsData?.summary?.blocked || blockedReviews.length)
          },
          incoming: incomingReviews,
          reported: reportedReviews,
          blocked: blockedReviews
        });
        setReviewsError(reviewsResponse.ok ? "" : "Moderasi review belum bisa mengambil data backend.");

        const communityAllPosts = Array.isArray(communityData?.posts?.all)
          ? communityData.posts.all
          : [];
        const communityReportedPosts = Array.isArray(communityData?.posts?.reported)
          ? communityData.posts.reported
          : dummyCommunityReportedPosts;
        const communityBlockedPosts = Array.isArray(communityData?.posts?.blocked)
          ? communityData.posts.blocked
          : dummyCommunityBlockedPosts;

        setAdminCommunity({
          summary: {
            totalPost: Number(communityData?.summary?.totalPost || communityAllPosts.length),
            totalReply: Number(communityData?.summary?.totalReply || 0),
            reported: communityReportedPosts.length,
            blocked: communityBlockedPosts.length
          },
          all: communityAllPosts,
          reported: communityReportedPosts,
          blocked: communityBlockedPosts
        });
        setCommunityError(communityResponse.ok ? "" : "Kelola community belum bisa mengambil data backend.");
      } catch {
        if (isMounted) {
          setDashboard(fallbackDashboard);
          setDashboardError("Dashboard belum bisa mengambil data backend.");
          setManagedMovies([]);
          setManagedMoviesTotal(0);
          setMoviesError("Daftar film admin belum bisa mengambil data backend.");
          setAdminUsers([]);
          setAdminUsersSummary(fallbackUsersSummary);
          setUsersError("Daftar user admin belum bisa mengambil data backend.");
          setAdminReviews(fallbackReviews);
          setReviewsError("Moderasi review belum bisa mengambil data backend.");
          setAdminCommunity(fallbackCommunity);
          setCommunityError("Kelola community belum bisa mengambil data backend.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!didSkipInitialChartFetch.current) {
      didSkipInitialChartFetch.current = true;
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    let isMounted = true;

    const loadDashboardChart = async () => {
      try {
        const response = await fetch(dashboardUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const dashboardData = response.ok ? await response.json() : null;

        if (!isMounted) {
          return;
        }

        setDashboard(normalizeDashboard(dashboardData?.dashboard || dashboardData));
        setDashboardError(response.ok ? "" : "Dashboard belum bisa mengambil data backend.");
      } catch {
        if (isMounted) {
          setDashboardError("Dashboard belum bisa mengambil data backend.");
        }
      }
    };

    loadDashboardChart();

    return () => {
      isMounted = false;
    };
  }, [dashboardUrl]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const activeNavItem = navItems.find((item) => item.id === activeAdminPage) || navItems[0];
  const adminPageTitle =
    activeAdminPage === "movies" && activeMoviePanel === "add"
      ? "Tambah Film"
      : activeAdminPage === "movies" && activeMoviePanel === "edit"
        ? "Edit Film"
        : activeAdminPage === "users" && activeUserPanel === "detail"
          ? "Detail User"
          : activeAdminPage === "reviews"
            ? "Moderasi Review"
            : activeAdminPage === "community"
              ? "Kelola Community"
          : activeNavItem.label;

  useEffect(() => {
    setFilmPage(1);
    setUserPage(1);
    setReviewPage(1);
    setCommunityPage(1);
  }, [normalizedSearch, activeAdminPage]);

  useEffect(() => {
    setReviewPage(1);
  }, [activeReviewTab]);

  useEffect(() => {
    setCommunityPage(1);
  }, [activeCommunityTab]);

  const filteredActivities = useMemo(() => {
    if (!normalizedSearch) {
      return dashboard.activities;
    }

    return dashboard.activities.filter((activity) =>
      `${activity.title} ${activity.time}`.toLowerCase().includes(normalizedSearch)
    );
  }, [dashboard.activities, normalizedSearch]);

  const filteredWatchlistMovies = useMemo(() => {
    if (!normalizedSearch) {
      return dashboard.watchlistMovies;
    }

    return dashboard.watchlistMovies.filter((movie) =>
      `${movie.title} ${movie.year} ${movie.genre} ${movie.status}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [dashboard.watchlistMovies, normalizedSearch]);

  const visibleWatchlistMovies = filteredWatchlistMovies.slice(0, tableLimit);

  const filteredManagedMovies = useMemo(() => {
    if (!normalizedSearch) {
      return managedMovies;
    }

    return managedMovies.filter((movie) =>
      `${movie.title} ${movie.year} ${movie.genre} ${movie.status} ${movie.mediaType}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [managedMovies, normalizedSearch]);

  const filmRowsPerPage = 8;
  const totalFilmPages = Math.max(1, Math.ceil(filteredManagedMovies.length / filmRowsPerPage));
  const currentFilmPage = Math.min(filmPage, totalFilmPages);
  const visibleManagedMovies = filteredManagedMovies.slice(
    (currentFilmPage - 1) * filmRowsPerPage,
    currentFilmPage * filmRowsPerPage
  );
  const filmTotalLabel = managedMoviesTotal || managedMovies.length;
  const paginationItems = getPaginationItems(currentFilmPage, totalFilmPages);
  const addMoviePosterPreview = addMovieForm.posterDataUrl || addMovieForm.posterUrl;
  const isEditingMovie = activeMoviePanel === "edit" && Boolean(selectedEditingMovie);
  const isMovieFormPanel = activeMoviePanel === "add" || isEditingMovie;

  const filteredAdminUsers = useMemo(() => {
    if (!normalizedSearch) {
      return adminUsers;
    }

    return adminUsers.filter((item) =>
      `${item.username} ${item.email} ${item.roleLabel} ${item.status}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [adminUsers, normalizedSearch]);

  const userRowsPerPage = 9;
  const totalUserPages = Math.max(1, Math.ceil(filteredAdminUsers.length / userRowsPerPage));
  const currentUserPage = Math.min(userPage, totalUserPages);
  const visibleAdminUsers = filteredAdminUsers.slice(
    (currentUserPage - 1) * userRowsPerPage,
    currentUserPage * userRowsPerPage
  );
  const userPaginationItems = getPaginationItems(currentUserPage, totalUserPages);
  const detailUser = selectedUserDetail?.user;
  const detailStats = selectedUserDetail?.stats || {};
  const detailActivities = selectedUserDetail?.activities || [];
  const detailReviews = selectedUserDetail?.reviews || [];
  const detailPosts = selectedUserDetail?.posts || [];
  const localDetailWatchlist = useMemo(
    () => getStoredUserWatchlist(detailUser),
    [detailUser?.id],
  );
  const detailWatchlist = useMemo(
    () => mergeWatchlistItems(selectedUserDetail?.watchlist || [], localDetailWatchlist),
    [selectedUserDetail?.watchlist, localDetailWatchlist],
  );
  const detailTotalWatchlist = Math.max(
    Number(detailStats.totalWatchlist || 0),
    detailWatchlist.length,
  );
  const activeReviewRows = Array.isArray(adminReviews[activeReviewTab])
    ? adminReviews[activeReviewTab]
    : [];
  const filteredAdminReviews = useMemo(() => {
    if (!normalizedSearch) {
      return activeReviewRows;
    }

    return activeReviewRows.filter((item) =>
      `${item.user?.name} ${item.title} ${item.content} ${item.reason} ${item.date} ${item.status}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [activeReviewRows, normalizedSearch]);
  const reviewRowsPerPage = 8;
  const totalReviewPages = Math.max(1, Math.ceil(filteredAdminReviews.length / reviewRowsPerPage));
  const currentReviewPage = Math.min(reviewPage, totalReviewPages);
  const visibleAdminReviews = filteredAdminReviews.slice(
    (currentReviewPage - 1) * reviewRowsPerPage,
    currentReviewPage * reviewRowsPerPage
  );
  const reviewPaginationItems = getPaginationItems(currentReviewPage, totalReviewPages);
  const activeCommunityRows = Array.isArray(adminCommunity[activeCommunityTab])
    ? adminCommunity[activeCommunityTab]
    : [];
  const filteredCommunityPosts = useMemo(() => {
    if (!normalizedSearch) {
      return activeCommunityRows;
    }

    return activeCommunityRows.filter((item) =>
      `${item.author} ${item.title} ${item.content} ${item.reportReason} ${item.status}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [activeCommunityRows, normalizedSearch]);
  const communityRowsPerPage = 6;
  const totalCommunityPages = Math.max(1, Math.ceil(filteredCommunityPosts.length / communityRowsPerPage));
  const currentCommunityPage = Math.min(communityPage, totalCommunityPages);
  const visibleCommunityPosts = filteredCommunityPosts.slice(
    (currentCommunityPage - 1) * communityRowsPerPage,
    currentCommunityPage * communityRowsPerPage
  );
  const communityPaginationItems = getPaginationItems(currentCommunityPage, totalCommunityPages);
  const communitySummaryCards = [
    { value: adminCommunity.summary?.totalPost || 0, label: "Total Post" },
    { value: adminCommunity.summary?.totalReply || 0, label: "Total Reply" },
    { value: adminCommunity.summary?.reported || 0, label: "Post dilaporkan" },
    { value: adminCommunity.summary?.blocked || 0, label: "Post Terblokir" }
  ];

  const chartItems = useMemo(() => {
    const values = dashboard.chart.map((item) => Number(item.value || 0));
    const maxValue = Math.max(...values, 1);

    return dashboard.chart.map((item) => {
      const value = Number(item.value || 0);
      const barHeight = value > 0 ? Math.max(12, Math.round((value / maxValue) * 100)) : 4;

      return {
        ...item,
        value,
        valueLabel: formatChartNumber(value),
        barHeight,
      };
    });
  }, [dashboard.chart]);

  const handleAdminNavClick = (itemId) => {
    setActiveAdminPage(itemId);

    if (itemId === "movies") {
      setActiveMoviePanel("list");
      setSelectedEditingMovie(null);
      setAddMovieForm(defaultAddMovieForm);
      setAddMovieFeedback("");
    }

    if (itemId === "users") {
      setActiveUserPanel("list");
      setSelectedUserDetail(null);
      setUserDetailError("");
      setUserStatusFeedback("");
    }

    if (itemId === "community") {
      setActiveCommunityTab("all");
    }
  };

  const loadAdminUserDetail = async (userId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUserDetailError("Sesi admin tidak tersedia.");
      return;
    }

    setActiveUserPanel("detail");
    setSelectedUserDetail(null);
    setUserDetailError("");
    setUserStatusFeedback("");
    setIsUserDetailLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = response.ok ? await response.json() : null;

      if (!response.ok || !data) {
        setUserDetailError(data?.message || "Detail user belum bisa dimuat.");
        return;
      }

      setSelectedUserDetail(data);
    } catch {
      setUserDetailError("Detail user belum bisa dimuat.");
    } finally {
      setIsUserDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setActiveUserPanel("list");
    setSelectedUserDetail(null);
    setUserDetailError("");
    setUserStatusFeedback("");
  };

  const handleToggleUserStatus = async () => {
    if (!detailUser?.id) {
      return;
    }

    const nextIsActive = detailUser.isActive === false;
    const confirmationMessage = nextIsActive
      ? `Aktifkan kembali user ${detailUser.username}?`
      : `Nonaktifkan user ${detailUser.username}? User tidak bisa login sampai diaktifkan kembali.`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setUserStatusFeedback("Sesi admin tidak tersedia.");
      return;
    }

    setIsUserStatusLoading(true);
    setUserStatusFeedback("");

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${detailUser.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: nextIsActive,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.user) {
        setUserStatusFeedback(data?.message || "Status user belum bisa diubah.");
        return;
      }

      setSelectedUserDetail((currentDetail) => {
        if (!currentDetail?.user) {
          return currentDetail;
        }

        return {
          ...currentDetail,
          user: {
            ...currentDetail.user,
            ...data.user,
          },
        };
      });

      setAdminUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === data.user.id
            ? {
                ...item,
                ...data.user,
                activities: item.activities,
              }
            : item
        )
      );

      setUserStatusFeedback(data.message || "Status user berhasil diubah.");
    } catch {
      setUserStatusFeedback("Status user belum bisa diubah.");
    } finally {
      setIsUserStatusLoading(false);
    }
  };

  const handleAddMovieFieldChange = (field, value) => {
    setAddMovieFeedback("");
    setAddMovieForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const toggleAddMovieOption = (field, value) => {
    setAddMovieFeedback("");
    setAddMovieForm((currentForm) => {
      const currentValues = currentForm[field];
      const hasValue = currentValues.includes(value);
      const nextValues = hasValue
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...currentForm,
        [field]: nextValues.length ? nextValues : [value]
      };
    });
  };

  const handlePosterFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleAddMovieFieldChange("posterDataUrl", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const openAddMovieForm = () => {
    setSelectedEditingMovie(null);
    setAddMovieForm(defaultAddMovieForm);
    setAddMovieFeedback("");
    setActiveMoviePanel("add");
  };

  const openEditMovieList = () => {
    setSelectedEditingMovie(null);
    setAddMovieForm(defaultAddMovieForm);
    setAddMovieFeedback("");
    setActiveMoviePanel("edit");
  };

  const openEditMovieForm = (movie) => {
    setSelectedEditingMovie(movie);
    setAddMovieForm(mapMovieToAdminForm(movie));
    setAddMovieFeedback("");
    setActiveMoviePanel("edit");
  };

  const handleSaveAdminMovie = async (status) => {
    if (!addMovieForm.title.trim()) {
      setAddMovieFeedback("Judul film wajib diisi sebelum disimpan.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setAddMovieFeedback("Sesi admin tidak tersedia. Silakan login ulang.");
      return;
    }

    const payload = {
      title: addMovieForm.title.trim(),
      year: addMovieForm.year.trim() || "-",
      rating: addMovieForm.rating.trim() || "-",
      status,
      posterUrl: addMoviePosterPreview || "",
      trailerUrl: addMovieForm.trailerUrl.trim(),
      duration: addMovieForm.duration.trim(),
      director: addMovieForm.director.trim(),
      synopsis: addMovieForm.synopsis.trim(),
      cast: addMovieForm.cast.trim(),
      country: addMovieForm.country.trim(),
      genres: addMovieForm.genres,
      platforms: addMovieForm.platforms,
      moods: addMovieForm.moods
    };

    setIsSavingMovie(true);
    setAddMovieFeedback("");

    try {
      const isEditRequest = Boolean(selectedEditingMovie?.id);
      const response = await fetch(
        isEditRequest ? `${API_URL}/api/admin/movies/${selectedEditingMovie.id}` : `${API_URL}/api/admin/movies`,
        {
          method: isEditRequest ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.movie) {
        setAddMovieFeedback(data?.message || "Film belum bisa disimpan.");
        return;
      }

      if (isEditRequest) {
        setManagedMovies((currentMovies) =>
          currentMovies.map((movie) => (Number(movie.id) === Number(data.movie.id) ? data.movie : movie))
        );
      } else {
        setManagedMovies((currentMovies) => [data.movie, ...currentMovies]);
        setManagedMoviesTotal((currentTotal) => Number(currentTotal || managedMovies.length) + 1);
      }

      setFilmPage(1);
      setAddMovieForm(defaultAddMovieForm);
      setSelectedEditingMovie(null);
      setAddMovieFeedback(data.message || (status === "Draft" ? "Draft film berhasil disimpan." : "Film berhasil dipublish."));
      setActiveMoviePanel("list");
      setMoviesError("");
    } catch {
      setAddMovieFeedback("Film belum bisa disimpan karena koneksi backend bermasalah.");
    } finally {
      setIsSavingMovie(false);
    }
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div className="admin-brand">
          <img src={flixAdminLogo} alt="FLIX Admin" className="admin-brand__admin-logo" />
          <Link to="/" className="admin-brand__home-link" aria-label="Kembali ke halaman awal">
            <img src={flixLogo} alt="FLIX" className="admin-brand__flix-logo" />
          </Link>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <div className="admin-nav__group" key={item.id}>
                <button
                  type="button"
                  className={`admin-nav__item${
                    activeAdminPage === item.id ? " admin-nav__item--active" : ""
                  }`}
                  onClick={() => handleAdminNavClick(item.id)}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="admin-nav__asset-icon" aria-hidden="true" />
                  ) : (
                    <Icon aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>

                {item.id === "movies" && activeAdminPage === "movies" && (
                  <div className="admin-nav__submenu" aria-label="Submenu kelola film">
                    <button
                      type="button"
                      className={activeMoviePanel === "add" ? "admin-nav__submenu-item--active" : ""}
                      onClick={openAddMovieForm}
                    >
                      <FiPlus aria-hidden="true" />
                      <span>Tambah Film</span>
                    </button>
                    <button
                      type="button"
                      className={activeMoviePanel === "edit" ? "admin-nav__submenu-item--active" : ""}
                      onClick={openEditMovieList}
                    >
                      <FiEdit3 aria-hidden="true" />
                      <span>Edit Film</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            <span>Log Out</span>
          </button>

          <label className="admin-night-mode">
            <span>Night Mode</span>
            <input
              type="checkbox"
              checked={nightMode}
              onChange={(event) => setNightMode(event.target.checked)}
            />
            <span className="admin-night-mode__switch">
              <FiMoon aria-hidden="true" />
            </span>
          </label>

          <div className="admin-profile">
            <div className="admin-profile__avatar">
              <AdminAvatar imageUrl={adminProfileImageUrl} name={adminName} />
            </div>
            <div className="admin-profile__meta">
              <strong>{adminName}</strong>
              <span>Admin FLIX</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-content-head">
            <div>
              <h1>{adminPageTitle}</h1>
            </div>

            <div className="admin-content-head__actions">
              <label className="admin-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder={
                    activeAdminPage === "movies"
                      ? "Cari film..."
                      : activeAdminPage === "users"
                        ? "Cari user..."
                        : activeAdminPage === "reviews"
                          ? "Cari review..."
                          : activeAdminPage === "community"
                            ? "Cari post..."
                        : "Cari..."
                  }
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <button type="button" className="admin-icon-button" aria-label="Notifikasi admin">
                <FiBell aria-hidden="true" />
                <span className="admin-icon-button__dot" />
              </button>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeAdminPage === "movies" ? (
            <section className="admin-manage-film" aria-label="Kelola film">
              {moviesError && <p className="admin-dashboard-alert">{moviesError}</p>}

              {isMovieFormPanel && (
                <section className="admin-add-movie" aria-label={isEditingMovie ? "Edit film" : "Tambah film baru"}>
                  <div className="admin-add-movie__head">
                    <div>
                      <h2>{isEditingMovie ? "Edit Film" : "Tambah Film Baru"}</h2>
                      <p>
                        {isEditingMovie
                          ? "Ubah informasi film lalu simpan sebagai draft atau publish."
                          : "Isi semua informasi film yang ingin ditambahkan."}
                      </p>
                    </div>

                    <div className="admin-add-movie__actions">
                      <button type="button" disabled={isSavingMovie} onClick={() => handleSaveAdminMovie("Draft")}>
                        {isSavingMovie ? "Menyimpan..." : "Draf"}
                      </button>
                      <button
                        type="button"
                        className="admin-add-movie__save"
                        disabled={isSavingMovie}
                        onClick={() => handleSaveAdminMovie("Published")}
                      >
                        <FiCheck aria-hidden="true" />
                        {isSavingMovie ? "Menyimpan..." : "Simpan Film"}
                      </button>
                    </div>
                  </div>

                  {addMovieFeedback && (
                    <p className="admin-add-movie__feedback">{addMovieFeedback}</p>
                  )}

                  <div className="admin-add-movie__grid">
                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Informasi Film</h3>
                      <div className="admin-add-movie__divider" />

                      <label className="admin-add-movie__field">
                        <span>Judul Film</span>
                        <input
                          type="text"
                          placeholder="contoh: Oppenheimer"
                          value={addMovieForm.title}
                          onChange={(event) => handleAddMovieFieldChange("title", event.target.value)}
                        />
                      </label>

                      <div className="admin-add-movie__field-row">
                        <label className="admin-add-movie__field">
                          <span>Tahun Rilis</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="2024"
                            value={addMovieForm.year}
                            onChange={(event) => handleAddMovieFieldChange("year", event.target.value)}
                          />
                        </label>
                        <label className="admin-add-movie__field">
                          <span>Durasi</span>
                          <input
                            type="text"
                            placeholder="contoh: 2j 30m"
                            value={addMovieForm.duration}
                            onChange={(event) => handleAddMovieFieldChange("duration", event.target.value)}
                          />
                        </label>
                      </div>

                      <label className="admin-add-movie__field">
                        <span>Sutradara</span>
                        <input
                          type="text"
                          placeholder="contoh: Christopher Nolan"
                          value={addMovieForm.director}
                          onChange={(event) => handleAddMovieFieldChange("director", event.target.value)}
                        />
                      </label>

                      <label className="admin-add-movie__field">
                        <span>Sinopsis</span>
                        <textarea
                          maxLength={500}
                          placeholder="Tulis sinopsis film di sini..."
                          value={addMovieForm.synopsis}
                          onChange={(event) => handleAddMovieFieldChange("synopsis", event.target.value)}
                        />
                        <small>{addMovieForm.synopsis.length}/500 karakter</small>
                      </label>

                      <label className="admin-add-movie__field">
                        <span>Pemeran Utama</span>
                        <input
                          type="text"
                          placeholder="contoh: Cillian Murphy, Emily Blunt, Matt Damon"
                          value={addMovieForm.cast}
                          onChange={(event) => handleAddMovieFieldChange("cast", event.target.value)}
                        />
                        <small>Pisahkan dengan koma</small>
                      </label>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Poster Film</h3>
                      <label className="admin-add-movie__upload">
                        <input type="file" accept="image/*" onChange={handlePosterFileChange} />
                        {addMoviePosterPreview ? (
                          <img src={addMoviePosterPreview} alt="Preview poster film" />
                        ) : (
                          <span>
                            <FiUploadCloud aria-hidden="true" />
                            Klik untuk upload poster atau drag & drop di sini
                            <small>JPG, PNG, WEBP - Maks 2 MB</small>
                          </span>
                        )}
                      </label>

                      <label className="admin-add-movie__field">
                        <span>URL Poster (Opsional)</span>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={addMovieForm.posterUrl}
                          onChange={(event) => handleAddMovieFieldChange("posterUrl", event.target.value)}
                        />
                      </label>

                      <label className="admin-add-movie__field">
                        <span>URL Trailer</span>
                        <input
                          type="url"
                          placeholder="https://youtube.com/..."
                          value={addMovieForm.trailerUrl}
                          onChange={(event) => handleAddMovieFieldChange("trailerUrl", event.target.value)}
                        />
                      </label>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Genre & Platform Film</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__chip-group">
                        <span>Genre</span>
                        <div>
                          {genreOptions.map((genre) => (
                            <button
                              type="button"
                              key={genre}
                              className={addMovieForm.genres.includes(genre) ? "admin-add-movie__chip--active" : ""}
                              onClick={() => toggleAddMovieOption("genres", genre)}
                            >
                              {genre}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah genre">+</button>
                        </div>
                      </div>

                      <div className="admin-add-movie__chip-group">
                        <span>Platform Tersedia</span>
                        <div>
                          {platformOptions.map((platform) => (
                            <button
                              type="button"
                              key={platform}
                              className={
                                addMovieForm.platforms.includes(platform) ? "admin-add-movie__chip--active" : ""
                              }
                              onClick={() => toggleAddMovieOption("platforms", platform)}
                            >
                              {platform}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah platform">+</button>
                        </div>
                      </div>
                    </article>

                    <article className="admin-panel admin-add-movie__panel">
                      <h3>Tag Mood</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__chip-group">
                        <span>Pilih mood yang cocok untuk film ini</span>
                        <div>
                          {moodOptions.map((mood) => (
                            <button
                              type="button"
                              key={mood}
                              className={addMovieForm.moods.includes(mood) ? "admin-add-movie__chip--active" : ""}
                              onClick={() => toggleAddMovieOption("moods", mood)}
                            >
                              {mood}
                            </button>
                          ))}
                          <button type="button" aria-label="Tambah mood">+</button>
                        </div>
                      </div>
                    </article>

                    <article className="admin-panel admin-add-movie__panel admin-add-movie__panel--rating">
                      <h3>Rating</h3>
                      <div className="admin-add-movie__divider" />

                      <div className="admin-add-movie__field-row">
                        <label className="admin-add-movie__field">
                          <span>Rating (1-10)</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="8.5"
                            value={addMovieForm.rating}
                            onChange={(event) => handleAddMovieFieldChange("rating", event.target.value)}
                          />
                        </label>
                        <label className="admin-add-movie__field">
                          <span>Negara Asal</span>
                          <input
                            type="text"
                            placeholder="contoh: Amerika Serikat"
                            value={addMovieForm.country}
                            onChange={(event) => handleAddMovieFieldChange("country", event.target.value)}
                          />
                        </label>
                      </div>
                    </article>
                  </div>
                </section>
              )}

              {activeMoviePanel === "edit" && !selectedEditingMovie && (
                <article className="admin-panel admin-manage-film__card admin-edit-film__card">
                  <div className="admin-manage-film__header">
                    <div>
                      <h2>Edit Film</h2>
                      <p>Pilih film dari daftar, lalu lanjutkan proses edit data.</p>
                    </div>
                  </div>

                  <div className="admin-edit-film__list">
                    {visibleManagedMovies.map((movie) => (
                      <div className="admin-edit-film__item" key={`edit-${movie.mediaType}-${movie.id}`}>
                        <div className="admin-manage-table__movie">
                          <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                          <div>
                            <strong>{movie.title}</strong>
                            <span>{movie.year} - {movie.genre}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => openEditMovieForm(movie)}>
                          <FiEdit3 aria-hidden="true" />
                          Edit
                        </button>
                      </div>
                    ))}

                    {!visibleManagedMovies.length && (
                      <p className="admin-empty-state">
                        {isLoading ? "Memuat data film..." : "Belum ada film yang bisa diedit."}
                      </p>
                    )}
                  </div>
                </article>
              )}

              {activeMoviePanel === "list" && (
              <article className="admin-panel admin-manage-film__card">
                <div className="admin-manage-film__header">
                  <div>
                    <h2>Semua Film</h2>
                    <p>Total {isLoading ? "..." : formatChartNumber(filmTotalLabel)} Film manual terdaftar</p>
                  </div>

                  <div className="admin-manage-film__actions">
                    <button
                      type="button"
                      className="admin-manage-film__add"
                      onClick={openAddMovieForm}
                    >
                      <FiPlus aria-hidden="true" />
                      Tambah Film
                    </button>
                    <button type="button" className="admin-manage-film__filter">
                      <FiFilter aria-hidden="true" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="admin-manage-table" role="table" aria-label="Semua film admin">
                  <div
                    className="admin-manage-table__row admin-manage-table__row--head"
                    role="row"
                  >
                    <span role="columnheader">No</span>
                    <span role="columnheader">Film</span>
                    <span role="columnheader">Genre</span>
                    <span role="columnheader">Rating</span>
                    <span role="columnheader">Watchlist</span>
                  </div>

                  {visibleManagedMovies.map((movie, index) => (
                    <div
                      className="admin-manage-table__row"
                      role="row"
                      key={`${movie.mediaType}-${movie.id}-${movie.title}`}
                    >
                      <span className="admin-manage-table__no" role="cell">
                        {(currentFilmPage - 1) * filmRowsPerPage + index + 1}
                      </span>
                      <div className="admin-manage-table__movie" role="cell">
                        <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                        <div>
                          <strong>{movie.title}</strong>
                          <span>{movie.year}</span>
                        </div>
                      </div>
                      <span role="cell">{movie.genre}</span>
                      <span className="admin-manage-table__rating" role="cell">
                        <FaStar aria-hidden="true" />
                        {movie.rating}
                      </span>
                      <span role="cell">{movie.watchlist || movie.reviewCount || "0"}</span>
                    </div>
                  ))}

                  {!visibleManagedMovies.length && (
                    <div className="admin-manage-table__empty">
                      {isLoading ? "Memuat data film..." : "Belum ada film manual yang ditambahkan."}
                    </div>
                  )}
                </div>

                <div className="admin-manage-pagination" aria-label="Pagination film">
                  <button
                    type="button"
                    aria-label="Halaman sebelumnya"
                    disabled={currentFilmPage === 1}
                    onClick={() => setFilmPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {paginationItems.map((item, index) =>
                    typeof item === "string" ? (
                      <span key={`${item}-${index}`} className="admin-manage-pagination__ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={currentFilmPage === item ? "admin-manage-pagination__active" : ""}
                        onClick={() => setFilmPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Halaman berikutnya"
                    disabled={currentFilmPage === totalFilmPages}
                    onClick={() => setFilmPage((page) => Math.min(totalFilmPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </article>
              )}
            </section>
          ) : activeAdminPage === "reviews" ? (
            <section className="admin-review-management" aria-label="Moderasi review">
              {reviewsError && <p className="admin-dashboard-alert">{reviewsError}</p>}

              <article className="admin-panel admin-review-card">
                <div className="admin-review-card__header">
                  <div>
                    <h2>Moderasi Review</h2>
                    <p>
                      {formatChartNumber(adminReviews.summary?.incoming || 0)} review menunggu persetujuan
                    </p>
                  </div>

                  <button type="button" className="admin-manage-film__filter">
                    <FiFilter aria-hidden="true" />
                    Filter
                  </button>
                </div>

                <div className="admin-review-tabs" role="tablist" aria-label="Filter moderasi review">
                  {reviewTabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      className={activeReviewTab === tab.id ? "admin-review-tabs__item--active" : ""}
                      role="tab"
                      aria-selected={activeReviewTab === tab.id}
                      onClick={() => setActiveReviewTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <small>{formatChartNumber(adminReviews.summary?.[tab.countKey] || 0)}</small>
                    </button>
                  ))}
                </div>

                <div className="admin-review-table" role="table" aria-label="Daftar moderasi review">
                  {activeReviewTab === "reported" ? (
                    <>
                      <div
                        className="admin-review-table__row admin-review-table__row--head admin-review-table__row--report"
                        role="row"
                      >
                        <span role="columnheader">No</span>
                        <span role="columnheader">User Pelapor</span>
                        <span role="columnheader">Film</span>
                        <span role="columnheader">Review</span>
                        <span role="columnheader">Alasan Laporan</span>
                        <span role="columnheader">Status</span>
                        <span role="columnheader">Tanggal</span>
                      </div>

                      {visibleAdminReviews.map((review, index) => (
                        <div
                          className="admin-review-table__row admin-review-table__row--report"
                          role="row"
                          key={review.id}
                        >
                          <span className="admin-review-table__no" role="cell">
                            {(currentReviewPage - 1) * reviewRowsPerPage + index + 1}
                          </span>
                          <div className="admin-review-table__user" role="cell">
                            <AdminAvatar imageUrl={review.user?.profileImageUrl} name={review.user?.name} />
                            <strong>{review.user?.name || "User FLIX"}</strong>
                          </div>
                          <strong className="admin-review-table__film" role="cell">
                            {review.title}
                          </strong>
                          <div className="admin-review-table__content" role="cell">
                            <p>{review.content}</p>
                          </div>
                          <span className="admin-review-table__reason" role="cell">
                            {review.reason || "Konten bermasalah"}
                          </span>
                          <span role="cell">
                            <span
                              className={`admin-review-status admin-review-status--${String(
                                review.status || "pending"
                              ).toLowerCase()}`}
                            >
                              {review.status || "Pending"}
                            </span>
                          </span>
                          <span className="admin-review-table__date" role="cell">
                            {review.date}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="admin-review-table__row admin-review-table__row--head" role="row">
                        <span role="columnheader">No</span>
                        <span role="columnheader">User</span>
                        <span role="columnheader">Film</span>
                        <span role="columnheader">Review</span>
                        <span role="columnheader">Tanggal</span>
                      </div>

                      {visibleAdminReviews.map((review, index) => (
                        <div className="admin-review-table__row" role="row" key={review.id}>
                          <span className="admin-review-table__no" role="cell">
                            {(currentReviewPage - 1) * reviewRowsPerPage + index + 1}
                          </span>
                          <div className="admin-review-table__user" role="cell">
                            <AdminAvatar imageUrl={review.user?.profileImageUrl} name={review.user?.name} />
                            <strong>{review.user?.name || "User FLIX"}</strong>
                          </div>
                          <strong className="admin-review-table__film" role="cell">
                            {review.title}
                          </strong>
                          <div className="admin-review-table__content" role="cell">
                            <p>{review.content}</p>
                            {review.rating ? (
                              <small>
                                <FaStar aria-hidden="true" />
                                {Number(review.rating).toFixed(1)}
                              </small>
                            ) : (
                              <small>{review.status}</small>
                            )}
                          </div>
                          <span className="admin-review-table__date" role="cell">
                            {review.date}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {!visibleAdminReviews.length && (
                    <div
                      className={`admin-review-table__empty${
                        activeReviewTab === "reported" ? " admin-review-table__empty--report" : ""
                      }`}
                    >
                      {isLoading ? "Memuat data review..." : "Belum ada review pada tab ini."}
                    </div>
                  )}
                </div>

                <div className="admin-manage-pagination" aria-label="Pagination review">
                  <button
                    type="button"
                    aria-label="Halaman review sebelumnya"
                    disabled={currentReviewPage === 1}
                    onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {reviewPaginationItems.map((item, index) =>
                    typeof item === "string" ? (
                      <span key={`${item}-${index}`} className="admin-manage-pagination__ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={currentReviewPage === item ? "admin-manage-pagination__active" : ""}
                        onClick={() => setReviewPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Halaman review berikutnya"
                    disabled={currentReviewPage === totalReviewPages}
                    onClick={() => setReviewPage((page) => Math.min(totalReviewPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </article>
            </section>
          ) : activeAdminPage === "community" ? (
            <section className="admin-community-management" aria-label="Kelola post community">
              <section className="admin-community-summary" aria-label="Ringkasan community">
                {communitySummaryCards.map((stat) => (
                  <article className="admin-community-summary__card" key={stat.label}>
                    <strong>{isLoading ? "..." : formatChartNumber(stat.value)}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </section>

              {communityError && <p className="admin-dashboard-alert">{communityError}</p>}

              <article className="admin-panel admin-community-card">
                <div className="admin-community-card__header">
                  <div>
                    <h2>Kelola Post Community</h2>
                    <p>Moderasi semua postingan dari pengguna</p>
                  </div>
                </div>

                <div className="admin-community-tabs" role="tablist" aria-label="Filter post community">
                  {communityTabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      className={activeCommunityTab === tab.id ? "admin-community-tabs__item--active" : ""}
                      role="tab"
                      aria-selected={activeCommunityTab === tab.id}
                      onClick={() => setActiveCommunityTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <small>{formatChartNumber(adminCommunity.summary?.[tab.countKey] || 0)}</small>
                    </button>
                  ))}
                </div>

                <div className="admin-community-list">
                  {visibleCommunityPosts.map((post) => (
                    <article
                      className={`admin-community-post${
                        post.status === "Terblokir" ? " admin-community-post--blocked" : ""
                      }`}
                      key={post.id}
                    >
                      <div className="admin-community-post__top">
                        <div className="admin-community-post__author">
                          <AdminAvatar imageUrl={post.profileImageUrl} name={post.author} />
                          <div>
                            <strong>{post.author || "User FLIX"}</strong>
                            <small>{post.time || post.date || "-"}</small>
                          </div>
                        </div>

                        <div className="admin-community-post__actions">
                          <button type="button" aria-label="Lihat post">
                            <FiEye aria-hidden="true" />
                          </button>
                          <button type="button" aria-label="Blokir post">
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <p className="admin-community-post__content">
                        {formatPostPreview(post.content)}
                      </p>

                      {post.reportReason && (
                        <div className="admin-community-post__report">
                          <FiAlertTriangle aria-hidden="true" />
                          <div>
                            <strong>{post.reportReason}</strong>
                            <span>{post.reportedAt}</span>
                          </div>
                          {post.status !== "Terblokir" && (
                            <button type="button" aria-label="Setujui laporan">
                              <FiCheckCircle aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )}

                      <div className="admin-community-post__metrics">
                        <span>
                          <FiEye aria-hidden="true" />
                          {formatChartNumber(post.metrics?.views || 0)}
                        </span>
                        <span>
                          <FiMessageSquare aria-hidden="true" />
                          {formatChartNumber(post.metrics?.replies || 0)}
                        </span>
                        <span>
                          <FiShare2 aria-hidden="true" />
                          {formatChartNumber(post.metrics?.shares || 0)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {!visibleCommunityPosts.length && (
                    <p className="admin-empty-state">
                      {isLoading ? "Memuat post community..." : "Belum ada post pada tab ini."}
                    </p>
                  )}
                </div>

                <div className="admin-manage-pagination" aria-label="Pagination community">
                  <button
                    type="button"
                    aria-label="Halaman community sebelumnya"
                    disabled={currentCommunityPage === 1}
                    onClick={() => setCommunityPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {communityPaginationItems.map((item, index) =>
                    typeof item === "string" ? (
                      <span key={`${item}-${index}`} className="admin-manage-pagination__ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={currentCommunityPage === item ? "admin-manage-pagination__active" : ""}
                        onClick={() => setCommunityPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Halaman community berikutnya"
                    disabled={currentCommunityPage === totalCommunityPages}
                    onClick={() => setCommunityPage((page) => Math.min(totalCommunityPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </article>
            </section>
          ) : activeAdminPage === "users" ? (
            <section className="admin-user-management" aria-label="Kelola user">
              {usersError && <p className="admin-dashboard-alert">{usersError}</p>}

              {activeUserPanel === "detail" && (
                <section className="admin-user-detail" aria-label="Detail user">
                  <div className="admin-user-detail__head">
                    <div>
                      <h2>Detail User</h2>
                      <p>Informasi lengkap & aktivitas user</p>
                    </div>
                    <div className="admin-user-detail__actions">
                      <button
                        type="button"
                        className={
                          detailUser?.isActive === false
                            ? "admin-user-detail__success"
                            : "admin-user-detail__danger"
                        }
                        disabled={!detailUser || isUserStatusLoading}
                        onClick={handleToggleUserStatus}
                      >
                        {detailUser?.isActive === false ? (
                          <FiUserCheck aria-hidden="true" />
                        ) : (
                          <FiUserX aria-hidden="true" />
                        )}
                        {isUserStatusLoading
                          ? "Memproses..."
                          : detailUser?.isActive === false
                            ? "Aktifkan user"
                            : "Nonaktifkan user"}
                      </button>
                      <button type="button" onClick={closeUserDetail}>
                        <FiArrowLeft aria-hidden="true" />
                        Kembali
                      </button>
                    </div>
                  </div>

                  {userDetailError && <p className="admin-dashboard-alert">{userDetailError}</p>}
                  {userStatusFeedback && (
                    <p className="admin-dashboard-alert admin-dashboard-alert--inline">
                      {userStatusFeedback}
                    </p>
                  )}

                  {isUserDetailLoading && (
                    <article className="admin-panel admin-user-detail__loading">
                      Memuat detail user...
                    </article>
                  )}

                  {!isUserDetailLoading && detailUser && (
                    <>
                      <article className="admin-panel admin-user-detail__profile-card">
                        <div className="admin-user-detail__identity">
                          <div className="admin-user-detail__avatar">
                            <AdminAvatar imageUrl={detailUser.profileImageUrl} name={detailUser.username} />
                            <small className="admin-user-detail__premium-badge">💎 Premium</small>
                          </div>
                          <div className="admin-user-detail__meta">
                            <h3>{detailUser.username}</h3>
                            <p>{detailUser.email}</p>
                            <div className="admin-user-detail__joined-row">
                              <span>
                                <FiCalendar aria-hidden="true" />
                                Bergabung sejak {detailUser.joinedAt}
                              </span>
                            </div>
                            <div className="admin-user-detail__info-row">
                              <span>
                                <FiClock aria-hidden="true" />
                                Login terakhir: {detailUser.lastLoginAt || "29 Apr 2026 13:00"}
                              </span>
                              <span>
                                <FiMapPin aria-hidden="true" />
                                {detailUser.location || "Sragen, Jawa Tengah"}
                              </span>
                            </div>
                            <span
                              className={`admin-user-status${
                                detailUser.status === "Aktif"
                                  ? " admin-user-status--active"
                                  : detailUser.status === "Nonaktif"
                                    ? " admin-user-status--inactive"
                                    : ""
                              }`}
                            >
                              {detailUser.status}
                            </span>
                          </div>
                        </div>

                        <div className="admin-user-detail__profile-actions">
                          <button type="button">
                            <FiEdit3 aria-hidden="true" />
                            Edit User
                          </button>
                          <button type="button">
                            <FiKey aria-hidden="true" />
                            Reset Password
                          </button>
                        </div>
                      </article>

                      <section className="admin-user-detail__stats" aria-label="Statistik user">
                        <article>
                          <strong>{formatChartNumber(detailTotalWatchlist)}</strong>
                          <span>Total Watchlist</span>
                        </article>
                        <article>
                          <strong>{formatChartNumber(detailStats.reviewsCreated)}</strong>
                          <span>Review Dibuat</span>
                        </article>
                        <article>
                          <strong>{formatChartNumber(detailStats.watchedMovies)}</strong>
                          <span>Film Ditandai Ditonton</span>
                        </article>
                        <article>
                          <strong>
                            <FaStar aria-hidden="true" />
                            {Number(detailStats.averageRating || 0).toFixed(1)}
                          </strong>
                          <span>Rata-rata Rating</span>
                        </article>
                      </section>

                      <section className="admin-user-detail__grid">
                        <article className="admin-panel admin-user-detail__panel">
                          <h3>Aktivitas Terbaru</h3>
                          <div className="admin-user-detail__timeline">
                            {detailActivities.map((activity, index) => (
                              <div key={`${activity.title}-${index}`}>
                                <span />
                                <div>
                                  <strong>{activity.title}</strong>
                                  <small>{activity.time}</small>
                                </div>
                              </div>
                            ))}
                            {!detailActivities.length && (
                              <p className="admin-empty-state">Belum ada aktivitas user.</p>
                            )}
                          </div>
                        </article>

                        <article className="admin-panel admin-user-detail__panel">
                          <h3>Review Terbaru ({detailStats.reviewsCreated || 0})</h3>
                          <div className="admin-user-detail__review-list">
                            {detailReviews.map((review) => (
                              <div key={`${review.mediaType}-${review.id}`}>
                                <img src={review.poster || flixAdminLogo} alt={review.title} />
                                <div>
                                  <strong>{review.title}</strong>
                                  <span>{review.year}</span>
                                  <p className="admin-user-detail__review-content">
                                    {formatPostPreview(review.content, 110)}
                                  </p>
                                </div>
                                <span className="admin-user-detail__stars">
                                  {Array.from({ length: 5 }, (_, index) => (
                                    <FaStar
                                      key={index}
                                      aria-hidden="true"
                                      className={index < Number(review.rating || 0) ? "is-active" : ""}
                                    />
                                  ))}
                                </span>
                                <span className="admin-user-detail__approved">{review.status}</span>
                              </div>
                            ))}
                            {!detailReviews.length && (
                              <p className="admin-empty-state">Belum ada review terbaru.</p>
                            )}
                          </div>
                        </article>

                        <article className="admin-panel admin-user-detail__panel">
                          <h3>Watchlist User ({formatChartNumber(detailTotalWatchlist)} Film)</h3>
                          <div className="admin-user-detail__simple-list">
                            {detailWatchlist.map((item) => (
                              <div key={`${item.mediaType}-${item.id}`}>
                                <img src={item.poster || flixAdminLogo} alt={item.title} />
                                <div>
                                  <strong>{item.title}</strong>
                                  <span>{item.year}</span>
                                </div>
                                <small>{item.savedAt}</small>
                              </div>
                            ))}
                            {!detailWatchlist.length && (
                              <p className="admin-empty-state">
                                Watchlist user belum tersedia.
                              </p>
                            )}
                          </div>
                        </article>

                        <article className="admin-panel admin-user-detail__panel">
                          <h3>Postingan Terbaru ({detailStats.postsCreated || 0} Post)</h3>
                          <div className="admin-user-detail__post-list">
                            {detailPosts.map((post) => (
                              <div key={post.id}>
                                <strong>{post.title}</strong>
                                <p>{formatPostPreview(post.content, 130)}</p>
                                <div>
                                  <span>{post.date}</span>
                                  <span><FiEye aria-hidden="true" /> {post.viewCount}</span>
                                  <span><FiHeart aria-hidden="true" /> {post.likeCount}</span>
                                  <span><FiMessageSquare aria-hidden="true" /> {post.replyCount}</span>
                                </div>
                              </div>
                            ))}
                            {!detailPosts.length && (
                              <p className="admin-empty-state">Belum ada postingan terbaru.</p>
                            )}
                          </div>
                        </article>
                      </section>
                    </>
                  )}
                </section>
              )}

              {activeUserPanel === "list" && (
                <>

              <section className="admin-user-summary" aria-label="Ringkasan user">
                <article className="admin-user-summary__card">
                  <FiUsers aria-hidden="true" />
                  <div>
                    <strong>{isLoading ? "..." : formatChartNumber(adminUsersSummary.total)}</strong>
                    <span>Total User</span>
                  </div>
                </article>
                <article className="admin-user-summary__card">
                  <FiShield aria-hidden="true" />
                  <div>
                    <strong>{isLoading ? "..." : formatChartNumber(adminUsersSummary.admin)}</strong>
                    <span>Admin</span>
                  </div>
                </article>
                <article className="admin-user-summary__card">
                  <FiUserCheck aria-hidden="true" />
                  <div>
                    <strong>{isLoading ? "..." : formatChartNumber(adminUsersSummary.moderator)}</strong>
                    <span>Moderator</span>
                  </div>
                </article>
                <article className="admin-user-summary__card">
                  <FiUserPlus aria-hidden="true" />
                  <div>
                    <strong>{isLoading ? "..." : formatChartNumber(adminUsersSummary.registeredUser)}</strong>
                    <span>User Biasa</span>
                  </div>
                </article>
              </section>

              <article className="admin-panel admin-user-card">
                <div className="admin-user-card__header">
                  <div>
                    <h2>Semua User</h2>
                    <p>Admin dan moderator ditampilkan terlebih dahulu, lalu user biasa.</p>
                  </div>
                  <button type="button" className="admin-manage-film__filter">
                    <FiFilter aria-hidden="true" />
                    Filter
                  </button>
                </div>

                <div className="admin-user-table" role="table" aria-label="Daftar user admin">
                  <div className="admin-user-table__row admin-user-table__row--head" role="row">
                    <span role="columnheader">No</span>
                    <span role="columnheader">User</span>
                    <span role="columnheader">Role</span>
                    <span role="columnheader">Bergabung</span>
                    <span role="columnheader">Aktifitas</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">Aksi</span>
                  </div>

                  {visibleAdminUsers.map((item, index) => (
                    <div className="admin-user-table__row" role="row" key={item.id}>
                      <span className="admin-user-table__no" role="cell">
                        {(currentUserPage - 1) * userRowsPerPage + index + 1}
                      </span>
                      <div className="admin-user-table__profile" role="cell">
                        <AdminAvatar imageUrl={item.profileImageUrl} name={item.username} />
                        <div>
                          <strong>{item.username}</strong>
                          <small>{item.email}</small>
                        </div>
                      </div>
                      <span role="cell">
                        <span className={`admin-role-pill admin-role-pill--${item.role}`}>
                          {item.roleLabel}
                        </span>
                      </span>
                      <span role="cell">{item.joinedAt}</span>
                      <div className="admin-user-activities" role="cell">
                        <span>
                          <i className="is-watchlist" />
                          {formatChartNumber(
                            Number(item.activities?.watchlist || 0) ||
                            getStoredUserWatchlist({ id: item.id }).length,
                          )} watchlist
                        </span>
                        <span><i className="is-review" />{formatChartNumber(item.activities?.review || 0)} review</span>
                        <span><i className="is-post" />{formatChartNumber(item.activities?.post || 0)} post</span>
                        <span><i className="is-reply" />{formatChartNumber(item.activities?.reply || 0)} reply</span>
                      </div>
                      <span role="cell">
                        <span
                          className={`admin-user-status${
                            item.status === "Aktif"
                              ? " admin-user-status--active"
                              : item.status === "Nonaktif"
                                ? " admin-user-status--inactive"
                                : ""
                          }`}
                        >
                          {item.status}
                        </span>
                      </span>
                      <span role="cell">
                        <button
                          type="button"
                          className="admin-user-table__detail-button"
                          onClick={() => loadAdminUserDetail(item.id)}
                        >
                          Detail
                        </button>
                      </span>
                    </div>
                  ))}

                  {!visibleAdminUsers.length && (
                    <div className="admin-user-table__empty">
                      {isLoading ? "Memuat data user..." : "Belum ada user yang bisa ditampilkan."}
                    </div>
                  )}
                </div>

                <div className="admin-manage-pagination" aria-label="Pagination user">
                  <button
                    type="button"
                    aria-label="Halaman user sebelumnya"
                    disabled={currentUserPage === 1}
                    onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                  >
                    &lt;
                  </button>
                  {userPaginationItems.map((item, index) =>
                    typeof item === "string" ? (
                      <span key={`${item}-${index}`} className="admin-manage-pagination__ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        className={currentUserPage === item ? "admin-manage-pagination__active" : ""}
                        onClick={() => setUserPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Halaman user berikutnya"
                    disabled={currentUserPage === totalUserPages}
                    onClick={() => setUserPage((page) => Math.min(totalUserPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </article>
                </>
              )}
            </section>
          ) : (
            <>
              <section className="admin-stats-grid" aria-label="Ringkasan dashboard">
                {dashboard.stats.map((stat) => (
                  <article className="admin-stat-card" key={stat.label}>
                    <strong>{isLoading ? "..." : stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </section>

              {dashboardError && <p className="admin-dashboard-alert">{dashboardError}</p>}

              <section className="admin-dashboard-grid">
                <article className="admin-panel admin-chart-panel">
                  <div className="admin-panel__header admin-panel__header--stacked">
                    <h2>Aktivitas Pengguna</h2>
                    <div className="admin-filter-row">
                      <div className="admin-filter-row__item">
                        <button
                          type="button"
                          className="admin-filter-row__trigger"
                          aria-expanded={openChartFilter === "activity"}
                          onClick={() =>
                            setOpenChartFilter((currentFilter) =>
                              currentFilter === "activity" ? null : "activity"
                            )
                          }
                        >
                          {selectedChartActivityLabel}
                          <FiChevronDown aria-hidden="true" />
                        </button>
                        {openChartFilter === "activity" && (
                          <div className="admin-filter-row__menu" role="menu">
                            {chartActivityOptions.map((option) => (
                              <button
                                type="button"
                                key={option.id}
                                className={selectedChartActivity === option.id ? "is-active" : ""}
                                role="menuitem"
                                onClick={() => {
                                  setSelectedChartActivity(option.id);
                                  setOpenChartFilter(null);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="admin-filter-row__item">
                        <button
                          type="button"
                          className="admin-filter-row__trigger"
                          aria-expanded={openChartFilter === "year"}
                          onClick={() =>
                            setOpenChartFilter((currentFilter) =>
                              currentFilter === "year" ? null : "year"
                            )
                          }
                        >
                          {selectedChartYear}
                          <FiChevronDown aria-hidden="true" />
                        </button>
                        {openChartFilter === "year" && (
                          <div className="admin-filter-row__menu admin-filter-row__menu--year" role="menu">
                            {chartYearOptions.map((year) => (
                              <button
                                type="button"
                                key={year}
                                className={selectedChartYear === year ? "is-active" : ""}
                                role="menuitem"
                                onClick={() => {
                                  setSelectedChartYear(year);
                                  setOpenChartFilter(null);
                                }}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-chart" aria-label="Grafik aktivitas pengguna">
                    {chartItems.map((item) => (
                      <div
                        className="admin-chart__item"
                        key={item.month}
                        title={`${item.month}: ${item.valueLabel} aktivitas`}
                      >
                        <span className="admin-chart__value">{item.valueLabel}</span>
                        <span
                          className="admin-chart__bar"
                          style={{ "--bar-height": `${item.barHeight}%` }}
                        />
                        <span className="admin-chart__label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="admin-panel admin-activity-panel">
                  <div className="admin-panel__header">
                    <h2>Aktivitas Terbaru</h2>
                  </div>

                  <div className="admin-activity-list">
                    {filteredActivities.map((activity) => {
                      const Icon = activityIcons[activity.icon] || FiMessageSquare;

                      return (
                        <div className="admin-activity-item" key={`${activity.title}-${activity.time}`}>
                          <div className="admin-activity-item__icon">
                            <Icon aria-hidden="true" />
                          </div>
                          <div className="admin-activity-item__content">
                            <strong>{activity.title}</strong>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    {!filteredActivities.length && (
                      <p className="admin-empty-state">
                        {isLoading ? "Memuat aktivitas..." : "Belum ada aktivitas terbaru."}
                      </p>
                    )}
                  </div>
                </article>
              </section>

              <article className="admin-panel admin-table-panel">
                <div className="admin-table-title">
                  <h2>Film Paling Banyak Simpan di Watchlist</h2>
                  <div className="admin-table-limit-filter">
                    <button
                      type="button"
                      className="admin-table-limit"
                      aria-haspopup="menu"
                      aria-expanded={isTableLimitOpen}
                      onClick={() => setIsTableLimitOpen((isOpen) => !isOpen)}
                    >
                      {tableLimit}
                      <FiChevronDown aria-hidden="true" />
                    </button>
                    {isTableLimitOpen && (
                      <div className="admin-table-limit-filter__menu" role="menu" aria-label="Jumlah film yang tampil">
                        {tableLimitOptions.map((limit) => (
                          <button
                            type="button"
                            role="menuitem"
                            key={limit}
                            className={tableLimit === limit ? "is-active" : ""}
                            onClick={() => {
                              setTableLimit(limit);
                              setIsTableLimitOpen(false);
                            }}
                          >
                            {limit}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-table admin-table--watchlist" role="table" aria-label="Film paling banyak simpan di watchlist">
                  <div className="admin-table__row admin-table__row--head" role="row">
                    <span role="columnheader">No</span>
                    <span role="columnheader">Film</span>
                    <span role="columnheader">Genre</span>
                    <span role="columnheader">Rating</span>
                    <span role="columnheader">Watchlist</span>
                  </div>

                  {visibleWatchlistMovies.map((movie) => (
                    <div className="admin-table__row" role="row" key={`${movie.title}-${movie.no}`}>
                      <span className="admin-table__no" role="cell">
                        {movie.no}
                      </span>
                      <div className="admin-table__movie" role="cell">
                        <img src={movie.poster || flixAdminLogo} alt={movie.title} />
                        <div>
                          <strong>{movie.title}</strong>
                          <span>{movie.year}</span>
                        </div>
                      </div>
                      <span role="cell">{movie.genre}</span>
                      <span className="admin-table__rating" role="cell">
                        <FaStar aria-hidden="true" />
                        {movie.rating}
                      </span>
                      <span role="cell">{movie.watchlist}</span>
                    </div>
                  ))}
                  {!visibleWatchlistMovies.length && (
                    <div className="admin-table__empty">
                      {isLoading ? "Memuat data film..." : "Belum ada data watchlist film."}
                    </div>
                  )}
                </div>
              </article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
