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
  handleVotePoll,
  handleTagClick,
}) {
  const navigate = useNavigate();

  const canDelete =
    user &&
    (user.role === "admin" ||
      user.role === "moderator" ||
      Number(user.id_user) === Number(post.id_user));

  const replyCount = Number(
    post.reply_count ?? (comments[post.id_post] || []).length
  );
  const viewCount = Number(post.view_count || 0);
  const pollOptions = post.poll?.options || [];
  const totalPollVotes = pollOptions.reduce(
    (total, option) => total + Number(option.vote_count || 0),
    0
  );
  const fallbackTotalInsight =
    viewCount +
    Number(post.like_count || 0) +
    replyCount +
    Number(post.share_count || 0) +
    Number(post.total_reactions || 0) +
    totalPollVotes;
  const totalInsight = Number(post.total_insight ?? fallbackTotalInsight);

  const handleCardAction = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <div
      onClick={() => navigate(`/post/${post.id_post}`)}
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{post.title || "Untitled Post"}</h3>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "#666" }}>
            by {post.username} - {new Date(post.created_at).toLocaleString()}
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={(event) =>
              handleCardAction(event, () => handleDeletePost(post.id_post))
            }
            style={{
              background: "crimson",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
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
          }}
        >
          {post.tags.map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={(event) =>
                handleCardAction(event, () => handleTagClick?.(tag))
              }
              style={{
                background: "#f3f4f6",
                color: "#111",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                border: "1px solid transparent",
                cursor: "pointer",
              }}
              title={`Lihat post dengan hashtag #${tag}`}
            >
              #{tag}
            </button>
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

      {post.post_type === "poll" && pollOptions.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "10px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#111",
            }}
          >
            Polling
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {pollOptions.map((option) => {
              const voteCount = Number(option.vote_count || 0);
              const percent =
                totalPollVotes > 0
                  ? Math.round((voteCount / totalPollVotes) * 100)
                  : 0;

              return (
                <button
                  key={option.id_option}
                  type="button"
                  onClick={(event) =>
                    handleCardAction(event, () =>
                      handleVotePoll(
                        post.id_post,
                        post.poll.id_poll,
                        option.id_option
                      )
                    )
                  }
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#fff",
                    padding: "9px 10px",
                    cursor: "pointer",
                    color: "#111",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${percent}%`,
                      background: "#ffe8df",
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span>{option.option_text || "Opsi polling kosong"}</span>
                    <span style={{ whiteSpace: "nowrap", color: "#555" }}>
                      {voteCount} vote{totalPollVotes > 0 ? ` (${percent}%)` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleLike(post.id_post))
          }
        >
          Like ({post.like_count || 0})
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "love"))
          }
        >
          Love {post.love_count || 0}
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "funny"))
          }
        >
          Funny {post.funny_count || 0}
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "wow"))
          }
        >
          Wow {post.wow_count || 0}
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "sad"))
          }
        >
          Sad {post.sad_count || 0}
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "angry"))
          }
        >
          Angry {post.angry_count || 0}
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleShare(post.id_post))
          }
        >
          Share
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleInsight(post.id_post))
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          aria-label={`Total insight ${totalInsight}`}
          title="Total insight"
        >
          <FiBarChart2 size={16} />
          <span>{totalInsight}</span>
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
        }}
      >
        <FiMessageCircle size={16} />
        <span>Total Replies: {replyCount}</span>
      </div>
    </div>
  );
}

export default PostCard;
