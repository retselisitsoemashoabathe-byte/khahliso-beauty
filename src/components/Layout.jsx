import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./Icons.jsx"
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

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

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
        <div className="nav-end">
          <div className="nav-social">
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label={`Instagram ${INSTAGRAM_HANDLE}`}>
              <InstagramIcon />
            </a>
            <a href={FACEBOOK} target="_blank" rel="noreferrer" aria-label={`Facebook ${FACEBOOK_NAME}`}>
              <FacebookIcon />
            </a>
            <a href={TIKTOK} target="_blank" rel="noreferrer" aria-label="TikTok @khahlisobeauty">
              <TikTokIcon />
            </a>
          </div>
          <Link to="/book" className="nav-book">
            Book · R100
          </Link>
          <button
            className={open ? "nav-toggle open" : "nav-toggle"}
            type="button"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
          <p className={live ? "live on" : "live"}>
            <span />
            {live ? "Open now" : "Closed now"}
          </p>
        </div>
        <nav id="site-nav" className={open ? "site-nav open" : "site-nav"}>
          <Link to="/#services">Services</Link>
          <Link to="/#prices">Prices</Link>
          <Link to="/photos">Photos</Link>
          <Link to="/#visit">Visit</Link>
        </nav>
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
          <a className="with-icon" href={INSTAGRAM} target="_blank" rel="noreferrer">
            <InstagramIcon />
            <span>Instagram {INSTAGRAM_HANDLE}</span>
          </a>
          <a className="with-icon" href={FACEBOOK} target="_blank" rel="noreferrer">
            <FacebookIcon />
            <span>Facebook · {FACEBOOK_NAME}</span>
          </a>
          <a className="with-icon" href={TIKTOK} target="_blank" rel="noreferrer">
            <TikTokIcon />
            <span>TikTok @khahlisobeauty</span>
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
