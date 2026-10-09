import { useEffect, useState } from "react"
import { FACEBOOK, FACEBOOK_NAME, INSTAGRAM, INSTAGRAM_HANDLE } from "../../shared/catalog.js"

const PHOTOS = [
  { file: "01-blonde-glam.jpg", alt: "Blonde bob with full glam and a red lip", kind: "Makeup" },
  { file: "03-gold-glam.jpg", alt: "Gold eyeshadow and a red lip", kind: "Makeup" },
  { file: "16-braids-red-lip.jpg", alt: "Braids with gold eyeshadow and a red lip", kind: "Makeup" },
  { file: "21-pink-top-glam.jpg", alt: "Braided style with a bright red lip", kind: "Makeup" },
  { file: "15-pink-bonnet-glam.jpg", alt: "Soft glam with a pink bonnet", kind: "Makeup" },
  { file: "04-curly-install.jpg", alt: "Curly install with purple eyeshadow", kind: "Installs" },
  { file: "14-straight-install.jpg", alt: "Long straight install", kind: "Installs" },
  { file: "13-ponytail-install.jpg", alt: "Sleek ponytail install", kind: "Installs" },
  { file: "18-beaded-braids.jpg", alt: "Beaded braids and soft glam", kind: "Installs" },
  { file: "02-braids-soft-glam.jpg", alt: "Long braids with a soft brown glam", kind: "Makeup" },
  { file: "20-braid-glam.jpg", alt: "Cornrow braids with a gold earring", kind: "Makeup" },
  { file: "17-gold-bonnet-glam.jpg", alt: "Glam with a gold and black bonnet", kind: "Makeup" },
  { file: "05-smoky-glam.jpg", alt: "Smoky eye with a glossy nude lip", kind: "Makeup" },
  { file: "19-blue-smoky-glam.jpg", alt: "Blue smoky eye", kind: "Makeup" },
  { file: "06-pink-brown-nails.jpg", alt: "Pink and brown stiletto nails with silver beads", kind: "Nails" },
  { file: "09-pink-stiletto-nails.jpg", alt: "Hot pink stiletto nails with gold lines", kind: "Nails" },
  { file: "08-red-floral-nails.jpg", alt: "Red and pink nails with flowers and gold", kind: "Nails" },
  { file: "10-pink-flower-nails.jpg", alt: "Pink nails with flowers and a gold oval", kind: "Nails" },
  { file: "11-zebra-nails.jpg", alt: "Pink nails with zebra tips and white flowers", kind: "Nails" },
  { file: "12-nude-floral-nails.jpg", alt: "Nude stiletto nails with a pink flower", kind: "Nails" },
  { file: "07-french-nails.jpg", alt: "Mauve French nails", kind: "Nails" },
]

const FILTERS = ["All", "Makeup", "Nails", "Installs"]

export default function Photos() {
  const [filter, setFilter] = useState("All")
  const [active, setActive] = useState(null)
  const base = import.meta.env.BASE_URL
  const shown = filter === "All" ? PHOTOS : PHOTOS.filter((photo) => photo.kind === filter)

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
      <div className="photo-grid">
        {shown.map((photo) => (
          <button key={photo.file} type="button" className="photo-card" aria-label={photo.alt} onClick={() => setActive(photo)}>
            <img src={`${base}photos/${photo.file}`} alt={photo.alt} />
          </button>
        ))}
      </div>
      <p className="photo-socials">
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">
          Instagram {INSTAGRAM_HANDLE}
        </a>
        <a href={FACEBOOK} target="_blank" rel="noreferrer">
          Facebook · {FACEBOOK_NAME}
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
