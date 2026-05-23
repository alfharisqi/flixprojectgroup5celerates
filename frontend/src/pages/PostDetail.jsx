import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import {
  FiBarChart2,
  FiCornerUpLeft,
  FiFlag,
  FiHeart,
  FiShare2,
  FiSmile,
  FiThumbsUp,
} from "react-icons/fi";
import GifPickerModal from "../components/GifPickerModal";
import PostInsightModal from "../components/PostInsightModal";
import RichContent from "../components/RichContent";
import SiteNavbar from "../components/SiteNavbar";
import "./PostDetail.css";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [pollData, setPollData] = useState(null);

  const [replyInputs, setReplyInputs] = useState({});
  const [showChildReplies, setShowChildReplies] = useState({});
  const [activeReplyBox, setActiveReplyBox] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState({});
  const [showGifPicker, setShowGifPicker] = useState({});
  const [selectedGifs, setSelectedGifs] = useState({});

  const [insight, setInsight] = useState(null);
  const [showInsight, setShowInsight] = useState(false);

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const fetchPost = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts/${id}`,
      );
      setPost(res.data);
    } catch (error) {
      console.error(error);
      setPost(null);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/comments/${id}`,
      );
      setComments(res.data);
    } catch (error) {
      console.error(error);
      setComments([]);
    }
  };

  const fetchPoll = async (postId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/polls/post/${postId}`,
      );
      setPollData(res.data);
    } catch (error) {
      setPollData(null);
    }
  };

  const fetchInsight = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/post-insights/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setInsight(res.data);
      setShowInsight(true);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengambil insight");
    }
  };

  const recordPostView = async () => {
    if (!token) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-views/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadPost = async () => {
      await recordPostView();
      fetchPost();
      fetchComments();
    };

    loadPost();
  }, [id]);

  useEffect(() => {
    if (post?.post_type === "poll") {
      fetchPoll(post.id_post);
    } else {
      setPollData(null);
    }
  }, [post]);

  const toggleChildReplies = (commentId) => {
    setShowChildReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const toggleReplyBox = (key) => {
    setActiveReplyBox((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleEmojiPicker = (key) => {
    setShowEmojiPicker((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleGifPicker = (key) => {
    setShowGifPicker((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReplyChange = (key, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectGif = (key, gif) => {
    setSelectedGifs((prev) => ({
      ...prev,
      [key]: gif,
    }));

    setShowGifPicker((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const removeSelectedGif = (key) => {
    setSelectedGifs((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleTagClick = (tag) => {
    navigate(`/?tag=${encodeURIComponent(tag)}`);
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
              display: "block",
            }}
          />
        )}
      </div>
    );
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/post-likes/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      fetchPost();
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
            Authorization: `Bearer ${token}`,
          },
        },
      );
      fetchPost();
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
          },
        );
      }

      await navigator.clipboard.writeText(shareLink);
      fetchPost();
      alert("Link post berhasil disalin");
    } catch (error) {
      alert("Gagal menyalin link");
    }
  };

  const handleVotePoll = async (pollId, optionId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/polls/${pollId}/vote`,
        { option_id: optionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchPoll(post.id_post);
      fetchPost();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal vote polling");
    }
  };

  const handleCreateReply = async (
    postId,
    parentCommentId = null,
    inputKey,
  ) => {
    try {
      const replyText = replyInputs[inputKey];

      if (
        (!replyText || replyText.trim() === "") &&
        !selectedGifs[inputKey]?.url
      ) {
        alert("Reply tidak boleh kosong");
        return;
      }

      const finalContent = selectedGifs[inputKey]?.url
        ? `${replyText || ""}<p><img src="${selectedGifs[inputKey].url}" alt="GIF" class="embedded-gif" /></p>`
        : replyText;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}`,
        {
          content: finalContent,
          parent_comment_id: parentCommentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setReplyInputs((prev) => ({
        ...prev,
        [inputKey]: "",
      }));

      setSelectedGifs((prev) => ({
        ...prev,
        [inputKey]: null,
      }));

      if (parentCommentId) {
        setShowChildReplies((prev) => ({
          ...prev,
          [parentCommentId]: true,
        }));
      }

      fetchComments();
      fetchPost();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat reply");
    }
  };

  const getChildComments = (allComments, parentId) => {
    return allComments.filter(
      (comment) => Number(comment.parent_comment_id) === Number(parentId),
    );
  };

  const getReplyInitial = (username = "") => {
    return username.trim().charAt(0).toUpperCase() || "U";
  };

  const formatReplyDate = (date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReportClick = (targetType, targetId) => {
    alert(`Fitur report ${targetType} #${targetId} akan ditambahkan.`);
  };

  const renderCommentTree = (allComments, items, postId, level = 0) => {
    return items.map((comment) => {
      const childComments = getChildComments(allComments, comment.id_comment);
      const inputKey = `comment-${comment.id_comment}`;
      const replyNumber =
        allComments.findIndex(
          (item) => item.id_comment === comment.id_comment,
        ) + 1;

      return (
        <div
          key={comment.id_comment}
          className={`post-reply-item ${
            level > 0 ? "post-reply-item--nested" : ""
          }`}>
          <article className="post-reply-card">
            <header className="post-reply-header">
              <div className="post-reply-author">
                <div className="post-reply-avatar" aria-hidden="true">
                  {getReplyInitial(comment.username)}
                </div>
                <div className="post-reply-meta">
                  <strong>{comment.username}</strong>
                  <time dateTime={comment.created_at}>
                    {formatReplyDate(comment.created_at)}
                  </time>
                </div>
              </div>

              <div className="post-reply-tools">
                <span className="post-reply-number">#{replyNumber}</span>
                <button
                  type="button"
                  className="post-report-button"
                  aria-label={`Report reply dari ${comment.username}`}
                  title="Report reply"
                  onClick={() =>
                    handleReportClick("reply", comment.id_comment)
                  }>
                  <FiFlag />
                </button>
              </div>
            </header>

            <div className="post-reply-content">
              <RichContent html={comment.content} />
            </div>

            <div className="post-reply-actions">
              <span
                className="post-reply-like-pill"
                aria-label="Reply like count">
                <FiThumbsUp />
                <span>{comment.like_count || 0}</span>
              </span>

              {childComments.length > 0 && (
                <button
                  type="button"
                  className="post-reply-text-action"
                  onClick={() => toggleChildReplies(comment.id_comment)}>
                  {showChildReplies[comment.id_comment]
                    ? "Tutup"
                    : `${childComments.length} balasan`}
                </button>
              )}

              {token && (
                <button
                  type="button"
                  className="post-reply-text-action post-reply-text-action--reply"
                  onClick={() => toggleReplyBox(inputKey)}>
                  <FiCornerUpLeft />
                  {activeReplyBox[inputKey] ? "Batal" : "Balas"}
                </button>
              )}
            </div>

            {activeReplyBox[inputKey] && token && (
              <div className="post-reply-form">
                <div className="post-reply-input-row">
                  <input
                    className="post-reply-input"
                    type="text"
                    placeholder="Tulis balasan..."
                    value={replyInputs[inputKey] || ""}
                    onChange={(e) =>
                      handleReplyChange(inputKey, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="post-reply-icon-button"
                    onClick={() => toggleEmojiPicker(inputKey)}>
                    <FiSmile />
                  </button>
                  <button
                    type="button"
                    className="post-reply-gif-button"
                    onClick={() => toggleGifPicker(inputKey)}>
                    GIF
                  </button>
                  <button
                    type="button"
                    className="post-reply-submit"
                    onClick={() =>
                      handleCreateReply(postId, comment.id_comment, inputKey)
                    }>
                    Kirim
                  </button>
                </div>

                {selectedGifs[inputKey]?.preview && (
                  <div className="post-reply-gif-preview">
                    <img
                      src={selectedGifs[inputKey].preview}
                      alt="GIF preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedGif(inputKey)}>
                      Hapus GIF
                    </button>
                  </div>
                )}

                {showEmojiPicker[inputKey] && (
                  <div className="post-detail-emoji-picker">
                    <EmojiPicker
                      theme={Theme.DARK}
                      emojiStyle={EmojiStyle.NATIVE}
                      width="100%"
                      height={360}
                      lazyLoadEmojis
                      skinTonesDisabled
                      searchPlaceholder="Cari emote"
                      previewConfig={{ showPreview: false }}
                      onEmojiClick={(emojiData) =>
                        handleReplyChange(
                          inputKey,
                          (replyInputs[inputKey] || "") + emojiData.emoji,
                        )
                      }
                    />
                  </div>
                )}

                <GifPickerModal
                  isOpen={!!showGifPicker[inputKey]}
                  onClose={() => toggleGifPicker(inputKey)}
                  onSelectGif={(gif) => handleSelectGif(inputKey, gif)}
                />
              </div>
            )}
          </article>

          {showChildReplies[comment.id_comment] && (
            <div className="post-reply-children">
              {renderCommentTree(
                allComments,
                childComments,
                postId,
                level + 1,
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (!post) {
    return (
      <main className="post-detail-page">
        <SiteNavbar mode="fixed" activeKey="community" />
        <div className="post-detail-shell">
          <div className="post-detail-empty">Post tidak ditemukan.</div>
        </div>
      </main>
    );
  }

  const rootComments = comments.filter((comment) => !comment.parent_comment_id);
  const postReplyKey = `post-${post.id_post}`;
  const viewCount = Number(post.view_count || 0);
  const totalInsight = Number(post.total_insight || viewCount);

  return (
    <main className="post-detail-page">
      <SiteNavbar mode="fixed" activeKey="community" />
      <div className="post-detail-shell">
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "16px" }}>
        &lt; Kembali
      </button>

      <div className="post-detail-card">
        <button
          type="button"
          className="post-report-button post-detail-report-button"
          aria-label="Report post"
          title="Report post"
          onClick={() => handleReportClick("post", post.id_post)}>
          <FiFlag />
        </button>

        <h2 style={{ margin: 0 }}>{post.title || "Untitled Post"}</h2>

        <div
          style={{
            marginTop: "8px",
            color: "#666",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}>
          <span>
            by {post.username} - {new Date(post.created_at).toLocaleString()}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}>
            <FiBarChart2 size={14} />
            {viewCount} views
          </span>
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
              <button
                key={index}
                type="button"
                onClick={() => handleTagClick(tag)}
                style={{
                  background: "#f3f4f6",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  border: "1px solid transparent",
                  color: "#111",
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

        {post.post_type === "poll" && pollData && (
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ color: "#111" }}>Polling</h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pollData.options.map((option) => (
                <button
                  key={option.id_option}
                  type="button"
                  onClick={() =>
                    handleVotePoll(pollData.poll.id_poll, option.id_option)
                  }
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #ccc",
                    background: "#fff",
                    color: "#111",
                    cursor: "pointer",
                  }}>
                  {option.option_text || "Opsi polling kosong"} -{" "}
                  {option.vote_count} vote
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "12px",
          }}>
          <button type="button" onClick={() => handleLike(post.id_post)}>
            <FiThumbsUp size={15} />
            Like ({post.like_count || 0})
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "love")}>
            <FiHeart size={15} />
            {post.love_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "funny")}>
            <span aria-hidden="true">{"\u{1F602}"}</span>
            {post.funny_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "wow")}>
            <span aria-hidden="true">{"\u{1F62E}"}</span>
            {post.wow_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "sad")}>
            <span aria-hidden="true">{"\u{1F622}"}</span>
            {post.sad_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "angry")}>
            <span aria-hidden="true">{"\u{1F621}"}</span>
            {post.angry_count || 0}
          </button>

          <button type="button" onClick={() => handleShare(post.id_post)}>
            <FiShare2 size={15} />
            Share
          </button>

          <button
            type="button"
            onClick={fetchInsight}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiBarChart2 size={16} />
            Insight ({totalInsight})
          </button>
        </div>

        <div style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
          Total Replies: {comments.length}
        </div>

        <section className="post-replies-section">
          <div className="post-replies-header">
            <h4>Replies</h4>
            <span>{comments.length}</span>
          </div>

          {token ? (
            <div className="post-reply-composer">
              <div className="post-reply-input-row">
                <input
                  className="post-reply-input"
                  type="text"
                  placeholder="Tulis reply ke post..."
                  value={replyInputs[postReplyKey] || ""}
                  onChange={(e) =>
                    handleReplyChange(postReplyKey, e.target.value)
                  }
                />
                <button
                  type="button"
                  className="post-reply-icon-button"
                  onClick={() => toggleEmojiPicker(postReplyKey)}>
                  <FiSmile />
                </button>
                <button
                  type="button"
                  className="post-reply-gif-button"
                  onClick={() => toggleGifPicker(postReplyKey)}>
                  GIF
                </button>
                <button
                  type="button"
                  className="post-reply-submit"
                  onClick={() =>
                    handleCreateReply(post.id_post, null, postReplyKey)
                  }>
                  Reply
                </button>
              </div>

              {selectedGifs[postReplyKey]?.preview && (
                <div className="post-reply-gif-preview">
                  <img
                    src={selectedGifs[postReplyKey].preview}
                    alt="GIF preview"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedGif(postReplyKey)}>
                    Hapus GIF
                  </button>
                </div>
              )}

              {showEmojiPicker[postReplyKey] && (
                <div className="post-detail-emoji-picker">
                  <EmojiPicker
                    theme={Theme.DARK}
                    emojiStyle={EmojiStyle.NATIVE}
                    width="100%"
                    height={360}
                    lazyLoadEmojis
                    skinTonesDisabled
                    searchPlaceholder="Cari emote"
                    previewConfig={{ showPreview: false }}
                    onEmojiClick={(emojiData) =>
                      handleReplyChange(
                        postReplyKey,
                        (replyInputs[postReplyKey] || "") + emojiData.emoji,
                      )
                    }
                  />
                </div>
              )}

              <GifPickerModal
                isOpen={!!showGifPicker[postReplyKey]}
                onClose={() => toggleGifPicker(postReplyKey)}
                onSelectGif={(gif) => handleSelectGif(postReplyKey, gif)}
              />
            </div>
          ) : (
            <small className="post-reply-login-note">
              Login untuk membalas post.
            </small>
          )}

          {rootComments.length > 0 ? (
            <div className="post-reply-list">
              {renderCommentTree(comments, rootComments, post.id_post, 0)}
            </div>
          ) : (
            <p className="post-reply-empty">Belum ada reply.</p>
          )}
        </section>
      </div>

      <PostInsightModal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        insight={insight}
      />
      </div>
    </main>
  );
}

export default PostDetail;
