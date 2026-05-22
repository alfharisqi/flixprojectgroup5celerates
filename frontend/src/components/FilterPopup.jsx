import { useEffect } from "react";
import { FaRegTimesCircle } from "react-icons/fa";
import "./FilterPopup.css";

function FilterSection({ title, options, value, onSelect }) {
  return (
    <section className="filter-popup__section">
      <h3>{title}</h3>
      <div className="filter-popup__chips">
        {options.map((option) => (
          <button
            className={value === option.value ? "is-active" : ""}
            type="button"
            key={option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterPopup({
  open,
  title = "Filter Watchlist",
  values,
  genreOptions,
  platformOptions,
  sortOptions,
  onChange,
  onClose,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const updateFilter = (key, value) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <div
      className="filter-popup-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="filter-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-popup-title"
      >
        <div className="filter-popup__content">
          <header className="filter-popup__header">
            <h2 id="filter-popup-title">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Tutup filter">
              <FaRegTimesCircle />
            </button>
          </header>

          <div className="filter-popup__divider" />

          <FilterSection
            title="Genre"
            options={genreOptions}
            value={values.genre}
            onSelect={(value) => updateFilter("genre", value)}
          />

          <div className="filter-popup__divider" />

          <FilterSection
            title="Platform"
            options={platformOptions}
            value={values.platform}
            onSelect={(value) => updateFilter("platform", value)}
          />

          <div className="filter-popup__divider" />

          <FilterSection
            title="Urutkan Berdasarkan"
            options={sortOptions}
            value={values.sort}
            onSelect={(value) => updateFilter("sort", value)}
          />
        </div>
      </div>
    </div>
  );
}

export default FilterPopup;
