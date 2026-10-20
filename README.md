# CloudNest — Cloud-Based File Storage System

CloudNest is a file-management web application developed as a college project. It provides a React dashboard and a Node.js/Express backend for uploading, listing, downloading, deleting, and sharing files through expiring links.

## Features

- **Dashboard:** View total files, storage usage, and image count.
- **File upload:** Upload files through the web interface.
- **File listing:** View uploaded files and their sizes.
- **Search:** Find files by name.
- **Download:** Download stored files.
- **Delete:** Remove files from backend storage.
- **Expiring share links:** Generate unique links that expire after 10 minutes, 1 hour, or 24 hours.
- **Local backend storage:** Store uploaded files on the computer running the backend.

## Technology Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- File uploads: Multer
- Cross-origin requests: CORS
- Sharing tokens: Node.js Crypto
- Version control: Git and GitHub
- Frontend deployment: Vercel

## Project Structure

```text
cloud-file-storage/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── uploads/             # Created for uploaded files
├── server.cjs
├── test-upload.html
├── package.json
├── package-lock.json
└── README.md
```

## Run the Project Locally

### Prerequisites

Install Node.js and npm.

### 1. Clone the repository

```bash
git clone https://github.com/Goutamcode12/cloudnest-file-storage.git
cd cloudnest-file-storage
npm install
```

### 2. Start the backend

Open a terminal in the project folder:

```bash
npm run server
```

The backend runs at:

`http://localhost:5000`

### 3. Start the frontend

Open a second terminal in the same project folder:

```bash
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173`

Keep both terminals running while using the local application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check backend status |
| POST | `/api/files` | Upload a file |
| GET | `/api/files` | List stored files |
| GET | `/api/files/:name` | Download a file |
| DELETE | `/api/files/:name` | Delete a file |
| POST | `/api/shares` | Create an expiring share link |
| GET | `/api/share/:token` | Download a file through a share link |

## Share Link Expiry

The backend supports share-link durations of:

- 10 minutes
- 1 hour
- 24 hours

Share records are held in memory. Existing share links are invalidated when the backend restarts. The backend also checks whether the file still exists before serving a shared download.

## Current Limitations

- Uploaded files are stored on the backend computer, not in AWS S3.
- Local share links use `localhost` and are not public internet links.
- Share records are not persistent across backend restarts.
- Authentication, user accounts, and access control have not yet been implemented.
- The deployed frontend cannot access the local backend from other devices.
- AWS infrastructure, infrastructure-as-code, automated deployment, monitoring, and budget alerts have not yet been integrated into the application.

## Future Enhancements

- Integrate AWS S3 for cloud file storage.
- Add authentication and user-specific file access.
- Store file metadata and sharing records in a database.
- Deploy the backend to a publicly accessible hosting platform.
- Add automated deployment and monitoring.
- Improve security, validation, and error handling.

## Repository

GitHub: https://github.com/Goutamcode12/cloudnest-file-storage

## Project Status

The local prototype supports the core file-management operations and expiring share links. Cloud storage and production deployment remain future implementation tasks.
