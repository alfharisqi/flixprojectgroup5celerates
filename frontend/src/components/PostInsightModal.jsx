function PostInsightModal({ isOpen, onClose, insight }) {
  if (!isOpen || !insight) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "14px",
          padding: "20px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Post Insight</h2>
          <button type="button" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <div><strong>Title:</strong> {insight.title}</div>
          <div><strong>Total Insight:</strong> {insight.total_insight || 0}</div>
          <div><strong>Views:</strong> {insight.view_count || 0}</div>
          <div><strong>Like:</strong> {insight.total_likes}</div>
          <div><strong>Replies:</strong> {insight.total_replies}</div>
          <div><strong>Shares:</strong> {insight.total_shares}</div>
          <div><strong>Total Reactions:</strong> {insight.reactions.total_reactions}</div>
          <div><strong>Love:</strong> {insight.reactions.love_count}</div>
          <div><strong>Funny:</strong> {insight.reactions.funny_count}</div>
          <div><strong>Wow:</strong> {insight.reactions.wow_count}</div>
          <div><strong>Sad:</strong> {insight.reactions.sad_count}</div>
          <div><strong>Angry:</strong> {insight.reactions.angry_count}</div>
        </div>

        {insight.post_type === "poll" && insight.poll && (
          <div style={{ marginTop: "18px" }}>
            <h3 style={{ marginBottom: "10px" }}>Polling Insight</h3>
            <div><strong>Total Vote:</strong> {insight.poll.total_poll_votes}</div>

            <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
              {insight.poll.options.map((option) => (
                <div
                  key={option.id_option}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "10px"
                  }}
                >
                  {option.option_text} — {option.vote_count} vote
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostInsightModal;
