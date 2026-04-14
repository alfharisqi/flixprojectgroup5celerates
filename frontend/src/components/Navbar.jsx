import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid #ddd"
      }}
    >
      <div style={{ display: "flex", gap: "16px" }}>
        <Link to="/">Community</Link>

        {user?.role === "moderator" && (
          <Link to="/moderator">Moderator</Link>
        )}

        {user?.role === "admin" && (
          <Link to="/admin">Admin</Link>
        )}
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {!token ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span>{user?.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;