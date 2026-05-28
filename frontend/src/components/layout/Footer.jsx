import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <nav aria-label="Footer navigation">
        <Link to="/">Home</Link>
        <Link to="/movies">Movie</Link>
        <Link to="/tv-series">TV Series</Link>
        <Link to="/genre">Genre</Link>
        <Link to="/community">Community</Link>
      </nav>

      <div className="footer-socials">
        <FaFacebookF />
        <FaTwitter />
        <FaYoutube />
      </div>

      <p>Copyright 2026 - Kelompok 5</p>
    </footer>
  );
}

export default Footer;