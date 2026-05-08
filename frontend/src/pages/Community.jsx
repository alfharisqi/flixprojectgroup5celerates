import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PostCard from "../components/PostCard";

function Community() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`);
      setPosts(res.data);

      for (const post of res.data) {
        fetchComments(post.id_post);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}`
      );

      setComments((prev) => ({
        ...prev,
        [postId]: res.data
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const renderContentWithGif = (text) => {
    if (!text) return null;

    const gifMatch = text.match(/\[GIF\](.*?)\[\/GIF\]/);
    const cleanText = text.replace(/\[GIF\](.*?)\[\/GIF\]/, "").trim();

    return (
      <div>
        {cleanText && <p style={{ margin: "6px 0 10px 0" }}>{cleanText}</p>}
        {gifMatch?.[1] && (
          <img
            src={gifMatch[1]}
            alt="GIF"
            style={{
              maxWidth: "220px",
              borderRadius: "10px",
              display: "block"
            }}
          />
        )}
      </div>
    );
  };

  const handleDeletePost = async (id_post) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus post ini?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/${id_post}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus post");
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-likes/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memberi like");
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-reactions/${postId}`,
        { reaction_type: reactionType },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memberi reaction");
    }
  };

  const handleShare = async (postId) => {
    const shareLink = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      alert("Link post berhasil disalin");
    } catch (error) {
      alert("Gagal menyalin link");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}
      >
        <h1 style={{ margin: 0 }}>Community</h1>

        {token && (
          <button
            type="button"
            onClick={() => navigate("/create-post")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              background: "#ff4500",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Create Post
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.map((post) => (
          <PostCard
            key={post.id_post}
            post={post}
            user={user}
            comments={comments}
            handleDeletePost={handleDeletePost}
            handleLike={handleLike}
            handleReaction={handleReaction}
            handleShare={handleShare}
            renderContentWithGif={renderContentWithGif}
          />
        ))}
      </div>
    </div>
  );
}

export default Community;