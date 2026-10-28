# AI Resume Analyzer — Backend

Production-ready Express backend for the AI Resume Analyzer. It exposes a
health check and a resume **file upload** endpoint. It deliberately does **not**
parse resumes, run ATS logic, or use any AI — it only validates and stores the
uploaded file and records its metadata.

## Tech stack

- **Express** — HTTP server and routing
- **MongoDB + Mongoose** — stores upload metadata
- **Multer** — multipart file uploads to local disk
- **dotenv** — environment configuration
- **cors** — cross-origin access for the frontend
- **helmet** — secure HTTP headers
- **morgan** — request logging

## Getting started

```bash
cd backend
npm install
cp .env.example .env   # then edit values as needed
npm run dev            # or: npm start
```

The server starts on `http://localhost:5000` by default. If MongoDB is not
reachable, the API still runs — uploads are saved to disk and metadata
persistence is skipped.

## Environment variables

See `.env.example`. Key values:

| Variable             | Default (development only)                       | Description                                        |
| -------------------- | ------------------------------------------------ | -------------------------------------------------- |
| `PORT`               | `5000`                                           | HTTP port                                          |
| `NODE_ENV`           | `development`                                    | `development` or `production`                      |
| `MONGODB_URI`        | `mongodb://127.0.0.1:27017/ai-resume-analyzer`   | MongoDB connection string (optional/best-effort)   |
| `CORS_ORIGIN`        | `http://localhost:5173`                          | Comma-separated allowed origins — **required in production** |
| `MAX_UPLOAD_SIZE`    | `5242880` (5 MB)                                 | Max upload size in bytes                           |
| `UPLOAD_DIR`         | `src/uploads`                                    | Where uploaded files are stored on disk            |
| `PARSER_SERVICE_URL` | `http://localhost:8000`                          | Base URL of the FastAPI parser — **required in production** |
| `PARSER_TIMEOUT_MS`  | `30000`                                          | Parser request timeout (ms); positive number       |

> **Production configuration.** The localhost defaults above are applied **only**
> when `NODE_ENV` is not `production`. When `NODE_ENV=production`, the server
> validates its configuration on startup and **refuses to boot** (with a clear
> error listing what's missing) unless `PARSER_SERVICE_URL` and `CORS_ORIGIN`
> are set explicitly. This prevents a deployed backend from silently talking to
> `localhost` services that don't exist in the target environment.

## API

### `GET /api/health`

Liveness probe.

**Response `200`**

```json
{ "status": "ok" }
```

### `POST /api/upload`

Uploads a single **PDF** file.

- Content type: `multipart/form-data`
- Form field name: `resume`

**Response `201`**

```json
{
  "success": true,
  "filename": "resume-1718000000000-ab12cd34ef56.pdf",
  "size": 24576,
  "mimetype": "application/pdf"
}
```

**Error response (example `400`)**

```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

#### Example with curl

```bash
curl -F "resume=@/path/to/resume.pdf" http://localhost:5000/api/upload
```

## Project structure

```
backend/
├── src/
│   ├── config/        # env loading + MongoDB connection
│   ├── controllers/   # request handlers (health, upload)
│   ├── middleware/    # multer upload, error + 404 handlers, ApiError
│   ├── models/        # mongoose schemas (Upload metadata)
│   ├── routes/        # route definitions mounted under /api
│   ├── services/      # business logic (persist upload metadata)
│   ├── uploads/       # stored files (git-ignored)
│   ├── app.js         # Express app: middleware + routes wiring
│   └── server.js      # bootstraps DB + HTTP server, graceful shutdown
├── .env.example
├── package.json
└── README.md
```

## Notes

- Resume parsing, ATS scoring, and AI features are intentionally out of scope.
- Only PDF files are accepted; other files are rejected before being written.
- Uploaded files are stored under `src/uploads/` with collision-free names.
```
