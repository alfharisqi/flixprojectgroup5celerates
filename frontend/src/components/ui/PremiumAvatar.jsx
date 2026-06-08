import blueDiamondIcon from "@/assets/icon/bluediamond-icon.png";
import { resolveMediaUrl } from "@/utils/media";
import "./PremiumAvatar.css";

const getInitial = (name = "User") =>
  String(name).trim().charAt(0).toUpperCase() || "U";

function PremiumAvatar({
  imageUrl,
  name,
  isPremium = false,
  className = "",
  alt,
  ariaHidden = false,
}) {
  const resolvedImageUrl = resolveMediaUrl(imageUrl);
  const classes = [
    "premium-avatar",
    className,
    resolvedImageUrl ? "has-image" : "",
    isPremium ? "is-premium" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden={ariaHidden || undefined}>
      {resolvedImageUrl ? (
        <img
          className="premium-avatar__image"
          src={resolvedImageUrl}
          alt={alt ?? name ?? "Profile"}
        />
      ) : (
        getInitial(name)
      )}

      {isPremium && (
        <span className="premium-avatar__badge" title="Premium">
          <img src={blueDiamondIcon} alt="Premium" />
        </span>
      )}
    </span>
  );
}

export default PremiumAvatar;
