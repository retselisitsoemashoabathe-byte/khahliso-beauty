import { Link } from "react-router-dom"
import {
  MENU,
  WEEK,
  money,
  MAP_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
  WHATSAPP,
  FEE,
} from "../../shared/catalog.js"

function itemsOf(group) {
  return group.sections ? group.sections.flatMap((section) => section.items) : group.items
}

function fromPrice(group) {
  const prices = itemsOf(group)
    .map((item) => item.price)
    .filter((price) => price != null)
  if (!prices.length) return "Quoted in studio"
  const headline = prices.filter((price) => price >= 100)
  return `From ${money(Math.min(...(headline.length ? headline : prices)))}`
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Maseru · Olympic Building · Room 4</p>
          <img className="hero-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="Khahliso. Your glow starts here." />
          <p className="lede">
            Makeup, nails, lashes and wig installation. A {money(FEE)} booking fee holds your chair,
            and it comes off the service when you arrive.
          </p>
          <div className="hero-actions">
            <Link className="btn solid" to="/book">
              Book and pay R100
            </Link>
            <a className="btn ghost" href="#prices">
              See the price list
            </a>
            <Link className="btn ghost" to="/photos">
              See the photos
            </Link>
          </div>
        </div>
        <figure className="hero-portrait">
          <img src={`${import.meta.env.BASE_URL}glow.jpg`} alt="Full glam and a blonde install by Khahliso Beauty" />
          <figcaption>Glam and install · @khahlisobeauty</figcaption>
        </figure>
      </section>

      <section className="band" id="services">
        <div className="section-head">
          <p className="eyebrow">The chair</p>
          <h2>Four ways to glow</h2>
        </div>
        <div className="service-grid">
          {MENU.map((group) => (
            <article key={group.id} className="service-card">
              <p className="eyebrow">{group.kicker}</p>
              <h3>{group.title}</h3>
              <p>{group.note}</p>
              <p className="from">{fromPrice(group)}</p>
              <Link to="/book" state={{ category: group.id }}>
                Book {group.title.toLowerCase()}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="band" id="prices">
        <div className="section-head">
          <p className="eyebrow">The menu</p>
          <h2>Price list</h2>
          <p className="section-note">
            Shown in Rand. Maloti is taken at the same value. Every booking starts with a R{FEE} fee,
            paid now by M-Pesa, EcoCash or card.
          </p>
        </div>
        <div className="menu-grid">
          <div className="menu-col">
            <MenuCard group={MENU.find((group) => group.id === "makeup")} />
            <figure className="nail-photo">
              <img src={`${import.meta.env.BASE_URL}nails.jpg`} alt="Red and blush nail set by Khahliso Beauty" />
            </figure>
            <MenuCard group={MENU.find((group) => group.id === "lashes")} />
          </div>
          <div className="menu-col">
            <MenuCard group={MENU.find((group) => group.id === "nails")} />
            <MenuCard group={MENU.find((group) => group.id === "installation")} />
          </div>
        </div>
      </section>

      <section className="band visit" id="visit">
        <div>
          <p className="eyebrow">The studio</p>
          <h2>Olympic Building, ground floor</h2>
          <p className="lede">
            Room 4, Maseru. Call or WhatsApp {PHONE_DISPLAY} and the chair is easy to find.
          </p>
          <div className="hero-actions">
            <a className="btn solid" href={`tel:${PHONE_TEL}`}>
              Call {PHONE_DISPLAY}
            </a>
            <a className="btn ghost" href={WHATSAPP} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn ghost" href={MAP_URL} target="_blank" rel="noreferrer">
              Map
            </a>
          </div>
        </div>
        <div className="hours">
          <h3>Hours</h3>
          <ul>
            {[1, 2, 3, 4, 5, 6, 0].map((index) => WEEK[index]).map((row) => (
              <li key={row.day}>
                <span>{row.day}</span>
                <span>
                  {row.open} – {row.close}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

function MenuCard({ group }) {
  return (
    <article className="menu-card" id={group.id}>
      <header>
        <h3>{group.title}</h3>
        <p>{group.note}</p>
      </header>
      {group.sections ? (
        group.sections.map((section) => (
          <div key={section.title} className="menu-block">
            <h4>{section.title}</h4>
            <PriceRows items={section.items} category={group.id} />
          </div>
        ))
      ) : (
        <PriceRows items={group.items} category={group.id} />
      )}
      {group.footnotes ? (
        <ul className="footnotes">
          {group.footnotes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function PriceRows({ items, category }) {
  return (
    <ul className="prices">
      {items.map((item) => (
        <li key={item.id}>
          <span>{item.name}</span>
          <span className="dots" aria-hidden="true" />
          <strong>{money(item.price)}</strong>
          <Link to="/book" state={{ serviceId: item.id, category }} aria-label={`Book ${item.name}`}>
            Book
          </Link>
        </li>
      ))}
    </ul>
  )
}
