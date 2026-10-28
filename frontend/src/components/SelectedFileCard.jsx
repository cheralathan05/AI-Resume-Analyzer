import "../styles/Upload.css";
import { FileIcon, TrashIcon } from "./icons";

/* Human-readable file size from bytes. */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* Extension label (e.g. "PDF") derived from the file name. */
function extLabel(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "FILE";
}

/*
 * Card that previews the currently selected resume file with a
 * file-size indicator and a remove button.
 *
 * Props:
 *  - file:     the selected File object
 *  - onRemove: clears the selection
 */
function SelectedFileCard({ file, onRemove }) {
  if (!file) return null;

  return (
    <div className="file-card animate-up">
      <span className="file-card__icon">
        <FileIcon width={26} height={26} />
      </span>

      <div className="file-card__info">
        <div className="file-card__name" title={file.name}>
          {file.name}
        </div>
        <div className="file-card__sub">
          <span>{extLabel(file.name)}</span>
          <span className="file-card__dot" />
          <span>{formatSize(file.size)}</span>
        </div>
      </div>

      <button
        type="button"
        className="file-card__remove"
        onClick={onRemove}
        aria-label="Remove selected file"
        title="Remove file"
      >
        <TrashIcon width={18} height={18} />
      </button>
    </div>
  );
}

export default SelectedFileCard;
