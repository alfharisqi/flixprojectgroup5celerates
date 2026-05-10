import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiMessageCircle } from "react-icons/fi";
import RichContent from "./RichContent";

function PostCard({
  post,
  user,
  comments,
  handleDeletePost,
  handleLike,
  handleReaction,
  handleShare,
  handleInsight,
  renderContentWithGif,
}) {
  const navigate = useNavigate();

  const canDelete =
    user &&
    (user.role === "admin" ||
      user.role === "moderator" ||
      Number(user.id_user) === Number(post.id_user));

  const replyCount = (comments[post.id_post] || []).length;

  const insightCount =
    Number(post.like_count || 0) +
    Number(post.love_count || 0) +
    Number(post.funny_count || 0) +
    Number(post.wow_count || 0) +
    Number(post.sad_count || 0) +
    Number(post.angry_count || 0) +
    Number(replyCount || 0);

  return (
    <div
      onClick={() => navigate(`/post/${post.id_post}`)}
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
        cursor: "pointer",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: "12px",
        }}>
        <div>
          <h3 style={{ margin: 0 }}>{post.title || "Untitled Post"}</h3>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "#666" }}>
            by {post.username} • {new Date(post.created_at).toLocaleString()}
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePost(post.id_post);
            }}
            style={{
              background: "crimson",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}>
            Hapus
          </button>
        )}
      </div>

      {post.tags?.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "12px",
          }}>
          {post.tags.map((tag, index) => (
            <span
              key={index}
              style={{
                background: "#f3f4f6",
                color: "#111",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
              }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px" }}>
        <RichContent html={post.content} />
      </div>

      {post.image_url && (
        <img
          src={`${import.meta.env.VITE_API_URL}${post.image_url}`}
          alt="Post"
          style={{
            maxWidth: "260px",
            marginTop: "10px",
            borderRadius: "10px",
            display: "block",
          }}
        />
      )}

      {post.post_type === "poll" && (
        <div
          style={{ marginTop: "10px", color: "#ff4500", fontWeight: "bold" }}>
          📊 Polling Post
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "12px",
        }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLike(post.id_post);
          }}>
          👍 Like ({post.like_count || 0})
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReaction(post.id_post, "love");
          }}>
          ❤️ {post.love_count || 0}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReaction(post.id_post, "funny");
          }}>
          😂 {post.funny_count || 0}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReaction(post.id_post, "wow");
          }}>
          😮 {post.wow_count || 0}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReaction(post.id_post, "sad");
          }}>
          😢 {post.sad_count || 0}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleReaction(post.id_post, "angry");
          }}>
          😡 {post.angry_count || 0}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleShare(post.id_post);
          }}>
          🔗 Share
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleInsight(post.id_post);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
          <FiBarChart2 size={16} />
          <span>{insightCount}</span>
        </button>
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#666",
          fontSize: "14px",
        }}>
        <FiMessageCircle size={16} />
        <span>Total Replies: {replyCount}</span>
      </div>
    </div>
  );
}

export default PostCard;
