import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import Login from "@/features/auth/Login";
import ForgotPassword from "@/features/auth/ForgotPassword";
import Register from "@/features/auth/Register";
import ResetPassword from "@/features/auth/ResetPassword";
import VerifyEmail from "@/features/auth/VerifyEmail";
import Homepage from "@/features/home/Homepage";
import MovieDetail from "@/features/movies/MovieDetail";
import MoviesPage from "@/features/movies/MoviesPage";
import GenrePage from "@/features/genre/GenrePage";
import TVSeriesPage from "@/features/tv-series/TVSeriesPage";
import TVSeriesDetail from "@/features/tv-series/TVSeriesDetail";
import Community from "@/features/community/Community";
import AdminPage from "@/features/admin/AdminPage";
import ModeratorPage from "@/features/admin/ModeratorPage";
import ProfilePage from "@/features/profile/ProfilePage";
import PostDetail from "@/features/community/PostDetail";
import CreatePostPage from "@/features/community/CreatePostPage";
import WatchlistPage from "@/features/watchlist/WatchlistPage";

function App() {
  const location = useLocation();
  const authAndHomePaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/movies",
    "/genre",
    "/tv-series",
    "/community",
    "/create-post",
    "/watchlist",
    "/profile",
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
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

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
