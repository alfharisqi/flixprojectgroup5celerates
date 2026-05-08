import { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

function GifPickerModal({ isOpen, onClose, onSelectGif }) {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const apiKey = import.meta.env.VITE_GIPHY_API_KEY;

  const fetchTrending = async () => {
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=12&rating=g`,
      );
      const data = await res.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Gagal mengambil GIF trending:", error);
    }
  };

  const searchGifs = async (query) => {
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=12&rating=g`,
      );
      const data = await res.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Gagal mencari GIF:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrending();
    }
  }, [isOpen]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) {
      fetchTrending();
      return;
    }

    searchGifs(search);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}>
      <div
        style={{
          width: "90%",
          maxWidth: "760px",
          maxHeight: "80vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: "14px",
          padding: "16px",
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}>
          <h3 style={{ margin: 0 }}>Pilih GIF</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "20px",
            }}>
            <FiX />
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            type="text"
            placeholder="Cari GIF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
          <button
            type="submit"
            style={{
              border: "none",
              background: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            <FiSearch />
          </button>
        </form>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "10px",
          }}>
          {gifs.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() =>
                onSelectGif({
                  id: gif.id,
                  url: gif.images.fixed_height.url,
                  preview: gif.images.fixed_height_small.url,
                })
              }
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "6px",
                background: "#fff",
                cursor: "pointer",
              }}>
              <img
                src={gif.images.fixed_height_small.url}
                alt={gif.title}
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GifPickerModal;
