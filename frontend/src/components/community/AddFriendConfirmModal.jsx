import { resolveMediaUrl } from "@/utils/media";
import "./AddFriendConfirmModal.css";

function AddFriendConfirmModal({ open, user, saving, onCancel, onConfirm }) {
  if (!open || !user) {
    return null;
  }

  const avatarUrl = resolveMediaUrl(user.profile_image_url);
  const initial = (user.username || "F").slice(0, 1).toUpperCase();

  return (
    <div className="add-friend-modal" role="presentation" onClick={onCancel}>
      <div
        className="add-friend-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-friend-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className={avatarUrl ? "add-friend-modal__avatar has-image" : "add-friend-modal__avatar"}>
          {avatarUrl ? <img src={avatarUrl} alt={user.username || "User FLIX"} /> : initial}
        </span>

        <div className="add-friend-modal__content">
          <h2 id="add-friend-title">
            Tambahkan <strong>{user.username || "User FLIX"}</strong> sebagai teman?
          </h2>
          <p>Permintaan pertemanan akan dikirim ke profile user ini.</p>

          <div className="add-friend-modal__actions">
            <button type="button" onClick={onCancel} disabled={saving}>
              Batal
            </button>
            <button type="button" onClick={onConfirm} disabled={saving}>
              {saving ? "Mengirim..." : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddFriendConfirmModal;
