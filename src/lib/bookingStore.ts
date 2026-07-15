import type { Booking } from '../App'

export const BOOKING_STORAGE_KEY = 'vernay-bookings'
export const CANCELLATION_WINDOW_MS = 12 * 60 * 60 * 1000

const API_URL = 'https://projecthotel-production.up.railway.app'
export const loadBookingsFromServer = async (): Promise<Booking[]> => {
  const response = await fetch(`${API_URL}/api/bookings`)

  if (!response.ok) {
    throw new Error('Failed to load bookings from server')
  }

  const data = await response.json()

  const bookings: Booking[] = data.map((item: any) => ({
    id: String(item.id),

    room: item.room ?? {
      id: String(item.room_id ?? ''),
      name: item.room_name ?? 'Unknown Room',
      type: item.room_type ?? 'standard',
      price: Number(item.room_price ?? 0),
      size: Number(item.room_size ?? 0),
      capacity: Number(item.room_capacity ?? item.guests ?? 1),
      available: true,
      image: item.room_image ?? '',
      features: [],
      description: '',
    },

    checkIn: item.checkIn ?? item.check_in ?? '',
    checkOut: item.checkOut ?? item.check_out ?? '',

    guests: Number(item.guests ?? 1),

    totalPrice: Number(
      item.totalPrice ?? item.total_price ?? 0
    ),

    guestName:
      item.guestName ??
      item.guest_name ??
      'Unknown Guest',

    guestEmail:
      item.guestEmail ??
      item.guest_email ??
      '',

    paymentMethod:
      item.paymentMethod ??
      item.payment_method ??
      'cash',

    status: item.status ?? 'pending',

    createdAt:
      item.createdAt ??
      item.created_at ??
      new Date().toISOString(),
  }))

  persistBookings(bookings)

  return bookings
}





export const loadBookings = (): Booking[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(
      BOOKING_STORAGE_KEY
    )

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored) as Booking[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}


export const persistBookings = (bookings: Booking[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings))
}

export const addBooking = async (booking: Booking) => {
  console.log('===== CREATE BOOKING =====')
  console.log('API URL:', `${API_URL}/api/bookings`)
  console.log('BOOKING SENT:', booking)

  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  })

  const responseText = await response.text()

  console.log('BOOKING STATUS:', response.status)
  console.log('BOOKING RESPONSE:', responseText)

  let data: unknown = null

  try {
    data = JSON.parse(responseText)
  } catch {
    data = null
  }

  if (!response.ok) {
    let errorMessage = `Failed to save booking (${response.status})`

    if (data && typeof data === 'object') {
      const errorData = data as Record<string, unknown>

      if (typeof errorData.message === 'string') {
        errorMessage = errorData.message
      } else if (typeof errorData.error === 'string') {
        errorMessage = errorData.error
      }
    } else if (responseText) {
      errorMessage = responseText
    }

    throw new Error(errorMessage)
  }

  const saved = data as Booking | null

  const next = [
    saved ?? booking,
    ...loadBookings(),
  ]

  persistBookings(next)

  return saved ?? booking
}



export const updateBookingStatus = async (id: string, status: Booking['status']) => {
  const response = await fetch(`${API_URL}/api/bookings/${id}/status`, {
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
