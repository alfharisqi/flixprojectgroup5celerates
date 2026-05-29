import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import Homepage from "./pages/home/Homepage";
import MovieDetail from "./pages/movies/MovieDetail";
import MoviesPage from "./pages/movies/MoviesPage";
import GenrePage from "./pages/genre/GenrePage";
import TVSeriesPage from "./pages/tv/TVSeriesPage";
import TVSeriesDetail from "./pages/tv/TVSeriesDetail";
import Community from "./pages/community/Community";
import AdminPage from "./pages/admin/AdminPage";
import ModeratorPage from "./pages/moderator/ModeratorPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PostDetail from "./pages/community/PostDetail";
import CreatePostPage from "./pages/community/CreatePostPage";
import WatchlistPage from "./pages/watchlist/WatchlistPage";
import Upgradepage from "./pages/upgradepremium/UpgradePage";

function App() {
  const location = useLocation();
  const authAndHomePaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/movies",
    "/genre",
    "/tv-series",
    "/community",
    "/create-post",
    "/watchlist",
    "/profile",
    "/upgrade",
    "/",
  ];
  const hideNavbar =
    authAndHomePaths.includes(location.pathname) ||
    location.pathname.startsWith("/movie/") ||
    location.pathname.startsWith("/tv-series/") ||
    location.pathname.startsWith("/post/");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/genre" element={<GenrePage />} />
        <Route path="/tv-series" element={<TVSeriesPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/tv-series/:id" element={<TVSeriesDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/upgrade" element={<Upgradepage />} />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute allowedRoles={["registered_user", "moderator", "admin"]}>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["registered_user", "moderator", "admin"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/moderator"
          element={
            <ProtectedRoute allowedRoles={["moderator", "admin"]}>
              <ModeratorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
