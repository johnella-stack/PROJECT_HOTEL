import { useEffect, useMemo, useState } from 'react'
import { Calendar, CreditCard, Users, XCircle, CheckCircle, Clock, Save } from 'lucide-react'
import type { Booking, Page, User } from '../../App'
import { isCancellationAllowed, loadBookings, updateBookingStatus } from '../../lib/bookingStore'
import { getBookedDatesForRoom } from '../../lib/availability'


interface Props {
  navigate: (p: Page) => void
  user: User | null
}

const statusStyles = {
  confirmed: { label: 'Approved', icon: <CheckCircle size={14} />, color: '#16a34a' },
  pending: { label: 'Pending', icon: <Clock size={14} />, color: '#d97706' },
  cancelled: { label: 'Cancelled', icon: <XCircle size={14} />, color: '#dc2626' },
} as const

export default function MyBookings({ navigate, user }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setBookings(loadBookings().filter((booking) => booking.guestEmail.toLowerCase() === user?.email.toLowerCase()))
  }, [user?.email])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const [confirmBookingId, setConfirmBookingId] = useState<string | null>(null)

  const handleCancelConfirmed = () => {
    if (!confirmBookingId) return
    const booking = bookings.find((b) => b.id === confirmBookingId)
    if (!booking) {
      setConfirmBookingId(null)
      return
    }

    if (!isCancellationAllowed(booking)) {
      setNotice('This booking can no longer be canceled because the 12-hour window has passed.')
      setConfirmBookingId(null)
      return
    }

    updateBookingStatus(booking.id, 'cancelled')
    setBookings((current) => current.map((item) => (item.id === booking.id ? { ...item, status: 'cancelled' } : item)))
    setNotice('Your reservation has been canceled successfully.')
    setConfirmBookingId(null)
  }

  const handleCancel = (booking: Booking) => {
    setConfirmBookingId(booking.id)
  }


  const sortedBookings = useMemo(() => [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [bookings])

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-3xl italic mb-3">My bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">Please sign in to view your reservations.</p>
        <button
          onClick={() => navigate('auth')}
          className="px-6 py-3 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.35em] uppercase mb-2 text-accent">Guest Area</p>
          <h1 className="font-display text-3xl italic">My bookings</h1>
          <p className="text-sm text-muted-foreground mt-2">See your reservations, check whether they are approved, and cancel if still allowed.</p>
        </div>
        <button
          onClick={() => navigate('home')}
          className="px-5 py-2.5 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
        >
          Browse rooms
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--card)' }}>
          {notice}
        </div>
      )}

      {confirmBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <div className="relative w-full max-w-sm border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-semibold">Confirmation</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Are you sure you want to cancel this booking?
              </p>
            </div>
            <div className="flex gap-3 px-5 py-4">
              <button
                onClick={() => setConfirmBookingId(null)}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
                style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}
              >
                No
              </button>
              <button
                onClick={() => {
                  const booking = bookings.find((b) => b.id === confirmBookingId)
                  if (booking) handleCancelConfirmed(booking)
                }}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-red-500 text-red-500"
                style={{ backgroundColor: 'transparent' }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}


      {sortedBookings.length === 0 ? (
        <div className="rounded border border-border p-8 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <p className="text-sm text-muted-foreground">You have no reservations yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedBookings.map((booking) => {
            const status = statusStyles[booking.status]
            const nights = Math.max(1, (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
            const canCancel = isCancellationAllowed(booking)

            return (
              <div key={booking.id} className="border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col lg:flex-row">
                  <img src={booking.room.image} alt={booking.room.name} className="w-full lg:w-56 h-48 object-cover" />
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase mb-1 text-accent">{booking.id}</p>
                        <h2 className="font-display text-xl italic">{booking.room.name}</h2>
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-xs tracking-[0.2em] uppercase" style={{ backgroundColor: 'rgba(176,125,58,0.08)', color: status.color }}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-accent" />
                        <span>{fmt(booking.checkIn)} → {fmt(booking.checkOut)} ({nights} night{nights !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-accent" />
                        <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-accent" />
                        <span>{booking.paymentMethod === 'card' ? 'Card payment' : 'Pay at hotel'}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase mb-1 text-muted-foreground">Total</p>
                        <p className="font-semibold text-accent">€{booking.totalPrice}</p>
                      </div>
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(booking)}
                          disabled={!canCancel}
                          className="px-5 py-2.5 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 disabled:opacity-50"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {canCancel ? 'Cancel booking' : 'Cancellation closed'}
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
