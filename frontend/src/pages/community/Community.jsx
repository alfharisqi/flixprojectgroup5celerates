import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiEdit3,
  FiHash,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiSliders,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import SiteNavbar from "../../components/layout/SiteNavbar";
import PostCard from "../../components/community/PostCard";
import PostInsightModal from "../../components/community/PostInsightModal";
import PostSearchModal from "../../components/community/PostSearchModal";
import "./Community.css";

function Community() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [insight, setInsight] = useState(null);
  const [showInsight, setShowInsight] = useState(false);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showPostSearch, setShowPostSearch] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag") || "";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const totalReplies = Object.values(comments).reduce(
    (total, item) => total + (Array.isArray(item) ? item.length : 0),
    0
  );
  const allComments = Object.values(comments).flatMap((item) =>
    Array.isArray(item) ? item : []
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
  const currentUserId = Number(user?.id_user || 0);
  const userPosts = currentUserId
    ? posts.filter((post) => Number(post.id_user) === currentUserId)
    : [];
  const userComments = currentUserId
    ? allComments.filter((comment) => Number(comment.id_user) === currentUserId)
    : [];

  const getReplyCount = (post) => {
    return Number(post.reply_count ?? (comments[post.id_post] || []).length);
  };

  const getPostInsight = (post) => {
    const pollVotes = (post.poll?.options || []).reduce(
      (total, option) => total + Number(option.vote_count || 0),
      0
    );

    const fallbackInsight =
      Number(post.view_count || 0) +
      Number(post.like_count || 0) +
      getReplyCount(post) +
      Number(post.share_count || 0) +
      Number(post.total_reactions || 0) +
      pollVotes;

    return Number(post.total_insight ?? fallbackInsight);
  };

  const getPollVoteCount = (post) => {
    const optionVotes = (post.poll?.options || []).reduce(
      (total, option) => total + Number(option.vote_count || 0),
      0
    );

    return Number(post.poll_vote_count ?? optionVotes);
  };

  const userPollPosts = userPosts.filter((post) => post.post_type === "poll");
  const userPostInsight = userPosts.reduce(
    (total, post) => total + getPostInsight(post),
    0
  );
  const userPostLikes = userPosts.reduce(
    (total, post) => total + Number(post.like_count || 0),
    0
  );
  const userPostReactions = userPosts.reduce(
    (total, post) => total + Number(post.total_reactions || 0),
    0
  );
  const userPostShares = userPosts.reduce(
    (total, post) => total + Number(post.share_count || 0),
    0
  );
  const userPollVotes = userPollPosts.reduce(
    (total, post) => total + getPollVoteCount(post),
    0
  );

  const activityStats = [
    { label: "Post Dibuat", value: userPosts.length },
    { label: "Reply/Response", value: userComments.length },
    { label: "Insight", value: userPostInsight },
    { label: "Like Diterima", value: userPostLikes },
    { label: "Reaction Diterima", value: userPostReactions },
    { label: "Share Post Kamu", value: userPostShares },
    { label: "Polling Kamu", value: userPollPosts.length },
    { label: "Vote di Polling Kamu", value: userPollVotes },
  ];
  const primaryActivityStats = activityStats.slice(0, 3);
  const detailActivityStats = activityStats.slice(3);

  const cleanActivityText = (text = "") =>
    String(text)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getActivityPreview = (text, fallback = "Aktivitas") => {
    const cleanText = cleanActivityText(text);

    if (!cleanText) {
      return fallback;
    }

    const words = cleanText.split(" ");

    if (words.length <= 2) {
      return cleanText;
    }

    return `${words.slice(0, 2).join(" ")}...`;
  };

  const formatActivityDate = (dateValue) => {
    const activityDate = new Date(dateValue);

    if (Number.isNaN(activityDate.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(activityDate);
  };

  const displayedPosts = [...posts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const latestActivities = posts
    .flatMap((post) => {
      const isUserPost = Number(post.id_user) === currentUserId;
      const postActivities = isUserPost
        ? [
            {
              id: `post-${post.id_post}`,
              postId: post.id_post,
              type: "Post",
              preview: getActivityPreview(post.content || post.title, "Post baru"),
              date: formatActivityDate(post.created_at),
              time: post.created_at,
            },
          ]
        : [];

      const replyActivities = (comments[post.id_post] || [])
        .filter((comment) => Number(comment.id_user) === currentUserId)
        .map((comment) => ({
          id: `reply-${comment.id_comment}`,
          postId: post.id_post,
          type: "Reply",
          preview: getActivityPreview(comment.content, "Reply baru"),
          date: formatActivityDate(comment.created_at),
          time: comment.created_at,
        }));

      return [...postActivities, ...replyActivities];
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);
  const visibleActivities = showAllActivities
    ? latestActivities
    : latestActivities.slice(0, 2);

  const feedTitle = activeTag
    ? `Post dengan #${activeTag}`
    : "Diskusi terbaru";

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`, {
        params: activeTag ? { tag: activeTag } : {},
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
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
      return false;
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
      return true;
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memberi reaction");
      return false;
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

  const handleReportPost = (postId) => {
    alert(`Fitur report post #${postId} akan ditambahkan.`);
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
  }, [activeTag, token]);

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
            {!token && (
              <p>Login untuk melihat aktivitas pribadi kamu di komunitas.</p>
            )}

            <div className="community-activity-summary">
              {primaryActivityStats.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="community-activity-toggle"
              onClick={() => setShowActivityDetail((prev) => !prev)}
            >
              {showActivityDetail ? "Sembunyikan detail" : "Lihat detail aktivitas"}
            </button>

            {showActivityDetail && (
              <div className="community-activity-detail">
                {detailActivityStats.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="community-activity-list">
              <strong>Aktivitas terbaru</strong>
              {latestActivities.length > 0 ? (
                <>
                  {visibleActivities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => navigate(`/post/${activity.postId}`)}
                    >
                      <small>{activity.type}</small>
                      <span title={cleanActivityText(activity.preview)}>
                        {activity.preview}
                      </span>
                      <em>{activity.date}</em>
                    </button>
                  ))}

                  {latestActivities.length > 2 && (
                    <button
                      type="button"
                      className="community-activity-more"
                      onClick={() => setShowAllActivities((prev) => !prev)}
                    >
                      {showAllActivities ? "Tampilkan lebih sedikit" : "Lihat semua"}
                    </button>
                  )}
                </>
              ) : (
                <p>Aktivitasmu akan muncul setelah kamu membuat post atau reply.</p>
              )}
            </div>
          </div>

        </aside>

        <section className="community-feed" aria-live="polite">
          <div className="community-feed__header">
            <div>
              <span>Community Post</span>
              <h2>{feedTitle}</h2>
            </div>
            <button
              type="button"
              className="community-filter-button"
              onClick={() => alert("Fitur filter post akan ditambahkan.")}
            >
              <FiSliders />
              Filter
            </button>
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
            {displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
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
                  handleReportPost={handleReportPost}
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

        <aside className="community-right-sidebar" aria-label="Trending hashtag">
          <button
            type="button"
            className="community-post-search"
            onClick={() => setShowPostSearch(true)}
            aria-label="Temukan diskusi community"
          >
            <FiSearch />
            <span>Temukan diskusi...</span>
          </button>

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
      </section>

      <PostInsightModal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        insight={insight}
      />

      <PostSearchModal
        open={showPostSearch}
        posts={displayedPosts}
        comments={comments}
        onClose={() => setShowPostSearch(false)}
        onOpenPost={(postId) => navigate(`/post/${postId}`)}
      />
    </main>
  );
}

export default Community;
