import { useState, useMemo } from 'react'
import { Wifi, Coffee, Car, Dumbbell, Wind, Tv, Users, Maximize2, Check, CreditCard, Banknote, ArrowLeft } from 'lucide-react'
import type { Page, Room, SearchParams, User, Booking } from '../../App'
import { addBooking } from '../../lib/bookingStore'
import { checkRoomAvailability } from '../../lib/roomStore'

interface Props {
  navigate: (p: Page) => void
  room: Room
  searchParams: SearchParams
  user: User | null
  setLastBooking: (b: Booking) => void
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi size={15} />,
  'Coffee Maker': <Coffee size={15} />,
  Parking: <Car size={15} />,
  'Gym Access': <Dumbbell size={15} />,
  'Air Conditioning': <Wind size={15} />,
  TV: <Tv size={15} />,
}

export default function RoomDetail({ navigate, room, searchParams, user, setLastBooking }: Props) {
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    requests: '',
    payment: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const nights = useMemo(() => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 1
    const diff =
      (new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) /
      86400000
    return Math.max(1, diff)
  }, [searchParams.checkIn, searchParams.checkOut])

  const total = room.price * nights
  const taxAmount = Math.round(total * 0.1)
  const grandTotal = total + taxAmount

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!searchParams.checkIn) e.checkIn = 'Check-in date required'
    if (!searchParams.checkOut) e.checkOut = 'Check-out date required'
    if (form.payment === 'card') {
      if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
      if (!form.cardExpiry.match(/^\d{2}\/\d{2}$/)) e.cardExpiry = 'Format: MM/YY'
      if (form.cardCvc.length < 3) e.cardCvc = 'Enter 3-digit CVC'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (submitted || submitting) return
    setConfirmOpen(true)
  }

  const handleConfirmReservation = async () => {
    if (!validate()) return

    setSubmitting(true)
    setErrors({})

    try {
      const booking: Booking = {
        id: `VNY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        room,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        totalPrice: grandTotal,
        guestName: form.name,
        guestEmail: form.email,
        paymentMethod: form.payment,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      await addBooking(booking)
      setLastBooking(booking)
      setSubmitted(true)
      setConfirmOpen(false)
      setTimeout(() => navigate('confirm'), 400)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete your reservation. Please try again.'
      setErrors({
        submit: message.includes('not available') || message.includes('409') ? 'That room was just booked for the selected dates. Please choose another date.' : message,
      })
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate('search')}
        className="flex items-center gap-2 text-sm tracking-wide mb-8 transition-opacity hover:opacity-70"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ArrowLeft size={14} /> Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Room info */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden mb-6">
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-72 object-cover"
            />
          </div>

          <span
            className="inline-block text-xs tracking-widests uppercase mb-2 font-mono"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-mono)' }}
          >
            {room.type}
          </span>
          <h1
            className="font-display text-4xl italic mb-4"
            style={{ fontWeight: 300 }}
          >
            {room.name}
          </h1>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {room.description}
          </p>

          {/* Room specs */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 border mb-8"
            style={{ borderColor: 'var(--border)' }}
          >
            {[
              { icon: <Maximize2 size={15} />, label: 'Room Size', value: `${room.size}m²` },
              { icon: <Users size={15} />, label: 'Capacity', value: `${room.capacity} guests` },
              { icon: null, label: 'Room Type', value: room.type.charAt(0).toUpperCase() + room.type.slice(1) },
              { icon: null, label: 'Bed Type', value: room.capacity > 2 ? 'Multiple' : 'King Bed' },
            ].map((spec) => (
              <div
                key={spec.label}
                className="p-4 text-center border-r last:border-r-0"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                {spec.icon && (
                  <div className="flex justify-center mb-1" style={{ color: 'var(--accent)' }}>
                    {spec.icon}
                  </div>
                )}
                <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {spec.label}
                </p>
                <p className="text-sm font-semibold">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <h3
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Amenities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {room.features.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--accent)' }}>{FEATURE_ICONS[f] ?? <Check size={15} />}</span>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Booking form */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-20 border p-6"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            {/* Price summary */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="font-display text-3xl italic"
                  style={{ color: 'var(--accent)', fontWeight: 600 }}
                >
                  €{room.price}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  / night
                </span>
              </div>
              {nights > 1 && (
                <div
                  className="text-xs space-y-1 pt-3 border-t mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  <div className="flex justify-between">
                    <span>€{room.price} × {nights} nights</span>
                    <span>€{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & fees (10%)</span>
                    <span>€{taxAmount}</span>
                  </div>
                  <div
                    className="flex justify-between font-semibold pt-2 border-t text-sm"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    <span>Total</span>
                    <span>€{grandTotal}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Guest info */}
              <p
                className="text-xs tracking-[0.3em] uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Guest Information
              </p>
              {[
                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Sophie Marceau' },
                { id: 'email', label: 'Email', type: 'email', placeholder: 'sophie@example.com' },
                { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+33 6 12 34 56 78' },
              ].map((field) => (
                <div key={field.id}>
                  <label
                    className="block text-xs mb-1"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.id as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded"
                    style={{
                      borderColor: errors[field.id] ? '#dc2626' : 'var(--border)',
                      outline: 'none',
                      backgroundColor: 'transparent',
                    }}
                  />
                  {errors[field.id] && (
                    <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              ))}

              {/* Dates display */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    Check-in
                  </label>
                  <div
                    className="px-3 py-2 text-sm border rounded font-mono"
                    style={{
                      borderColor: errors.checkIn ? '#dc2626' : 'var(--border)',
                      fontFamily: 'var(--font-dm-mono)',
                      color: searchParams.checkIn ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                  >
                    {searchParams.checkIn || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    Check-out
                  </label>
                  <div
                    className="px-3 py-2 text-sm border rounded font-mono"
                    style={{
                      borderColor: errors.checkOut ? '#dc2626' : 'var(--border)',
                      fontFamily: 'var(--font-dm-mono)',
                      color: searchParams.checkOut ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                  >
                    {searchParams.checkOut || 'Not set'}
                  </div>
                </div>
              </div>
              {errors.dates && (
                <p className="text-xs" style={{ color: '#dc2626' }}>
                  {errors.dates}
                </p>
              )}

              {/* Special requests */}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Special Requests (optional)
                </label>
                <textarea
                  placeholder="Early check-in, room on high floor, dietary needs..."
                  value={form.requests}
                  onChange={(e) => setForm({ ...form, requests: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded resize-none"
                  style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
                />
              </div>

              {/* Payment */}
              <div>
                <p
                  className="text-xs tracking-[0.3em] uppercase mb-3"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Payment Method
                </p>
                <div className="flex gap-3 mb-3">
                  {[
                    { value: 'card', label: 'Card', icon: <CreditCard size={13} /> },
                    { value: 'cash', label: 'Pay at Hotel', icon: <Banknote size={13} /> },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, payment: opt.value })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-xs tracking-wide border transition-colors"
                      style={{
                        borderColor: form.payment === opt.value ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: form.payment === opt.value ? 'var(--primary)' : 'transparent',
                        color: form.payment === opt.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                {form.payment === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={form.cardNumber}
                        onChange={(e) => setForm({ ...form, cardNumber: formatCard(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border rounded font-mono"
                        style={{
                          borderColor: errors.cardNumber ? '#dc2626' : 'var(--border)',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          fontFamily: 'var(--font-dm-mono)',
                        }}
                        maxLength={19}
                      />
                      {errors.cardNumber && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={form.cardExpiry}
                          onChange={(e) => setForm({ ...form, cardExpiry: formatExpiry(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border rounded font-mono"
                          style={{
                            borderColor: errors.cardExpiry ? '#dc2626' : 'var(--border)',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                          maxLength={5}
                        />
                        {errors.cardExpiry && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.cardExpiry}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="CVC"
                          value={form.cardCvc}
                          onChange={(e) => setForm({ ...form, cardCvc: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                          className="w-full px-3 py-2 text-sm border rounded font-mono"
                          style={{
                            borderColor: errors.cardCvc ? '#dc2626' : 'var(--border)',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                          maxLength={3}
                        />
                        {errors.cardCvc && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.cardCvc}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitted || submitting}
                onClick={(e) => {
                  // keep default submit handler; modal will open from handleSubmit
                }}
                className="w-full py-3.5 text-sm tracking-widests uppercase font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                {submitted ? 'Confirming...' : submitting ? 'Checking availability...' : `Confirm Reservation · €${grandTotal}`}
              </button>

              {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                  <div
                    className="relative w-full max-w-sm border"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="font-semibold">Confirmation</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Are you sure you want to confirm this reservation?
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
                        onClick={handleConfirmReservation}
                        className="flex-1 px-4 py-2 text-sm tracking-[0.2em] uppercase border transition-opacity hover:opacity-70 border-red-500 text-red-500"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <p className="text-xs text-center" style={{ color: '#dc2626' }}>
                  {errors.submit}
                </p>
              )}

              <p
                className="text-xs text-center"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Free cancellation within 12 hours of booking
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
