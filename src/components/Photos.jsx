import { useEffect, useState } from "react"
import { FACEBOOK, FACEBOOK_NAME, INSTAGRAM, INSTAGRAM_HANDLE, TIKTOK } from "../../shared/catalog.js"
import { GALLERY, galleryRows } from "../../shared/gallery.js"
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./Icons.jsx"

const FILTERS = ["All", "Makeup", "Nails", "Installs"]

export default function Photos() {
  const [photos, setPhotos] = useState(GALLERY)
  const [filter, setFilter] = useState("All")
  const [active, setActive] = useState(null)
  const base = import.meta.env.BASE_URL
  const shown = filter === "All" ? photos : photos.filter((photo) => photo.kind === filter)

  useEffect(() => {
    let ignore = false
    fetch(`${base}gallery.json`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const rows = galleryRows(data)
        if (!ignore && rows) setPhotos(rows)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [base])

  useEffect(() => {
    if (!active) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") setActive(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  return (
    <section className="band photos">
      <div className="section-head">
        <p className="eyebrow">The work</p>
        <h1>Photos</h1>
        <p className="section-note">
          Makeup, nails and installs from the chair. Follow the studio on Instagram {INSTAGRAM_HANDLE} and
          Facebook, {FACEBOOK_NAME}.
        </p>
      </div>
      <div className="photo-filters" role="group" aria-label="Photo type">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            className={filter === name ? "on" : undefined}
            aria-pressed={filter === name}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="section-note">No photos in this set yet.</p>
      ) : (
        <div className="photo-grid">
          {shown.map((photo) => (
            <button key={photo.id} type="button" className="photo-card" aria-label={photo.alt} onClick={() => setActive(photo)}>
              <img src={`${base}photos/${photo.file}`} alt={photo.alt} />
            </button>
          ))}
        </div>
      )}
      <p className="photo-socials">
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">
          <InstagramIcon />
          <span>Instagram {INSTAGRAM_HANDLE}</span>
        </a>
        <a href={FACEBOOK} target="_blank" rel="noreferrer">
          <FacebookIcon />
          <span>Facebook · {FACEBOOK_NAME}</span>
        </a>
        <a href={TIKTOK} target="_blank" rel="noreferrer">
          <TikTokIcon />
          <span>TikTok @khahlisobeauty</span>
        </a>
      </p>
      {active ? (
        <div className="photo-view" role="dialog" aria-modal="true" aria-label={active.alt} onClick={() => setActive(null)}>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={`${base}photos/${active.file}`} alt={active.alt} />
            <figcaption>{active.alt}</figcaption>
            <button type="button" onClick={() => setActive(null)}>
              Close
            </button>
          </figure>
        </div>
      ) : null}
    </section>
  )
}
