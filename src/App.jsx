import { Route, Routes } from "react-router-dom"
import Layout from "./components/Layout.jsx"
import Home from "./components/Home.jsx"
import Booking from "./components/Booking.jsx"
import Studio from "./components/Studio.jsx"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/studio" element={<Studio />} />
      </Route>
    </Routes>
  )
}
