import { useState, useRef, useEffect } from "react";
import { openDB } from "idb";
import {
  Cloud, Upload, Search, Download, Trash2, Share2,
  FileText, Image, HardDrive, LayoutDashboard,
  Settings, Plus, CheckCircle, X, Clock, Copy, Link2
} from "lucide-react";
import "./App.css";

const DB_NAME = "cloudnest-db";
const DB_VERSION = 2;
const SHARE_OPTIONS = [
  { label: "10 minutes", value: "10m", milliseconds: 10 * 60 * 1000 },
  { label: "1 hour", value: "1h", milliseconds: 60 * 60 * 1000 },
  { label: "24 hours", value: "24h", milliseconds: 24 * 60 * 60 * 1000 },
];

async function getDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("shares")) {
        db.createObjectStore("shares", { keyPath: "id" });
      }
    },
  });
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [shares, setShares] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [dbReady, setDbReady] = useState(false);
  const [sharingFile, setSharingFile] = useState(null);
  const [shareExpiry, setShareExpiry] = useState("1h");
  const [activeTab, setActiveTab] = useState("files");
  const fileInput = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabase() {
      let db;
      try {
        db = await getDatabase();
        const [savedFiles, savedShares] = await Promise.all([
          db.getAll("files"),
          db.getAll("shares"),
        ]);

        if (!cancelled) {
          setFiles(savedFiles);
          setShares(savedShares);
          setDbReady(true);
        }
      } catch (error) {
        console.error("Database setup failed:", error);
        if (!cancelled) setMessage("Could not load local storage. Please refresh and try again.");
      } finally {
        db?.close();
      }
    }

    loadDatabase();
    return () => { cancelled = true; };
  }, []);

  async function uploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    let db;
    try {
      db = await getDatabase();
      const newFiles = selected.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        date: new Date().toLocaleDateString(),
        addedAt: Date.now(),
      }));

      const tx = db.transaction("files", "readwrite");
      for (const item of newFiles) await tx.store.put(item);
      await tx.done;

      setFiles((current) => [...current, ...newFiles]);
      setMessage(`${newFiles.length} file${newFiles.length === 1 ? "" : "s"} saved in this browser.`);
    } catch (error) {
      console.error("File save failed:", error);
      setMessage("Could not save files. Check available browser storage and try again.");
    } finally {
      db?.close();
      event.target.value = "";
    }
  }

  function downloadFile(item) {
    if (!item?.file) {
      setMessage("The stored file data is unavailable. Try uploading the file again.");
      return;
    }
    const url = URL.createObjectURL(item.file);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteFile(id) {
    let db;
    try {
      db = await getDatabase();
      const tx = db.transaction(["files", "shares"], "readwrite");
      await tx.objectStore("files").delete(id);

      const existingShares = await tx.objectStore("shares").getAll();
      for (const share of existingShares) {
        if (share.fileId === id) await tx.objectStore("shares").delete(share.id);
      }
      await tx.done;

      setFiles((current) => current.filter((file) => file.id !== id));
      setShares((current) => current.filter((share) => share.fileId !== id));
      setMessage("File deleted from this browser.");
    } catch (error) {
      console.error("File deletion failed:", error);
      setMessage("Could not delete the file. Please try again.");
    } finally {
      db?.close();
    }
  }

  function openShareDialog(item) {
    setSharingFile(item);
    setShareExpiry("1h");
  }

  async function createShare() {
    if (!sharingFile) return;
    const option = SHARE_OPTIONS.find((item) => item.value === shareExpiry);
    if (!option) return;

    const share = {
      id: crypto.randomUUID(),
      fileId: sharingFile.id,
      fileName: sharingFile.name,
      expiresAt: Date.now() + option.milliseconds,
      createdAt: Date.now(),
      // Local-only reference; not a public or internet-accessible URL.
      localCode: crypto.randomUUID().slice(0, 8),
    };

    let db;
    try {
      db = await getDatabase();
      await db.put("shares", share);
      setShares((current) => [share, ...current]);
      setSharingFile(null);
      setActiveTab("shares");
      setMessage(`Local demo share created for ${option.label}. It is not a public link.`);
    } catch (error) {
      console.error("Share creation failed:", error);
      setMessage("Could not create the demo share.");
    } finally {
      db?.close();
    }
  }

  async function deleteShare(id) {
    let db;
    try {
      db = await getDatabase();
      await db.delete("shares", id);
      setShares((current) => current.filter((share) => share.id !== id));
      setMessage("Demo share removed.");
    } catch (error) {
      console.error("Share deletion failed:", error);
      setMessage("Could not remove the demo share.");
    } finally {
      db?.close();
    }
  }

  function copyDemoCode(share) {
    const text = `CloudNest local demo share\nFile: ${share.fileName}\nDemo code: ${share.localCode}\nExpires: ${new Date(share.expiresAt).toLocaleString()}\nThis is not a public download link.`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => setMessage("Demo share details copied. This is not a public link."))
        .catch(() => setMessage(text));
    } else {
      setMessage(text);
    }
  }

  const now = Date.now();
  const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );
  const activeShares = shares.filter((share) => share.expiresAt > now);
  const expiredShares = shares.filter((share) => share.expiresAt <= now);
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const imageCount = files.filter((file) => (file.type || "").startsWith("image/")).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><Cloud size={28} /> CloudNest</div>
        <p className="side-label">WORKSPACE</p>
        <button className={`nav ${activeTab === "files" ? "active" : ""}`} onClick={() => setActiveTab("files")}><LayoutDashboard /> Dashboard</button>
        <button className={`nav ${activeTab === "files" ? "" : ""}`} onClick={() => { setActiveTab("files"); setSearch(""); }}><HardDrive /> My Files</button>
        <button className={`nav ${activeTab === "shares" ? "active" : ""}`} onClick={() => setActiveTab("shares")}><Share2 /> Shared Files</button>

        <div className="storage">
          <HardDrive size={20} />
          <h4>Storage Overview</h4>
          <div className="progress"><div style={{ width: `${Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100)}%` }} /></div>
          <p>{formatBytes(totalSize)} used</p>
          <small>Local browser storage</small>
        </div>

        <div className="sidebar-bottom">
          <button className="nav" onClick={() => setMessage("This is a local demo. Cloud account settings are not connected.")}><Settings /> Settings</button>
          <div className="user"><div className="avatar">U</div><div><b>Demo User</b><small>Local account</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace / <b>{activeTab === "files" ? "Dashboard" : "Shared Files"}</b></span>
          <span className="status"><i /> Local Demo</span>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <small>YOUR PERSONAL CLOUD</small>
              <h1>{activeTab === "files" ? "My Files" : "Shared Files"}</h1>
              <p>{activeTab === "files" ? "Manage and organize your files in one place." : "Review local demo shares and their expiry times."}</p>
            </div>
            {activeTab === "files" && <button className="upload-btn" onClick={() => fileInput.current?.click()}><Plus size={19} /> Upload Files</button>}
            <input ref={fileInput} type="file" multiple hidden onChange={uploadFiles} />
          </div>

          <div className="notice">
            <CheckCircle size={20} />
            <div><b>Local storage mode</b><p>Your files are stored in this browser. AWS is not connected, and demo shares are not public links.</p></div>
          </div>

          {message && <div className="message">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></button></div>}

          {activeTab === "files" ? (
            <>
              <div className="stats">
                <div className="stat"><div>Total Files <FileText /></div><h2>{files.length}</h2><p>Files in your workspace</p></div>
                <div className="stat"><div>Storage Used <HardDrive /></div><h2>{formatBytes(totalSize)}</h2><p>Total file size</p></div>
                <div className="stat"><div>Images <Image /></div><h2>{imageCount}</h2><p>Image files</p></div>
              </div>

              <section className="files-panel">
                <div className="panel-head">
                  <div><h2>All Files</h2><p>Your uploaded documents and files</p></div>
                  <div className="search"><Search size={18} /><input placeholder="Search files..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                </div>
                {!dbReady && <p>Loading local files…</p>}
                {visibleFiles.length === 0 ? (
                  <div className="empty"><div><Cloud size={34} /></div><h3>No files yet</h3><p>Upload your first file to get started.</p><button className="upload-btn" onClick={() => fileInput.current?.click()}><Upload size={18} /> Choose Files</button></div>
                ) : (
                  <div className="table-scroll"><table><thead><tr><th>FILE NAME</th><th>SIZE</th><th>DATE ADDED</th><th>ACTIONS</th></tr></thead><tbody>
                    {visibleFiles.map((item) => <tr key={item.id}>
                      <td><div className="filename"><div className="file-icon"><FileText /></div>{item.name}</div></td>
                      <td>{formatBytes(item.size)}</td><td>{item.date}</td>
                      <td><div className="actions">
                        <button title="Download" aria-label={`Download ${item.name}`} onClick={() => downloadFile(item)}><Download /></button>
                        <button title="Create time-limited demo share" aria-label={`Share ${item.name}`} onClick={() => openShareDialog(item)}><Share2 /></button>
                        <button title="Delete" aria-label={`Delete ${item.name}`} onClick={() => deleteFile(item.id)}><Trash2 /></button>
                      </div></td>
                    </tr>)}
                  </tbody></table></div>
                )}
              </section>
            </>
          ) : (
            <section className="files-panel">
              <div className="panel-head"><div><h2>Sharing links (local demo)</h2><p>These are local records, not public internet links.</p></div></div>
              {activeShares.length === 0 && expiredShares.length === 0 ? (
                <div className="empty"><div><Share2 size={34} /></div><h3>No shares yet</h3><p>Use the share icon beside a file to create a demo share.</p><button className="upload-btn" onClick={() => setActiveTab("files")}>Go to My Files</button></div>
              ) : (
                <div className="table-scroll"><table><thead><tr><th>FILE</th><th>STATUS</th><th>EXPIRES</th><th>ACTIONS</th></tr></thead><tbody>
                  {[...activeShares, ...expiredShares].map((share) => {
                    const isExpired = share.expiresAt <= now;
                    return <tr key={share.id}>
                      <td><div className="filename"><div className="file-icon"><Link2 /></div>{share.fileName}</div><small>Demo code: {share.localCode}</small></td>
                      <td>{isExpired ? "Expired" : "Active (local only)"}</td>
                      <td>{new Date(share.expiresAt).toLocaleString()}</td>
                      <td><div className="actions">
                        {!isExpired && <button title="Copy demo details" aria-label="Copy demo share details" onClick={() => copyDemoCode(share)}><Copy /></button>}
                        <button title="Remove share" aria-label="Remove share" onClick={() => deleteShare(share.id)}><Trash2 /></button>
                      </div></td>
                    </tr>;
                  })}
                </tbody></table></div>
              )}
            </section>
          )}

          {sharingFile && (
            <div className="share-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSharingFile(null); }}>
              <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
                <div className="share-dialog-head"><div><h2 id="share-title">Share file (demo)</h2><p>{sharingFile.name}</p></div><button aria-label="Close dialog" onClick={() => setSharingFile(null)}><X /></button></div>
                <div className="share-warning"><Clock size={20} /><p>This creates a local demo record with an expiry time. It does not create a public link or prevent someone from accessing the original local file.</p></div>
                <label htmlFor="share-expiry">Link expiry</label>
                <select id="share-expiry" value={shareExpiry} onChange={(event) => setShareExpiry(event.target.value)}>
                  {SHARE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <div className="share-dialog-actions"><button className="nav" onClick={() => setSharingFile(null)}>Cancel</button><button className="upload-btn" onClick={createShare}><Share2 size={17} /> Create demo share</button></div>
              </section>
            </div>
          )}

          <footer>CloudNest — Cloud-Based File Storage System</footer>
        </section>
      </main>
    </div>
  );
}
