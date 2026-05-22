import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiEdit3,
  FiHash,
  FiMessageCircle,
  FiPlus,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import SiteNavbar from "../components/SiteNavbar";
import PostCard from "../components/PostCard";
import PostInsightModal from "../components/PostInsightModal";
import "./Community.css";

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
  const totalReplies = Object.values(comments).reduce(
    (total, item) => total + (Array.isArray(item) ? item.length : 0),
    0
  );
  const totalInsight = posts.reduce(
    (total, post) => total + Number(post.total_insight || post.view_count || 0),
    0
  );
  const trendingTags = posts
    .flatMap((post) => post.tags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
  const topTags = Object.entries(trendingTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

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
    <main className="community-page">
      <SiteNavbar mode="fixed" activeKey="community" />

      <section className="community-hero">
        <div className="community-hero__content">
          <div className="community-eyebrow">
            <span />
            COMMUNITY
          </div>
          <h1>
            Ruang Diskusi <strong>Film</strong> Bersama Komunitas
          </h1>
          <p>
            Bagikan opini, polling, rekomendasi, dan insight tontonan dengan
            pengguna FLIX lainnya.
          </p>
        </div>

        <div className="community-hero__stats" aria-label="Community statistics">
          <div>
            <FiEdit3 />
            <span>{posts.length}</span>
            <small>Post</small>
          </div>
          <div>
            <FiMessageCircle />
            <span>{totalReplies}</span>
            <small>Replies</small>
          </div>
          <div>
            <FiActivity />
            <span>{totalInsight}</span>
            <small>Insight</small>
          </div>
        </div>
      </section>

      <section className="community-shell">
        <aside className="community-sidebar" aria-label="Community sidebar">
          <div className="community-profile-panel">
            <span className="community-avatar">
              {(user?.username || user?.email || "F").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h2>{user?.username || "Guest FLIX"}</h2>
              <p>{token ? "Siap berbagi post baru" : "Login untuk membuat post"}</p>
            </div>
          </div>

          {token ? (
            <button
              className="community-create-button"
              type="button"
              onClick={() => navigate("/create-post")}
            >
              <FiPlus />
              Create Post
            </button>
          ) : (
            <button
              className="community-create-button community-create-button--ghost"
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}

          <div className="community-info-panel">
            <h3>
              <FiUsers />
              Aktivitas
            </h3>
            <p>
              Gunakan post, polling, like, reaction, share, dan insight seperti
              sebelumnya. Perubahan ini hanya menyentuh tampilan.
            </p>
          </div>

          <div className="community-tags-panel">
            <h3>
              <FiTrendingUp />
              Trending Hashtag
            </h3>
            {topTags.length > 0 ? (
              <div className="community-tag-list">
                {topTags.map(([tag, count]) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={activeTag === tag ? "is-active" : ""}
                  >
                    <FiHash />
                    <span>#{tag}</span>
                    <small>{count}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p>Hashtag akan muncul setelah post memiliki tag.</p>
            )}
          </div>
        </aside>

        <section className="community-feed" aria-live="polite">
          <div className="community-feed__header">
            <div>
              <span>Community Post</span>
              <h2>{activeTag ? `Post dengan #${activeTag}` : "Diskusi terbaru"}</h2>
            </div>
            {token && (
              <button type="button" onClick={() => navigate("/create-post")}>
                <FiPlus />
                Post Baru
              </button>
            )}
          </div>

          {activeTag && (
            <div className="community-active-filter">
              <strong>
                <FiHash />
                Filter hashtag: #{activeTag}
              </strong>
              <button type="button" onClick={clearTagFilter}>
                <FiX />
                Tampilkan semua
              </button>
            </div>
          )}

          <div className="community-post-list">
            {posts.length > 0 ? (
              posts.map((post) => (
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
              ))
            ) : (
              <div className="community-empty-state">
                <h3>
                  {activeTag
                    ? `Belum ada post dengan hashtag #${activeTag}.`
                    : "Belum ada post."}
                </h3>
                <p>Mulai diskusi baru agar feed komunitas terlihat hidup.</p>
              </div>
            )}
          </div>
        </section>
      </section>

      <PostInsightModal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        insight={insight}
      />
    </main>
  );
}

export default Community;
