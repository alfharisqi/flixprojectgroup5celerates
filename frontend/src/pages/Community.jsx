import { useEffect, useState } from "react";
import axios from "axios";

function Community() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [comments, setComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPosts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts`
      );
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

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setContent("");
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat post");
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
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus post");
    }
  };

  const handleReplyChange = (postId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleCreateReply = async (postId) => {
    try {
      const replyText = replyInputs[postId];

      if (!replyText || replyText.trim() === "") {
        alert("Reply tidak boleh kosong");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/comments/${postId}`,
        { content: replyText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReplyInputs((prev) => ({
        ...prev,
        [postId]: ""
      }));

      fetchComments(postId);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat reply");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Community Post</h1>

      {token ? (
        <form onSubmit={handleCreatePost} style={{ marginBottom: "24px" }}>
          <textarea
            placeholder="Tulis opini atau rekomendasi film..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              marginBottom: "12px"
            }}
          />
          <button type="submit">Buat Post</button>
        </form>
      ) : (
        <p>Login dulu untuk membuat post.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.map((post) => {
          const canDelete =
            user &&
            (
              user.role === "admin" ||
              user.role === "moderator" ||
              Number(user.id_user) === Number(post.id_user)
            );

          return (
            <div
              key={post.id_post}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                background: "#fff"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "12px"
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{post.username}</h3>
                  <small>{new Date(post.created_at).toLocaleString()}</small>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDeletePost(post.id_post)}
                    style={{
                      background: "crimson",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>

              <p style={{ marginTop: "12px" }}>{post.content}</p>

              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                <h4 style={{ marginBottom: "12px" }}>Replies</h4>

                {(comments[post.id_post] || []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                    {(comments[post.id_post] || []).map((comment) => (
                      <div
                        key={comment.id_comment}
                        style={{
                          background: "#f7f7f7",
                          padding: "10px",
                          borderRadius: "6px"
                        }}
                      >
                        <strong>{comment.username}</strong>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </div>
                        <p style={{ margin: "6px 0 0 0" }}>{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#777" }}>Belum ada reply.</p>
                )}

                {token ? (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <input
                      type="text"
                      placeholder="Tulis reply..."
                      value={replyInputs[post.id_post] || ""}
                      onChange={(e) =>
                        handleReplyChange(post.id_post, e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "6px"
                      }}
                    />
                    <button onClick={() => handleCreateReply(post.id_post)}>
                      Reply
                    </button>
                  </div>
                ) : (
                  <small>Login untuk membalas post.</small>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Community;