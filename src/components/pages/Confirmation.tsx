import { useMemo, useState } from 'react'
import { CheckCircle, Download, Calendar, Users, CreditCard, XCircle } from 'lucide-react'
import type { Page, Booking } from '../../App'
import { isCancellationAllowed, updateBookingStatus } from '../../lib/bookingStore'

interface Props {
  navigate: (p: Page) => void
  booking: Booking
}

export default function Confirmation({ navigate, booking }: Props) {
  const [currentBooking, setCurrentBooking] = useState(booking)
  const [notice, setNotice] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const nights = useMemo(
    () =>
      Math.max(
        1,
        (new Date(currentBooking.checkOut).getTime() - new Date(currentBooking.checkIn).getTime()) / 86400000
      ),
    [currentBooking.checkIn, currentBooking.checkOut]
  )

  const canCancel = isCancellationAllowed(currentBooking)
  const statusLabel = currentBooking.status === 'cancelled' ? 'Cancelled' : currentBooking.status === 'pending' ? 'Pending' : 'Confirmed'

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const handleCancelConfirmed = () => {
    if (!canCancel) {
      setNotice('This booking can no longer be canceled because the 12-hour window has passed.')
      setConfirmOpen(false)
      return
    }

    const nextBooking = { ...currentBooking, status: 'cancelled' as const }
    updateBookingStatus(nextBooking.id, 'cancelled')
    setCurrentBooking(nextBooking)
    setNotice('Your reservation has been canceled successfully.')
    setConfirmOpen(false)
  }

  const handleCancel = () => {
    setConfirmOpen(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="surface-accent-soft w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-accent" />
      </div>

      <p className="text-xs tracking-[0.35em] uppercase mb-3 text-accent">
        Booking Confirmed
      </p>
      <h1 className="font-display text-4xl italic mb-3 font-light leading-tight">
        You're all set,<br />
        <em className="font-semibold not-italic">{currentBooking.guestName.split(' ')[0]}.</em>
      </h1>
      <p className="text-sm mb-10 text-muted-foreground">
        A confirmation has been sent to{' '}
        <span className="text-foreground">{currentBooking.guestEmail}</span>
      </p>

      <div className="text-left border mb-8 bg-card border-border">
        <div className="px-6 py-4 flex items-center justify-between border-b header-surface">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-0.5 text-muted-soft">
              Reservation ID
            </p>
            <p className="font-mono text-lg tracking-widest text-accent">
              {currentBooking.id}
            </p>
          </div>
          <span className="text-xs tracking-[0.2em] uppercase px-3 py-1 accent-pill">
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="overflow-hidden h-44 sm:h-auto">
            <img
              src={currentBooking.room.image}
              alt={currentBooking.room.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent">
              {currentBooking.room.type}
            </span>
            <h2 className="font-display text-xl italic mt-1 mb-4 font-normal">
              {currentBooking.room.name}
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar size={14} className="text-accent shrink-0" />
                <div>
                  <span className="text-foreground">{fmt(currentBooking.checkIn)}</span>
                  <span className="mx-2">→</span>
                  <span className="text-foreground">{fmt(currentBooking.checkOut)}</span>
                  <span className="ml-2">({nights} night{nights !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Users size={14} className="text-accent" />
                {currentBooking.guests} {currentBooking.guests === 1 ? 'guest' : 'guests'}
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <CreditCard size={14} className="text-accent" />
                {currentBooking.paymentMethod === 'card' ? 'Card payment' : 'Pay at hotel'}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t text-sm border-border">
          <div className="flex justify-between mb-1 text-muted-foreground">
            <span>€{currentBooking.room.price} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span>€{currentBooking.room.price * nights}</span>
          </div>
          <div className="flex justify-between mb-3 text-muted-foreground">
            <span>Taxes & fees</span>
            <span>€{Math.round(currentBooking.room.price * nights * 0.1)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-border">
            <span>Total charged</span>
            <span className="text-accent">€{currentBooking.totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="text-left p-5 border mb-8 text-sm info-box">
        <p className="font-semibold mb-2">What to expect</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>• Check-in from 15:00 · Check-out by 11:00</li>
          <li>• Present this confirmation or your booking ID at reception</li>
          <li>• Free cancellation within 12 hours of booking</li>
          <li>• Contact concierge at <span className="text-foreground">stay@vernay.hotel</span></li>
        </ul>
      </div>

      {notice && (
        <div className="mb-6 flex items-center justify-center gap-2 rounded border border-border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--card)' }}>
          {currentBooking.status === 'cancelled' ? <XCircle size={16} className="text-red-500" /> : <CheckCircle size={16} className="text-accent" />}
          <span>{notice}</span>
        </div>
      )}

      {confirmOpen && (
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
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
                style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}
              >
                No
              </button>
              <button
                onClick={handleCancelConfirmed}
                className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-red-500 text-red-500"
                style={{ backgroundColor: 'transparent' }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {canCancel && currentBooking.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-red-500 text-red-500"
          >
            Cancel Booking
          </button>
        )}
        <button
          onClick={() => navigate('home')}
          className="px-6 py-3 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-border"
        >
          Return Home
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-opacity hover:opacity-85 bg-primary text-primary-foreground"
        >
          <Download size={14} /> Print Confirmation
        </button>
      </div>
    </div>
  )
}
