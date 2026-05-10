import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { FiSmile } from "react-icons/fi";
import GifPickerModal from "../components/GifPickerModal";
import PostInsightModal from "../components/PostInsightModal";
import RichContent from "../components/RichContent";

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

  useEffect(() => {
    fetchPost();
    fetchComments();
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
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat reply");
    }
  };

  const getChildComments = (allComments, parentId) => {
    return allComments.filter(
      (comment) => Number(comment.parent_comment_id) === Number(parentId),
    );
  };

  const renderCommentTree = (allComments, items, postId, level = 0) => {
    return items.map((comment) => {
      const childComments = getChildComments(allComments, comment.id_comment);
      const inputKey = `comment-${comment.id_comment}`;

      return (
        <div
          key={comment.id_comment}
          style={{
            marginLeft: `${level * 20}px`,
            marginTop: "10px",
          }}>
          <div
            style={{
              background: "#f7f7f7",
              padding: "10px",
              borderRadius: "6px",
            }}>
            <strong>{comment.username}</strong>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {new Date(comment.created_at).toLocaleString()}
            </div>

            <div style={{ margin: "6px 0 8px 0" }}>
              <RichContent html={comment.content} />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {token && (
                <button type="button" onClick={() => toggleReplyBox(inputKey)}>
                  {activeReplyBox[inputKey] ? "Tutup Balasan" : "Balas"}
                </button>
              )}

              {childComments.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleChildReplies(comment.id_comment)}>
                  {showChildReplies[comment.id_comment]
                    ? `Hide Replies (${childComments.length})`
                    : `Show Replies (${childComments.length})`}
                </button>
              )}
            </div>

            {activeReplyBox[inputKey] && token && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Tulis balasan..."
                    value={replyInputs[inputKey] || ""}
                    onChange={(e) =>
                      handleReplyChange(inputKey, e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleEmojiPicker(inputKey)}>
                    <FiSmile />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleGifPicker(inputKey)}>
                    GIF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateReply(postId, comment.id_comment, inputKey)
                    }>
                    Kirim
                  </button>
                </div>

                {selectedGifs[inputKey]?.preview && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={selectedGifs[inputKey].preview}
                      alt="GIF preview"
                      style={{
                        maxWidth: "180px",
                        borderRadius: "10px",
                        display: "block",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedGif(inputKey)}
                      style={{ marginTop: "8px" }}>
                      Hapus GIF
                    </button>
                  </div>
                )}

                {showEmojiPicker[inputKey] && (
                  <div style={{ marginTop: "10px" }}>
                    <EmojiPicker
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
          </div>

          {showChildReplies[comment.id_comment] &&
            renderCommentTree(allComments, childComments, postId, level + 1)}
        </div>
      );
    });
  };

  if (!post) {
    return <div style={{ padding: "24px" }}>Post tidak ditemukan.</div>;
  }

  const rootComments = comments.filter((comment) => !comment.parent_comment_id);
  const postReplyKey = `post-${post.id_post}`;

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "16px" }}>
        ← Kembali
      </button>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          background: "#fff",
        }}>
        <h2 style={{ margin: 0 }}>{post.title || "Untitled Post"}</h2>

        <div style={{ marginTop: "8px", color: "#666", fontSize: "14px" }}>
          by {post.username} • {new Date(post.created_at).toLocaleString()}
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
                  {option.option_text || "Opsi polling kosong"} —{" "}
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
            👍 Like ({post.like_count || 0})
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "love")}>
            ❤️ {post.love_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "funny")}>
            😂 {post.funny_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "wow")}>
            😮 {post.wow_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "sad")}>
            😢 {post.sad_count || 0}
          </button>

          <button
            type="button"
            onClick={() => handleReaction(post.id_post, "angry")}>
            😡 {post.angry_count || 0}
          </button>

          <button type="button" onClick={() => handleShare(post.id_post)}>
            🔗 Share
          </button>

          <button type="button" onClick={fetchInsight}>
            📈 Insight
          </button>
        </div>

        <div style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
          💬 Total Replies: {comments.length}
        </div>

        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid #eee",
          }}>
          <h4 style={{ marginBottom: "12px" }}>Replies</h4>

          {token ? (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Tulis reply ke post..."
                  value={replyInputs[postReplyKey] || ""}
                  onChange={(e) =>
                    handleReplyChange(postReplyKey, e.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggleEmojiPicker(postReplyKey)}>
                  <FiSmile />
                </button>
                <button
                  type="button"
                  onClick={() => toggleGifPicker(postReplyKey)}>
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCreateReply(post.id_post, null, postReplyKey)
                  }>
                  Reply
                </button>
              </div>

              {selectedGifs[postReplyKey]?.preview && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={selectedGifs[postReplyKey].preview}
                    alt="GIF preview"
                    style={{
                      maxWidth: "180px",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedGif(postReplyKey)}
                    style={{ marginTop: "8px" }}>
                    Hapus GIF
                  </button>
                </div>
              )}

              {showEmojiPicker[postReplyKey] && (
                <div style={{ marginTop: "10px" }}>
                  <EmojiPicker
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
            <small style={{ display: "block", marginBottom: "12px" }}>
              Login untuk membalas post.
            </small>
          )}

          {rootComments.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
              {renderCommentTree(comments, rootComments, post.id_post, 0)}
            </div>
          ) : (
            <p style={{ color: "#777" }}>Belum ada reply.</p>
          )}
        </div>
      </div>

      <PostInsightModal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        insight={insight}
      />
    </div>
  );
}

export default PostDetail;
