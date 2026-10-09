export const FEE = 100

export const PHONE_DISPLAY = "5951 4576"
export const PHONE_TEL = "+26659514576"
export const WHATSAPP = "https://wa.me/26659514576"
export const TIKTOK = "https://www.tiktok.com/@khahlisobeauty"
export const INSTAGRAM = "https://www.instagram.com/khahlisobeauty/"
export const INSTAGRAM_HANDLE = "@khahlisobeauty"
export const FACEBOOK_NAME = "Khahliso Makhalanyane"
export const FACEBOOK = "https://www.facebook.com/search/people/?q=Khahliso%20Makhalanyane"
export const ADDRESS_LINES = ["Olympic Building, Room 4", "Ground Floor, Maseru"]
export const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Olympic+Building+Maseru"

export const WEEK = [
  { day: "Sunday", open: "10:00", close: "15:00" },
  { day: "Monday", open: "08:00", close: "18:00" },
  { day: "Tuesday", open: "07:00", close: "18:00" },
  { day: "Wednesday", open: "07:00", close: "18:00" },
  { day: "Thursday", open: "09:00", close: "18:00" },
  { day: "Friday", open: "07:00", close: "18:00" },
  { day: "Saturday", open: "07:00", close: "18:00" },
]

export const ADDONS = [
  { id: "french", name: "French tips", price: 20 },
  { id: "cateye", name: "Cat eye", price: 20 },
]

const makeup = [
  { id: "soft-glam", name: "Soft glam", price: 300 },
  { id: "full-glam", name: "Full glam", price: 350 },
  { id: "graduation-glam", name: "Graduation glam", price: 300 },
  { id: "photoshoot-glam", name: "Photoshoot glam", price: 350 },
  { id: "bridal-glam", name: "Bridal glam", price: 500 },
]

const manicure = [
  { id: "rubber-overlay", name: "Rubber base overlay", price: 150, allowAddons: true },
  { id: "rubber-extension", name: "Rubber base extension", price: 150, allowAddons: true },
  { id: "polygel-overlay", name: "Polygel overlay", price: 200, allowAddons: true },
  { id: "polygel-extension", name: "Polygel extension", price: 250, allowAddons: true },
  { id: "acrylic-overlay", name: "Acrylic overlay", price: 200, allowAddons: true },
  { id: "acrylic-extension", name: "Acrylic extension", price: 250, allowAddons: true },
]

const pedicure = [
  { id: "gel-overlay", name: "Gel overlay", price: 100, allowAddons: true },
  { id: "gel-extension", name: "Gel extension", price: 120, allowAddons: true },
  { id: "french-toes", name: "French toes", price: 120, allowAddons: true },
]

const nailExtras = [
  { id: "gel-refill", name: "Gel refill", price: 120 },
  { id: "polygel-refill", name: "Polygel refill", price: 150 },
  { id: "acrylic-refill", name: "Acrylic refill", price: 150 },
  { id: "extreme-designs", name: "Extreme nail designs", price: 250 },
  { id: "gel-soak", name: "Gel soak off", price: 30 },
  { id: "poly-acrylic-soak", name: "Polygel or acrylic soak off", price: 50 },
  { id: "nail-repair", name: "Nail repair", price: 10 },
  { id: "acrylic-or-polygel", name: "Acrylic or polygel", price: 20 },
]

const installation = [
  { id: "install-basic", name: "Basic installation", price: 200 },
  { id: "install-styling", name: "Installation + styling", price: 300 },
]

const lashes = [
  {
    id: "lash-set",
    name: "Lash appointment",
    price: null,
    note: "The set is quoted in the studio before any work begins.",
  },
]

export const MENU = [
  {
    id: "makeup",
    title: "Makeup",
    kicker: "The glam",
    note: "Soft, full, graduation, photoshoot and bridal.",
    items: makeup,
  },
  {
    id: "nails",
    title: "Nails",
    kicker: "The set",
    note: "Prices as updated from 25 August.",
    sections: [
      { title: "Manicure", items: manicure },
      { title: "Pedicure", items: pedicure },
      { title: "Extras", items: nailExtras },
    ],
    footnotes: ["French tips, extra R20", "Cat eye, extra R20"],
  },
  {
    id: "lashes",
    title: "Lashes",
    kicker: "The lash",
    note: "Book the chair. The set is priced with you in the studio.",
    items: lashes,
  },
  {
    id: "installation",
    title: "Wig installation",
    kicker: "The install",
    note: "Basic install, or install with styling.",
    items: installation,
  },
]

function withCategory(items, category) {
  return items.map((item) => ({ ...item, category }))
}

export const SERVICES = MENU.flatMap((group) => {
  const items = group.sections
    ? group.sections.flatMap((section) => section.items)
    : group.items
  return withCategory(items, group.id)
})

export function findService(id) {
  return SERVICES.find((service) => service.id === id) || null
}

export function money(amount) {
  if (amount == null) return "In studio"
  return `R${amount}`
}

export function serviceTotal(service, addonIds = []) {
  if (!service || service.price == null) return null
  const extra = ADDONS.filter((addon) => addonIds.includes(addon.id)).reduce(
    (sum, addon) => sum + addon.price,
    0
  )
  return service.price + extra
}

export function balanceDue(total) {
  if (total == null) return null
  return Math.max(0, total - FEE)
}

export function slotsFor(dateStr) {
  if (!dateStr) return []
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return []
  const hours = WEEK[date.getDay()]
  const [openH, openM] = hours.open.split(":").map(Number)
  const [closeH, closeM] = hours.close.split(":").map(Number)
  const start = openH * 60 + openM
  const end = closeH * 60 + closeM - 60
  const slots = []
  for (let minute = start; minute <= end; minute += 60) {
    const h = String(Math.floor(minute / 60)).padStart(2, "0")
    const m = String(minute % 60).padStart(2, "0")
    slots.push(`${h}:${m}`)
  }
  return slots
}

export function isOpen(date = new Date()) {
  const hours = WEEK[date.getDay()]
  const now = date.getHours() * 60 + date.getMinutes()
  const [openH, openM] = hours.open.split(":").map(Number)
  const [closeH, closeM] = hours.close.split(":").map(Number)
  return now >= openH * 60 + openM && now < closeH * 60 + closeM
}

export function todayISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatLongDate(dateStr) {
  if (!dateStr) return ""
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
