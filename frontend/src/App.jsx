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
import TVSeriesPage from "./pages/TVSeriesPage";
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
    "/tv-series",
    "/",
  ];
  const hideNavbar =
    authAndHomePaths.includes(location.pathname) ||
    location.pathname.startsWith("/movie/");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/tv-series" element={<TVSeriesPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
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
