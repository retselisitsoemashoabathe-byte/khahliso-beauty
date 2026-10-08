import fs from "node:fs"
import path from "node:path"
import express from "express"
import {
  ADDONS,
  FEE,
  findService,
  serviceTotal,
  balanceDue,
  slotsFor,
  todayISO,
} from "../shared/catalog.js"

const DATA = path.resolve("data/bookings.json")
const PHOTOS = path.resolve("data/inspiration")
const ADMIN_KEY = "khahliso100"

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(DATA, "utf8"))
  } catch {
    return []
  }
}

function writeBookings(rows) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true })
  fs.writeFileSync(DATA, JSON.stringify(rows, null, 2))
}

function clean(value, max = 80) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

function newId(rows) {
  const used = new Set(rows.map((row) => row.id))
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = `KH-${String(Math.floor(1000 + Math.random() * 9000))}`
    if (!used.has(id)) return id
  }
  return `KH-${Date.now().toString().slice(-6)}`
}

function savePhoto(id, dataUrl) {
  if (!dataUrl) return false
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl))
  if (!match) return null
  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64")
  if (buffer.length < 80 || buffer.length > 1_600_000) return null
  fs.mkdirSync(PHOTOS, { recursive: true })
  fs.writeFileSync(path.join(PHOTOS, `${id}.jpg`), buffer)
  return true
}

export function createApi() {
  const app = express()
  app.use(express.json({ limit: "3mb" }))

  app.get("/api/availability", (req, res) => {
    const date = clean(req.query.date, 10)
    const taken = readBookings()
      .filter((row) => row.date === date && row.status !== "cancelled")
      .map((row) => row.time)
    res.json({ taken })
  })

  app.post("/api/bookings", (req, res) => {
    const body = { ...(req.body || {}) }
    delete body.cardNumber
    delete body.pan
    delete body.cvv
    delete body.cvc

    const service = findService(clean(body.serviceId, 40))
    if (!service) {
      res.status(400).json({ error: "Choose a service from the menu." })
      return
    }

    const name = clean(body.name, 80)
    const phone = clean(body.phone, 20)
    const date = clean(body.date, 10)
    const time = clean(body.time, 5)
    const method = clean(body.paymentMethod, 12)
    const notes = clean(body.notes, 240)

    if (name.length < 2) {
      res.status(400).json({ error: "Enter the name for the booking." })
      return
    }
    if (phone.replace(/\D/g, "").length < 8) {
      res.status(400).json({ error: "Enter a phone number we can reach." })
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayISO()) {
      res.status(400).json({ error: "Choose a date that is still ahead." })
      return
    }
    if (!slotsFor(date).includes(time)) {
      res.status(400).json({ error: "That time is outside studio hours." })
      return
    }
    if (!["mpesa", "ecocash", "card"].includes(method)) {
      res.status(400).json({ error: "Choose M-Pesa, EcoCash or card." })
      return
    }

    const addonIds = Array.isArray(body.addons)
      ? body.addons.filter((id) => ADDONS.some((addon) => addon.id === id))
      : []
    const allowedAddons = service.allowAddons ? addonIds : []
    const total = serviceTotal(service, allowedAddons)
    const balance = balanceDue(total)

    let payerPhone = ""
    let transactionCode = ""
    let cardLast4 = ""
    let cardBrand = ""

    if (method === "mpesa" || method === "ecocash") {
      payerPhone = clean(body.payerPhone, 20)
      transactionCode = clean(body.transactionCode, 24).toUpperCase()
      if (payerPhone.replace(/\D/g, "").length < 8) {
        res.status(400).json({ error: "Enter the number you paid from." })
        return
      }
      if (!/^[A-Z0-9]{5,24}$/.test(transactionCode)) {
        res.status(400).json({ error: "Enter the transaction code from your SMS." })
        return
      }
    } else {
      cardLast4 = clean(body.cardLast4, 4)
      cardBrand = clean(body.cardBrand, 20)
      if (!/^\d{4}$/.test(cardLast4)) {
        res.status(400).json({ error: "Check the card number." })
        return
      }
    }

    const rows = readBookings()
    const clash = rows.some(
      (row) => row.date === date && row.time === time && row.status !== "cancelled"
    )
    if (clash) {
      res.status(409).json({ error: "That chair is already taken. Choose another time." })
      return
    }

    const booking = {
      id: newId(rows),
      createdAt: new Date().toISOString(),
      name,
      phone,
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      addons: allowedAddons,
      price: total,
      fee: FEE,
      balance,
      date,
      time,
      notes,
      paymentMethod: method,
      payerPhone,
      transactionCode,
      cardLast4,
      cardBrand,
      status: "booked",
      hasPhoto: false,
    }

    if (body.photo) {
      const saved = savePhoto(booking.id, body.photo)
      if (saved == null) {
        res.status(400).json({ error: "That photo could not be saved. Use a JPG or PNG." })
        return
      }
      booking.hasPhoto = true
    }

    rows.push(booking)
    writeBookings(rows)
    res.status(201).json(booking)
  })

  app.get("/api/inspiration/:id", (req, res) => {
    if (req.header("x-admin-key") !== ADMIN_KEY) {
      res.status(401).end()
      return
    }
    if (!/^KH-\d+$/.test(req.params.id)) {
      res.status(404).end()
      return
    }
    const file = path.join(PHOTOS, `${req.params.id}.jpg`)
    if (!fs.existsSync(file)) {
      res.status(404).end()
      return
    }
    res.type("image/jpeg").sendFile(file)
  })

  app.get("/api/bookings", (req, res) => {
    if (req.header("x-admin-key") !== ADMIN_KEY) {
      res.status(401).json({ error: "That studio key is not right." })
      return
    }
    const rows = readBookings().slice().reverse()
    res.json(rows)
  })

  app.patch("/api/bookings/:id", (req, res) => {
    if (req.header("x-admin-key") !== ADMIN_KEY) {
      res.status(401).json({ error: "That studio key is not right." })
      return
    }
    const status = clean(req.body?.status, 12)
    if (!["booked", "confirmed", "done", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Unknown status." })
      return
    }
    const rows = readBookings()
    const row = rows.find((item) => item.id === req.params.id)
    if (!row) {
      res.status(404).json({ error: "Booking not found." })
      return
    }
    row.status = status
    writeBookings(rows)
    res.json(row)
  })

  return app
}
