import { useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiShare2,
  FiSmile,
  FiThumbsUp,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import RichContent from "./RichContent";
import "./PostCard.css";

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
  const authorInitial = (post.username || "F").slice(0, 1).toUpperCase();

  const handleCardAction = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <article
      className="community-post-card"
      onClick={() => navigate(`/post/${post.id_post}`)}
    >
      <div className="community-post-card__header">
        <div className="community-post-card__author">
          <span className="community-post-card__avatar">{authorInitial}</span>
          <div>
            <h3>{post.title || "Untitled Post"}</h3>
            <p>
              by {post.username} <span />{" "}
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {canDelete && (
          <button
            className="community-post-card__delete"
            type="button"
            onClick={(event) =>
              handleCardAction(event, () => handleDeletePost(post.id_post))
            }
            aria-label="Hapus post"
          >
            <FiTrash2 />
          </button>
        )}
      </div>

      {post.tags?.length > 0 && (
        <div className="community-post-card__tags">
          {post.tags.map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={(event) =>
                handleCardAction(event, () => handleTagClick?.(tag))
              }
              title={`Lihat post dengan hashtag #${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="community-post-card__content">
        <RichContent html={post.content} />
      </div>

      {post.image_url && (
        <img
          className="community-post-card__image"
          src={`${import.meta.env.VITE_API_URL}${post.image_url}`}
          alt="Post"
        />
      )}

      {post.post_type === "poll" && pollOptions.length > 0 && (
        <div className="community-post-card__poll">
          <div className="community-post-card__poll-title">
            Polling
          </div>

          <div className="community-post-card__poll-options">
            {pollOptions.map((option) => {
              const voteCount = Number(option.vote_count || 0);
              const percent =
                totalPollVotes > 0
                  ? Math.round((voteCount / totalPollVotes) * 100)
                  : 0;

              return (
                <button
                  className="community-post-card__poll-option"
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
                >
                  <span
                    className="community-post-card__poll-fill"
                    style={{
                      width: `${percent}%`,
                    }}
                  />
                  <span className="community-post-card__poll-label">
                    <span>{option.option_text || "Opsi polling kosong"}</span>
                    <small>
                      {voteCount} vote{totalPollVotes > 0 ? ` (${percent}%)` : ""}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="community-post-card__actions">
        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleLike(post.id_post))
          }
        >
          <FiThumbsUp />
          <span>Like</span>
          <small>{post.like_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "love"))
          }
        >
          <FiHeart />
          <span>Love</span>
          <small>{post.love_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "funny"))
          }
        >
          <FiSmile />
          <span>Funny</span>
          <small>{post.funny_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "wow"))
          }
        >
          <FiZap />
          <span>Wow</span>
          <small>{post.wow_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "sad"))
          }
        >
          <FiMessageCircle />
          <span>Sad</span>
          <small>{post.sad_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleReaction(post.id_post, "angry"))
          }
        >
          <FiZap />
          <span>Angry</span>
          <small>{post.angry_count || 0}</small>
        </button>

        <button
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleShare(post.id_post))
          }
        >
          <FiShare2 />
          <span>Share</span>
        </button>

        <button
          className="community-post-card__insight"
          type="button"
          onClick={(event) =>
            handleCardAction(event, () => handleInsight(post.id_post))
          }
          aria-label={`Total insight ${totalInsight}`}
          title="Total insight"
        >
          <FiBarChart2 />
          <span>{totalInsight}</span>
        </button>
      </div>

      <div className="community-post-card__reply-count">
        <FiSend />
        <span>Total Replies: {replyCount}</span>
      </div>
    </article>
  );
}

export default PostCard;
