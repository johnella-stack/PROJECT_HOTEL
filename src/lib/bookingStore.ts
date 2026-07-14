import type { Booking, Room } from '../App'

export const BOOKING_STORAGE_KEY = 'vernay-bookings'
export const CANCELLATION_WINDOW_MS = 12 * 60 * 60 * 1000

const API_URL = 'https://projecthotel-production.up.railway.app'

const DEMO_ROOM: Room = {
  id: 'demo-room',
  name: 'Deluxe King Suite',
  type: 'deluxe',
  price: 320,
  size: 45,
  capacity: 2,
  available: true,
  image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&h=480&fit=crop&auto=format',
  features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker', 'City View'],
  description: 'A beautifully appointed suite with city views and premium amenities.',
}

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'VNY-DEMO01',
    room: DEMO_ROOM,
    checkIn: '2026-07-10',
    checkOut: '2026-07-12',
    guests: 2,
    totalPrice: 704,
    guestName: 'Mina Rossi',
    guestEmail: 'mina@example.com',
    paymentMethod: 'card',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'VNY-DEMO02',
    room: { ...DEMO_ROOM, id: 'demo-room-2', name: 'Classic Double Room', price: 189 },
    checkIn: '2026-07-14',
    checkOut: '2026-07-16',
    guests: 2,
    totalPrice: 415,
    guestName: 'Luca Moreau',
    guestEmail: 'luca@example.com',
    paymentMethod: 'cash',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
]

export const loadBookings = (): Booking[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(BOOKING_STORAGE_KEY)
    if (!stored) {
      persistBookings(DEMO_BOOKINGS)
      return DEMO_BOOKINGS
    }

    const parsed = JSON.parse(stored) as Booking[]
    if (!Array.isArray(parsed)) return []

    return parsed as Booking[]
  } catch {
    return []
  }
}


export const persistBookings = (bookings: Booking[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings))
}

export const addBooking = async (booking: Booking) => {
  const response = await fetch(`formatPeso{API_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to save booking' }))
    throw new Error(error.message || 'Failed to save booking')
  }

  const saved = (await response.json().catch(() => null)) as Booking | null

  // Ensure the booking also appears in the UI (MyBookings/AdminDashboard)
  // which currently reads from localStorage.
  const next = [saved ?? booking, ...loadBookings()]
  persistBookings(next)

  return saved ?? booking
}



export const updateBookingStatus = async (id: string, status: Booking['status']) => {
  const response = await fetch(`formatPeso{API_URL}/api/bookings/formatPeso{id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) throw new Error('Failed to update booking status')
  const bookings = loadBookings()
  const nextBookings = bookings.map((booking) => (booking.id === id ? { ...booking, status } : booking))
  persistBookings(nextBookings)
  return nextBookings
}

export const isCancellationAllowed = (booking: Booking) => {
  if (booking.status === 'cancelled') return false

  const createdAt = new Date(booking.createdAt).getTime()
  const elapsed = Date.now() - createdAt

  return elapsed <= CANCELLATION_WINDOW_MS
}
