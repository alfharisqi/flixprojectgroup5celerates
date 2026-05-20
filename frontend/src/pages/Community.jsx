import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import PostCard from "../components/PostCard";
import PostInsightModal from "../components/PostInsightModal";

function Community() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [insight, setInsight] = useState(null);
  const [showInsight, setShowInsight] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag") || "";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`, {
        params: activeTag ? { tag: activeTag } : {},
      });
      setPosts(res.data);
      setComments({});

      for (const post of res.data) {
        fetchComments(post.id_post);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTagClick = (tag) => {
    setSearchParams({ tag });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearTagFilter = () => {
    setSearchParams({});
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}`
      );

      setComments((prev) => ({
        ...prev,
        [postId]: res.data,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (id_post) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus post ini?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/${id_post}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus post");
    }
  };

  const handleLike = async (postId) => {
    if (!token) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-likes/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memberi like");
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!token) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-reactions/${postId}`,
        { reaction_type: reactionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/post-shares/${postId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      await navigator.clipboard.writeText(shareLink);
      fetchPosts();
      alert("Link post berhasil disalin");
    } catch (error) {
      alert("Gagal menyalin link");
    }
  };

  const handleInsight = async (postId) => {
    if (!token) {
      alert("Silakan login untuk melihat insight");
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/post-insights/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInsight(res.data);
      setShowInsight(true);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengambil insight");
    }
  };

  const handleVotePoll = async (postId, pollId, optionId) => {
    if (!token) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/polls/${pollId}/vote`,
        { option_id: optionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchPosts();
      await fetchComments(postId);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal vote polling");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTag]);

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
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
              fontWeight: "bold",
            }}
          >
            Create Post
          </button>
        )}
      </div>

      {activeTag && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            background: "#fafafa",
          }}
        >
          <strong>Filter hashtag: #{activeTag}</strong>
          <button
            type="button"
            onClick={clearTagFilter}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              color: "#111",
              borderRadius: "8px",
              padding: "7px 10px",
              cursor: "pointer",
            }}
          >
            Tampilkan semua
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.length > 0 ? posts.map((post) => (
          <PostCard
            key={post.id_post}
            post={post}
            user={user}
            comments={comments}
            handleDeletePost={handleDeletePost}
            handleLike={handleLike}
            handleReaction={handleReaction}
            handleShare={handleShare}
            handleInsight={handleInsight}
            handleVotePoll={handleVotePoll}
            handleTagClick={handleTagClick}
          />
        )) : (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "20px",
              background: "#fff",
              color: "#555",
            }}
          >
            {activeTag
              ? `Belum ada post dengan hashtag #${activeTag}.`
              : "Belum ada post."}
          </div>
        )}
      </div>

      <PostInsightModal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        insight={insight}
      />
    </div>
  );
}

export default Community;
