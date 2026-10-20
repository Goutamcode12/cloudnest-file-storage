
import { useEffect, useRef, useState } from "react";
import {
  Cloud, Upload, Search, Download, Trash2, Share2,
  FileText, Image as ImageIcon, HardDrive, LayoutDashboard,
  Settings, Plus, CheckCircle, X
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000/api/files";
const SHARE_API = "http://localhost:5000/api/shares";

export default function App() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpires, setShareExpires] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInput = useRef(null);

  async function loadFiles() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load files");

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function uploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(API, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }
      }

      setMessage("File upload successful!");
      setShareUrl("");
      setShareExpires("");
      await loadFiles();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function downloadFile(file) {
    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(file.name)}`
      );

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.name;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(error);
      setMessage("Could not download file.");
    }
  }

  async function deleteFile(file) {
    if (!window.confirm(`Delete ${file.name}?`)) return;

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(file.name)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Delete failed");
      }

      setMessage("File deleted successfully!");
      setShareUrl("");
      setShareExpires("");
      await loadFiles();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Could not delete file.");
    }
  }

  async function shareFile(file) {
    const choice = window.prompt(
      "Choose link expiry:\n10 = 10 minutes\n60 = 1 hour\n1440 = 24 hours",
      "10"
    );

    if (choice === null) return;

    const expiresInMinutes = Number(choice);

    if (![10, 60, 1440].includes(expiresInMinutes)) {
      setMessage("Please enter 10, 60, or 1440.");
      setShareUrl("");
      setShareExpires("");
      return;
    }

    try {
      const response = await fetch(SHARE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          expiresInMinutes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create share link.");
      }

      setShareUrl(result.url);
      setShareExpires(
        new Date(result.expiresAt).toLocaleString()
      );
      setMessage("Share link created successfully!");

      try {
        await navigator.clipboard.writeText(result.url);
      } catch {
        // The link remains visible if automatic copying is unavailable.
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Could not create share link.");
      setShareUrl("");
      setShareExpires("");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Share link copied to clipboard!");
    } catch (error) {
      console.error(error);
      setMessage("Copy failed. Select and copy the link manually.");
    }
  }

  const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  const size = files.reduce((sum, file) => sum + file.size, 0);

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function clearMessage() {
    setMessage("");
    setShareUrl("");
    setShareExpires("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Cloud size={28} /> CloudNest
        </div>

        <p className="side-label">WORKSPACE</p>

        <button className="nav active">
          <LayoutDashboard /> Dashboard
        </button>

        <button className="nav" onClick={() => setSearch("")}>
          <HardDrive /> My Files
        </button>

        <button
          className="nav"
          onClick={() => {
            setMessage("Create a share link using the Share icon beside a file.");
            setShareUrl("");
            setShareExpires("");
          }}
        >
          <Share2 /> Shared Files
        </button>

        <div className="storage">
          <HardDrive size={20} />
          <h4>Storage Overview</h4>
          <div className="progress">
            <div
              style={{
                width: `${Math.min(
                  (size / (100 * 1024 * 1024)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p>{formatSize(size)} used</p>
          <small>Local backend storage</small>
        </div>

        <div className="sidebar-bottom">
          <button
            className="nav"
            onClick={() => setMessage("CloudNest local backend settings.")}
          >
            <Settings /> Settings
          </button>

          <div className="user">
            <div className="avatar">U</div>
            <div>
              <b>Demo User</b>
              <small>Local account</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>
            Workspace / <b>Dashboard</b>
          </span>
          <span className="status">
            <i /> Local Backend
          </span>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <small>YOUR PERSONAL CLOUD</small>
              <h1>My Files</h1>
              <p>Manage and organize your files in one place.</p>
            </div>

            <button
              className="upload-btn"
              onClick={() => fileInput.current?.click()}
            >
              <Plus size={19} /> Upload Files
            </button>

            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={uploadFiles}
            />
          </div>

          <div className="notice">
            <CheckCircle size={20} />
            <div>
              <b>Local backend mode</b>
              <p>
                Files are saved on the computer running the backend.
                AWS is not connected.
              </p>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div>
                Total Files <FileText />
              </div>
              <h2>{files.length}</h2>
              <p>Files in your workspace</p>
            </div>

            <div className="stat">
              <div>
                Storage Used <HardDrive />
              </div>
              <h2>{formatSize(size)}</h2>
              <p>Total file size</p>
            </div>

            <div className="stat">
              <div>
                Images <ImageIcon />
              </div>
              <h2>
                {
                  files.filter((file) =>
                    /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)
                  ).length
                }
              </h2>
              <p>Image files</p>
            </div>
          </div>

          <section className="files-panel">
            <div className="panel-head">
              <div>
                <h2>All Files</h2>
                <p>Your uploaded documents and files</p>
              </div>

              <div className="search">
                <Search size={18} />
                <input
                  placeholder="Search files..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className="message">
                <div>{message}</div>

                {shareUrl && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <b>Expires:</b> {shareExpires}
                    </div>

                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#315efb",
                        overflowWrap: "anywhere",
                        textDecoration: "underline",
                      }}
                    >
                      Open shared file
                    </a>

                    <button
                      type="button"
                      onClick={copyShareLink}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                )}

                <button onClick={clearMessage} title="Close message">
                  <X size={16} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="empty">
                <p>Loading files...</p>
              </div>
            ) : visibleFiles.length === 0 ? (
              <div className="empty">
                <div>
                  <Cloud size={34} />
                </div>
                <h3>No files yet</h3>
                <p>Upload your first file to get started.</p>
                <button
                  className="upload-btn"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={18} /> Choose Files
                </button>
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>FILE NAME</th>
                      <th>SIZE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleFiles.map((file) => (
                      <tr key={file.name}>
                        <td>
                          <div className="filename">
                            <div className="file-icon">
                              <FileText />
                            </div>
                            {file.name}
                          </div>
                        </td>

                        <td>{formatSize(file.size)}</td>

                        <td>
                          <div className="actions">
                            <button
                              title="Download"
                              onClick={() => downloadFile(file)}
                            >
                              <Download />
                            </button>

                            <button
                              title="Create share link"
                              onClick={() => shareFile(file)}
                            >
                              <Share2 />
                            </button>

                            <button
                              title="Delete"
                              onClick={() => deleteFile(file)}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer>
            CloudNest — Cloud-Based File Storage System
          </footer>
        </section>
      </main>
    </div>
  );
}
