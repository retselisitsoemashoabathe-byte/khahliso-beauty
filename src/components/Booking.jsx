import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import {
  ADDONS,
  FEE,
  MENU,
  PHONE_DISPLAY,
  WHATSAPP,
  balanceDue,
  findService,
  formatLongDate,
  money,
  serviceTotal,
  slotsFor,
  todayISO,
} from "../../shared/catalog.js"

const STEPS = ["Service", "When", "You", "Pay"]

const emptyCard = { name: "", number: "", expiry: "", cvv: "" }

export default function Booking() {
  const location = useLocation()
  const presetId = location.state?.serviceId || ""
  const presetCategory = location.state?.category || ""

  const [step, setStep] = useState(0)
  const [category, setCategory] = useState(presetCategory || (presetId ? findService(presetId)?.category : "makeup"))
  const [serviceId, setServiceId] = useState(presetId)
  const [addons, setAddons] = useState([])
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState("")
  const [taken, setTaken] = useState([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [photo, setPhoto] = useState("")
  const [method, setMethod] = useState("mpesa")
  const [payerPhone, setPayerPhone] = useState("")
  const [transactionCode, setTransactionCode] = useState("")
  const [card, setCard] = useState(emptyCard)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const service = findService(serviceId)
  const group = MENU.find((item) => item.id === category) || MENU[0]
  const choices = group.sections ? group.sections.flatMap((section) => section.items) : group.items
  const total = serviceTotal(service, service?.allowAddons ? addons : [])
  const balance = balanceDue(total)
  const slots = useMemo(() => slotsFor(date), [date])

  useEffect(() => {
    if (!date) return
    let ignore = false
    fetch(`/api/availability?date=${date}`)
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setTaken(data.taken || [])
      })
      .catch(() => {
        if (!ignore) setTaken([])
      })
    return () => {
      ignore = true
    }
  }, [date])

  function toggleAddon(id) {
    setAddons((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function validate(target) {
    if (target > 0 && !service) return "Choose the service you want."
    if (target > 1 && (!date || !time)) return "Choose a date and a time."
    if (target > 1 && taken.includes(time)) return "That time was just taken. Pick another."
    if (target > 2 && name.trim().length < 2) return "Enter the name for the booking."
    if (target > 2 && phone.replace(/\D/g, "").length < 8) return "Enter a phone number we can reach."
    return ""
  }

  function go(next) {
    const problem = validate(next)
    setError(problem)
    if (!problem) setStep(next)
  }

  async function pay(event) {
    event.preventDefault()
    const problem = validate(3)
    if (problem) {
      setError(problem)
      return
    }

    const payload = {
      serviceId,
      addons: service?.allowAddons ? addons : [],
      name,
      phone,
      notes,
      photo,
      date,
      time,
      paymentMethod: method,
    }

    if (method === "card") {
      const digits = card.number.replace(/\D/g, "")
      const cardError = validateCard(card, digits)
      if (cardError) {
        setError(cardError)
        return
      }
      payload.cardLast4 = digits.slice(-4)
      payload.cardBrand = brandOf(digits)
    } else {
      if (payerPhone.replace(/\D/g, "").length < 8) {
        setError("Enter the number you paid from.")
        return
      }
      if (!/^[A-Za-z0-9]{5,24}$/.test(transactionCode.trim())) {
        setError("Enter the transaction code from your SMS.")
        return
      }
      payload.payerPhone = payerPhone
      payload.transactionCode = transactionCode
    }

    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const raw = await response.text()
      let data = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = {}
      }
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          finishOffline()
          return
        }
        throw new Error(data.error || "The booking did not save.")
      }
      setReceipt(data)
      setCard(emptyCard)
      setStep(4)
    } catch (err) {
      if (err instanceof TypeError) {
        finishOffline()
        return
      }
      setError(err.message)
    } finally {
      setBusy(false)
    }

    function finishOffline() {
      setReceipt(offlineBooking(payload, service, Boolean(photo)))
      setCard(emptyCard)
      setStep(4)
    }
  }

  if (receipt) {
    return <Receipt booking={receipt} />
  }

  return (
    <section className="book">
      <div className="book-intro">
        <p className="eyebrow">Reserve the chair</p>
        <h1>Book and pay R{FEE}</h1>
        <p>
          The booking fee starts at R{FEE}. It is paid now, then taken off your service at Olympic
          Building, Room 4.
        </p>
      </div>

      <ol className="steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "on" : index < step ? "done" : ""}>
            <span>0{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {error ? <p className="form-error">{error}</p> : null}

      {step === 0 && (
        <div className="book-panel">
          <div className="chips" role="tablist">
            {MENU.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === category ? "on" : ""}
                onClick={() => {
                  setCategory(item.id)
                  setServiceId("")
                  setAddons([])
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="choice-list">
            {choices.map((item) => (
              <label key={item.id} className={item.id === serviceId ? "choice on" : "choice"}>
                <input
                  type="radio"
                  name="service"
                  checked={item.id === serviceId}
                  onChange={() => {
                    setServiceId(item.id)
                    setAddons([])
                  }}
                />
                <span>{item.name}</span>
                <strong>{money(item.price)}</strong>
              </label>
            ))}
          </div>
          {service?.allowAddons ? (
            <fieldset className="addons">
              <legend>Extras, R20 each</legend>
              {ADDONS.map((addon) => (
                <label key={addon.id}>
                  <input
                    type="checkbox"
                    checked={addons.includes(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                  />
                  {addon.name}
                </label>
              ))}
            </fieldset>
          ) : null}
          <div className="book-nav">
            <button className="btn solid" type="button" onClick={() => go(1)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="book-panel">
          <label className="field">
            Date
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setTime("")
              }}
            />
          </label>
          <div className="slots">
            {slots.map((slot) => {
              const closed = taken.includes(slot) || isPastSlot(date, slot)
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={closed}
                  className={time === slot ? "on" : ""}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              )
            })}
          </div>
          <div className="book-nav">
            <button className="btn ghost" type="button" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn solid" type="button" onClick={() => go(2)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="book-panel">
          <label className="field">
            Your name
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label className="field">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="5951 4576"
            />
          </label>
          <label className="field">
            What you need
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Length, colour, occasion, or the look you want"
            />
          </label>
          <div className="field">
            <span>Add a photo if you cannot explain it</span>
            <input
              id="reference-photo"
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
            <label className="btn ghost file-label" htmlFor="reference-photo">
              {photo ? "Change photo" : "Add a photo"}
            </label>
            {photo ? (
              <figure className="reference-preview">
                <img src={photo} alt="The look you want" />
                <button type="button" onClick={() => setPhoto("")}>
                  Remove photo
                </button>
              </figure>
            ) : null}
          </div>
          <div className="book-nav">
            <button className="btn ghost" type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn solid" type="button" onClick={() => go(3)}>
              Continue to payment
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form className="book-panel pay-layout" onSubmit={pay}>
          <Summary service={service} addons={addons} date={date} time={time} total={total} balance={balance} />
          <div>
            <fieldset className="methods">
              <legend>Pay the R{FEE} booking fee</legend>
              {[
                ["mpesa", "M-Pesa"],
                ["ecocash", "EcoCash"],
                ["card", "Card"],
              ].map(([id, label]) => (
                <label key={id} className={method === id ? "on" : ""}>
                  <input type="radio" name="method" checked={method === id} onChange={() => setMethod(id)} />
                  {label}
                </label>
              ))}
            </fieldset>

            {method === "card" ? (
              <div className="pay-fields">
                <p className="pay-help">
                  Pay the R{FEE} booking fee by card. Only the last four digits are kept. The full
                  number and CVV are never saved.
                </p>
                <label className="field">
                  Name on card
                  <input
                    value={card.name}
                    autoComplete="cc-name"
                    onChange={(event) => setCard({ ...card, name: event.target.value })}
                  />
                </label>
                <label className="field">
                  Card number
                  <input
                    value={formatCard(card.number)}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    onChange={(event) => setCard({ ...card, number: event.target.value })}
                  />
                </label>
                <div className="split">
                  <label className="field">
                    Expiry
                    <input
                      value={card.expiry}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
                    />
                  </label>
                  <label className="field">
                    CVV
                    <input
                      value={card.cvv}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      onChange={(event) =>
                        setCard({ ...card, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="pay-fields">
                <p className="pay-help">
                  Send <strong>R{FEE}</strong> by {method === "mpesa" ? "M-Pesa" : "EcoCash"} to{" "}
                  <strong>{PHONE_DISPLAY}</strong>. Then enter the code from the SMS so the studio can
                  match your payment.
                </p>
                <label className="field">
                  Number you paid from
                  <input
                    value={payerPhone}
                    inputMode="tel"
                    onChange={(event) => setPayerPhone(event.target.value)}
                    placeholder="5951 4576"
                  />
                </label>
                <label className="field">
                  {method === "mpesa" ? "M-Pesa" : "EcoCash"} transaction code
                  <input
                    value={transactionCode}
                    onChange={(event) => setTransactionCode(event.target.value.toUpperCase())}
                    placeholder="From your SMS"
                  />
                </label>
              </div>
            )}

            <div className="book-nav">
              <button className="btn ghost" type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn solid" type="submit" disabled={busy}>
                {busy ? "Saving your chair…" : `Pay R${FEE} and book`}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  )
}

function Summary({ service, addons, date, time, total, balance }) {
  const picked = ADDONS.filter((addon) => addons.includes(addon.id))
  return (
    <aside className="summary">
      <p className="eyebrow">Due now</p>
      <p className="fee">R{FEE}</p>
      <p>{service?.name}</p>
      {picked.length ? <p className="muted">{picked.map((addon) => addon.name).join(" · ")}</p> : null}
      <p>
        {formatLongDate(date)}
        {time ? ` · ${time}` : ""}
      </p>
      <dl>
        <div>
          <dt>Service</dt>
          <dd>{money(total)}</dd>
        </div>
        <div>
          <dt>Booking fee</dt>
          <dd>R{FEE}</dd>
        </div>
        <div>
          <dt>At the studio</dt>
          <dd>{balance == null ? "Quoted on the day" : money(balance)}</dd>
        </div>
      </dl>
    </aside>
  )
}

function Receipt({ booking }) {
  const methodLabel = { mpesa: "M-Pesa", ecocash: "EcoCash", card: "Card" }[booking.paymentMethod]
  const payLine =
    booking.paymentMethod === "card"
      ? `${booking.cardBrand || "Card"} ending ${booking.cardLast4}`
      : `${methodLabel} · ${booking.transactionCode}`
  const text = encodeURIComponent(
    [
      `Khahliso Beauty booking ${booking.id}.`,
      `${booking.name} · ${booking.phone}.`,
      `${booking.serviceName} on ${formatLongDate(booking.date)} at ${booking.time}.`,
      `Booking fee R${booking.fee} via ${methodLabel}${booking.transactionCode ? ` code ${booking.transactionCode}` : ""}.`,
      booking.notes ? `Notes: ${booking.notes}` : "",
    ]
      .filter(Boolean)
      .join(" ")
  )

  return (
    <section className="book receipt">
      <p className="eyebrow">Chair reserved</p>
      <h1>You’re booked</h1>
      <p className="reference">{booking.id}</p>
      <p>
        {booking.serviceName} · {formatLongDate(booking.date)} · {booking.time}
      </p>
      <p>
        Booking fee R{booking.fee} · {payLine}
      </p>
      <p>
        {booking.balance == null
          ? "The service price is confirmed with you in the studio."
          : booking.balance === 0
            ? "Nothing further is due for this service."
            : `${money(booking.balance)} is due when you arrive.`}
      </p>
      {booking.offline ? (
        <p>Send this on WhatsApp so the studio receives your booking and payment code.</p>
      ) : null}
      {booking.hasPhoto ? <p>Your reference photo is saved with this booking.</p> : null}
      <p>Show this reference at Olympic Building, Room 4. We will also reach you on {booking.phone}.</p>
      <div className="hero-actions">
        <a className="btn solid" href={`${WHATSAPP}?text=${text}`} target="_blank" rel="noreferrer">
          Send on WhatsApp
        </a>
        <a className="btn ghost" href={calendarLink(booking)} target="_blank" rel="noreferrer">
          Add to calendar
        </a>
      </div>
    </section>
  )
}

function calendarLink(booking) {
  const stamp = booking.date.replace(/-/g, "")
  const start = `${stamp}T${booking.time.replace(":", "")}00`
  const [h, m] = booking.time.split(":").map(Number)
  const endHour = String(h + 1).padStart(2, "0")
  const end = `${stamp}T${endHour}${String(m).padStart(2, "0")}00`
  const details = encodeURIComponent(`Khahliso Beauty · ${booking.id} · Room 4, Olympic Building, Maseru`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Khahliso · ${booking.serviceName}`
  )}&dates=${start}/${end}&ctz=Africa/Johannesburg&details=${details}&location=${encodeURIComponent(
    "Olympic Building Room 4, Maseru"
  )}`
}

function offlineBooking(payload, service, hasPhoto) {
  const addonIds = service?.allowAddons ? payload.addons || [] : []
  const total = serviceTotal(service, addonIds)
  return {
    id: `KH-${String(Math.floor(1000 + Math.random() * 9000))}`,
    name: payload.name,
    phone: payload.phone,
    notes: payload.notes,
    serviceName: service?.name || "Appointment",
    date: payload.date,
    time: payload.time,
    fee: FEE,
    balance: balanceDue(total),
    paymentMethod: payload.paymentMethod,
    transactionCode: payload.transactionCode || "",
    cardLast4: payload.cardLast4 || "",
    cardBrand: payload.cardBrand || "",
    hasPhoto,
    offline: true,
  }
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
      const scale = Math.min(1, 1100 / longest)
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.72))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("That photo could not be read. Try a JPG or PNG."))
    }
    image.src = url
  })
}

function isPastSlot(date, slot) {
  if (date !== todayISO()) return false
  const [h, m] = slot.split(":").map(Number)
  const now = new Date()
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
}

function formatCard(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function brandOf(digits) {
  if (/^4/.test(digits)) return "Visa"
  if (/^5[1-5]/.test(digits) || /^2(2|3|4|5|6|7)/.test(digits)) return "Mastercard"
  if (/^3[47]/.test(digits)) return "Amex"
  return "Card"
}

function luhn(digits) {
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function validateCard(card, digits) {
  if (card.name.trim().length < 2) return "Enter the name on the card."
  if (digits.length < 15 || digits.length > 16 || !luhn(digits)) return "Check the card number."
  const match = /^(\d{2})\/(\d{2})$/.exec(card.expiry)
  if (!match) return "Enter the expiry as MM/YY."
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return "Check the expiry month."
  const now = new Date()
  const expiry = new Date(year, month)
  if (expiry <= now) return "This card has expired."
  if (card.cvv.length < 3) return "Enter the CVV."
  return ""
}
