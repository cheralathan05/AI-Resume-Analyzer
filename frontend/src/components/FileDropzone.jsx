import { useRef, useState } from "react";
import "../styles/Upload.css";
import Button from "./Button";
import { UploadIcon, AlertIcon } from "./icons";

/* Accepted resume format (PDF only). */
const ACCEPTED = {
  "application/pdf": ".pdf",
};
const ACCEPTED_EXT = [".pdf"];
const MAX_SIZE_MB = 5;

function isAccepted(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  const byExt = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
  const byType = Boolean(ACCEPTED[file.type]);
  return byExt || byType;
}

/*
 * Drag & drop file selector. Purely client-side: it validates the file
 * type and size, then hands the valid File object up via onSelect.
 * No network/backend calls are made.
 *
 * Props:
 *  - onSelect(file): called with a valid File
 */
function FileDropzone({ onSelect }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function validateAndSelect(file) {
    if (!file) return;

    if (!isAccepted(file)) {
      setError("Unsupported format. Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setError("");
    onSelect(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    validateAndSelect(file);
    // reset so selecting the same file again still fires onChange
    e.target.value = "";
  }

  const dropzoneClass = [
    "dropzone",
    dragging ? "dropzone--active" : "",
    error ? "dropzone--error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={dropzoneClass}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload resume by dropping a file here or browsing"
      >
        <span className="dropzone__icon">
          <UploadIcon width={30} height={30} />
        </span>
        <p className="dropzone__title">
          {dragging ? "Drop your resume here" : "Drag & drop your resume"}
        </p>
        <p className="dropzone__hint">PDF · up to {MAX_SIZE_MB} MB</p>

        <span className="dropzone__divider">OR</span>

        <Button
          variant="secondary"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse Files
        </Button>

        <div className="dropzone__meta">
          <span className="tag tag--brand">.PDF</span>
        </div>

        <input
          ref={inputRef}
          className="dropzone__input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="upload__error" role="alert">
          <AlertIcon width={18} height={18} />
          {error}
        </p>
      )}
    </>
  );
}

export default FileDropzone;
