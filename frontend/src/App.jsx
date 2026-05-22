import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Homepage from "./pages/Homepage";
import MovieDetail from "./pages/MovieDetail";
import MoviesPage from "./pages/MoviesPage";
import GenrePage from "./pages/GenrePage";
import TVSeriesPage from "./pages/TVSeriesPage";
import TVSeriesDetail from "./pages/TVSeriesDetail";
import Community from "./pages/Community";
import AdminPage from "./pages/AdminPage";
import ModeratorPage from "./pages/ModeratorPage";
import ProfilePage from "./pages/ProfilePage";
import PostDetail from "./pages/PostDetail";
import CreatePostPage from "./pages/CreatePostPage";

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
    "/",
  ];
  const hideNavbar =
    authAndHomePaths.includes(location.pathname) ||
    location.pathname.startsWith("/movie/") ||
    location.pathname.startsWith("/tv-series/");

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
