import { useEffect, useState } from "react"
import { formatLongDate, money } from "../../shared/catalog.js"

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

export default function Studio() {
  const [key, setKey] = useState(() => sessionStorage.getItem("khahliso-key") || "")
  const [draft, setDraft] = useState("")
  const [rows, setRows] = useState(null)
  const [error, setError] = useState("")

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
      <h1>Bookings</h1>
      <p>Match every M-Pesa and EcoCash code against the phone before the client sits.</p>

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
