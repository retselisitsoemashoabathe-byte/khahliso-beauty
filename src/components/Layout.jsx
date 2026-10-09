import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  FACEBOOK,
  FACEBOOK_NAME,
  INSTAGRAM,
  INSTAGRAM_HANDLE,
  isOpen,
  PHONE_DISPLAY,
  PHONE_TEL,
  TIKTOK,
  WHATSAPP,
} from "../../shared/catalog.js"

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(() => isOpen(new Date()))
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const timer = setInterval(() => setLive(isOpen(new Date())), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const node = document.querySelector(location.hash)
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [location])

  return (
    <>
      <div className="atmosphere" aria-hidden="true" />
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="nav">
        <Link to="/" className="brand">
          Khahliso
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className={open ? "site-nav open" : "site-nav"}>
          <Link to="/#services">Services</Link>
          <Link to="/#prices">Prices</Link>
          <Link to="/photos">Photos</Link>
          <Link to="/#visit">Visit</Link>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={FACEBOOK} target="_blank" rel="noreferrer">
            Facebook
          </a>
          <a href={TIKTOK} target="_blank" rel="noreferrer">
            TikTok
          </a>
        </nav>
        <Link to="/book" className="nav-book">
          Book · R100
        </Link>
        <p className={live ? "live on" : "live"}>
          <span />
          {live ? "Open now" : "Closed now"}
        </p>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="footer">
        <div>
          <p className="eyebrow">Khahliso Beauty</p>
          <p className="footer-line">Your glow starts here.</p>
        </div>
        <div>
          <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
          <a href={WHATSAPP} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram {INSTAGRAM_HANDLE}
          </a>
          <a href={FACEBOOK} target="_blank" rel="noreferrer">
            Facebook · {FACEBOOK_NAME}
          </a>
          <a href={TIKTOK} target="_blank" rel="noreferrer">
            TikTok @khahlisobeauty
          </a>
        </div>
        <div>
          <p>Olympic Building, Room 4</p>
          <p>Ground floor, Maseru</p>
          <Link to="/studio">Studio desk</Link>
        </div>
      </footer>
    </>
  )
}
