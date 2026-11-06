import { useEffect, useState } from "react"
import { formatLongDate, money } from "../../shared/catalog.js"
import { GALLERY_KINDS } from "../../shared/gallery.js"

const METHODS = { mpesa: "M-Pesa", ecocash: "EcoCash", card: "Card" }

function ReferencePhoto({ id, adminKey }) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let url = ""
    let ignore = false
    fetch(`/api/inspiration/${id}`, { headers: { "x-admin-key": adminKey } })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || ignore) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => {})
    return () => {
      ignore = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, adminKey])

  if (!src) return null
  return <img className="desk-photo" src={src} alt="Reference photo from the client" />
}

function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose a photo."))
      return
    }
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      const longest = Math.max(image.width, image.height)
      const scale = Math.min(1, 1200 / longest)
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.78))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("That photo could not be read. Try a JPG or PNG."))
    }
    image.src = url
  })
}

export default function Studio() {
  const [key, setKey] = useState(() => sessionStorage.getItem("khahliso-key") || "")
  const [draft, setDraft] = useState("")
  const [rows, setRows] = useState(null)
  const [gallery, setGallery] = useState([])
  const [kind, setKind] = useState("Makeup")
  const [caption, setCaption] = useState("")
  const [photo, setPhoto] = useState("")
  const [pendingDelete, setPendingDelete] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const base = import.meta.env.BASE_URL

  async function loadGallery() {
    const response = await fetch("/api/gallery", { cache: "no-store" })
    if (!response.ok) return
    const data = await response.json()
    if (Array.isArray(data)) setGallery(data)
  }

  async function load(nextKey = key) {
    setError("")
    const response = await fetch("/api/bookings", { headers: { "x-admin-key": nextKey } })
    const data = await response.json()
    if (!response.ok) {
      setRows(null)
      setError(data.error || "Could not open the desk.")
      return
    }
    sessionStorage.setItem("khahliso-key", nextKey)
    setKey(nextKey)
    setRows(data)
    loadGallery()
  }

  async function addPhoto(event) {
    event.preventDefault()
    if (busy) return
    if (caption.trim().length < 2) {
      setError("Add a short description of the photo.")
      return
    }
    if (!photo) {
      setError("Choose a photo to upload.")
      return
    }
    setBusy(true)
    setError("")
    const response = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ photo, kind, alt: caption.trim() }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) {
      setError(data.error || "Could not save that photo.")
      return
    }
    setGallery(data)
    setPhoto("")
    setCaption("")
  }

  async function removePhoto(id) {
    if (busy) return
    setBusy(true)
    setError("")
    const response = await fetch(`/api/gallery/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key },
    })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    setPendingDelete("")
    if (!response.ok) {
      setError(data.error || "Could not delete that photo.")
      return
    }
    setGallery(data)
  }

  async function setStatus(id, status) {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      const data = await response.json()
      setError(data.error || "Could not update that booking.")
      return
    }
    load(key)
  }

  return (
    <section className="studio">
      <p className="eyebrow">Studio desk</p>
      <h1>Studio desk</h1>
      <p>Upload photos of the work, and check each booking before the client sits.</p>

      {rows == null ? (
        <form
          className="book-panel narrow"
          onSubmit={(event) => {
            event.preventDefault()
            load(draft || key)
          }}
        >
          <label className="field">
            Studio key
            <input
              type="password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn solid" type="submit">
            Open the desk
          </button>
        </form>
      ) : (
        <>
          {error ? <p className="form-error">{error}</p> : null}
          <section className="gallery-manage">
            <h2>Photos</h2>
            <p>Upload work for the Photos page, or delete a photo you no longer want there.</p>
            <form className="book-panel" onSubmit={addPhoto}>
              <fieldset className="chips">
                <legend>Type</legend>
                {GALLERY_KINDS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={kind === name ? "on" : undefined}
                    aria-pressed={kind === name}
                    onClick={() => setKind(name)}
                  >
                    {name}
                  </button>
                ))}
              </fieldset>
              <label className="field">
                Short description
                <input
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={120}
                  placeholder="Soft glam with a red lip"
                />
              </label>
              <div className="field">
                <span>Photo</span>
                <input
                  id="gallery-photo"
                  className="file-input"
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ""
                    if (!file) return
                    try {
                      setPhoto(await shrinkPhoto(file))
                      setError("")
                    } catch (err) {
                      setError(err.message)
                    }
                  }}
                />
                <label className="btn ghost file-label" htmlFor="gallery-photo">
                  {photo ? "Change photo" : "Choose photo"}
                </label>
                {photo ? (
                  <figure className="reference-preview">
                    <img src={photo} alt="Photo ready to upload" />
                    <button type="button" onClick={() => setPhoto("")}>
                      Remove photo
                    </button>
                  </figure>
                ) : null}
              </div>
              <button className="btn solid" type="submit" disabled={busy}>
                Upload photo
              </button>
            </form>
            {gallery.length === 0 ? (
              <p>No photos on the page yet.</p>
            ) : (
              <div className="gallery-thumbs">
                {gallery.map((item) => (
                  <figure key={item.id}>
                    <img src={`${base}photos/${item.file}`} alt={item.alt} />
                    <figcaption>
                      {item.kind} · {item.alt}
                    </figcaption>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (pendingDelete === item.id) removePhoto(item.id)
                        else setPendingDelete(item.id)
                      }}
                    >
                      {pendingDelete === item.id ? "Yes, remove" : "Delete"}
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </section>
          <h2>Bookings</h2>
          <p className="muted">Match every M-Pesa and EcoCash code against the phone before the client sits.</p>
          {rows.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <div className="desk">
              {rows.map((row) => (
                <article key={row.id}>
                  <header>
                    <strong>{row.id}</strong>
                    <span className={`status ${row.status}`}>{row.status}</span>
                  </header>
                  <p>
                    {row.name} · {row.phone}
                  </p>
                  <p>
                    {row.serviceName} · {formatLongDate(row.date)} · {row.time}
                  </p>
                  <p>
                    Fee R{row.fee} · {METHODS[row.paymentMethod]} · service {money(row.price)} · balance{" "}
                    {row.balance == null ? "in studio" : money(row.balance)}
                  </p>
                  {row.transactionCode ? <p>Code {row.transactionCode} from {row.payerPhone}</p> : null}
                  {row.cardLast4 ? (
                    <p>
                      {row.cardBrand} ···· {row.cardLast4}
                    </p>
                  ) : null}
                  {row.notes ? <p className="muted">{row.notes}</p> : null}
                  {row.hasPhoto ? <ReferencePhoto id={row.id} adminKey={key} /> : null}
                  <div className="desk-actions">
                    {["confirmed", "done", "cancelled"].map((status) => (
                      <button key={status} type="button" onClick={() => setStatus(row.id, status)}>
                        {status}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
