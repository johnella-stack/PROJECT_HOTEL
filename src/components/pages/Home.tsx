import { useState } from 'react'
import { Search, MapPin, Star, ChevronRight, ArrowRight } from 'lucide-react'
import type { Page, SearchParams } from '../../App'

interface Props {
  navigate: (p: Page) => void
  searchParams: SearchParams
  setSearchParams: (p: SearchParams) => void
}

const FEATURES = [
  {
    label: 'Curated Rooms',
    desc: 'Every room hand-selected for quality and comfort, from classic doubles to executive suites.',
  },
  {
    label: 'Instant Confirmation',
    desc: 'Book in minutes and receive a confirmed reservation with all details by email.',
  },
  {
    label: 'Flexible Cancellation',
    desc: 'Plans change. Cancel within 12 hours of booking with no penalty.',
  },
  {
    label: '24/7 Concierge',
    desc: 'Our team is available around the clock to accommodate any special request.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sophie Marceau',
    location: 'Paris, France',
    rating: 5,
    text: "The booking experience was seamless, and the room exceeded every expectation. The attention to detail from the Vernay team is unmatched.",
  },
  {
    name: 'James Whitfield',
    location: 'London, UK',
    rating: 5,
    text: "I've stayed at hundreds of hotels. Vernay is in a class of its own — the platform makes finding the perfect room effortless.",
  },
  {
    name: 'Elena Vasquez',
    location: 'Madrid, Spain',
    rating: 5,
    text: "From search to check-out, every step was polished. I'll be returning every business trip to this city.",
  },
]

export default function Home({ navigate, searchParams, setSearchParams }: Props) {
  const [localParams, setLocalParams] = useState(searchParams)

  const handleSearch = () => {
    setSearchParams(localParams)
    navigate('search')
  }

  return (
    <div>
      {/* Hero — two-tone split */}
      <section className="relative min-h-[88vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left: dark panel */}
        <div
          className="flex flex-col justify-center px-10 lg:px-16 py-20 order-2 lg:order-1"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <p
            className="text-xs tracking-[0.35em] uppercase mb-6"
            style={{ color: 'var(--accent)' }}
          >
            Premium Hotel Reservations
          </p>
          <h1
            className="font-display text-5xl lg:text-6xl xl:text-7xl leading-[1.05] mb-8"
            style={{ color: 'var(--primary-foreground)', fontWeight: 300, fontStyle: 'italic' }}
          >
            Where Every
            <br />
            Stay Becomes
            <br />
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
              a Memory.
            </em>
          </h1>
          <p
            className="text-base leading-relaxed mb-10 max-w-md"
            style={{ color: 'rgba(246,241,233,0.55)' }}
          >
            Search and book from our curated collection of rooms. Real-time
            availability, transparent pricing, and instant confirmation.
          </p>

          {/* Search card */}
          <div
            className="rounded p-6"
            style={{ backgroundColor: 'var(--secondary)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  className="block text-xs tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(246,241,233,0.4)' }}
                >
                  Check-in
                </label>
                <input
                  type="date"
                  value={localParams.checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, checkIn: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm rounded"
                  style={{
                    backgroundColor: 'rgba(246,241,233,0.07)',
                    color: 'var(--primary-foreground)',
                    border: '1px solid rgba(246,241,233,0.12)',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(246,241,233,0.4)' }}
                >
                  Check-out
                </label>
                <input
                  type="date"
                  value={localParams.checkOut}
                  min={localParams.checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, checkOut: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm rounded"
                  style={{
                    backgroundColor: 'rgba(246,241,233,0.07)',
                    color: 'var(--primary-foreground)',
                    border: '1px solid rgba(246,241,233,0.12)',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(246,241,233,0.4)' }}
                >
                  Guests
                </label>
                <select
                  value={localParams.guests}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, guests: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 text-sm rounded"
                  style={{
                    backgroundColor: 'rgba(246,241,233,0.07)',
                    color: 'var(--primary-foreground)',
                    border: '1px solid rgba(246,241,233,0.12)',
                    outline: 'none',
                  }}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n} style={{ backgroundColor: '#1C3353' }}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(246,241,233,0.4)' }}
                >
                  Room Type
                </label>
                <select
                  value={localParams.roomType}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, roomType: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm rounded"
                  style={{
                    backgroundColor: 'rgba(246,241,233,0.07)',
                    color: 'var(--primary-foreground)',
                    border: '1px solid rgba(246,241,233,0.12)',
                    outline: 'none',
                  }}
                >
                  {['any', 'standard', 'deluxe', 'suite', 'executive'].map((t) => (
                    <option key={t} value={t} style={{ backgroundColor: '#1C3353' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm tracking-widest uppercase font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              <Search size={15} />
              Search Available Rooms
            </button>
          </div>
        </div>

        {/* Right: hero image */}
        <div className="relative min-h-[50vh] lg:min-h-full order-1 lg:order-2 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&h=1000&fit=crop&auto=format"
            alt="Luxurious hotel room with floor-to-ceiling windows and city view"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(10,22,40,0.3) 0%, transparent 40%)' }}
          />
          <div
            className="absolute bottom-8 left-8 px-4 py-3"
            style={{ backgroundColor: 'rgba(10,22,40,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>
              Featured
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--primary-foreground)' }}>
              Executive Suite · Paris Flagship
            </p>
            <p className="text-xs" style={{ color: 'rgba(246,241,233,0.5)' }}>
              From PHP 20,000 / night
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div
        className="border-b"
        style={{ backgroundColor: 'var(--secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '340+', label: 'Rooms Available' },
            { value: '98%', label: 'Guest Satisfaction' },
            { value: '12', label: 'Hotel Locations' },
            { value: '24/7', label: 'Concierge Service' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="font-display text-2xl mb-1"
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs tracking-widest uppercase"
                style={{ color: 'rgba(246,241,233,0.4)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Why Vernay
            </p>
            <h2
              className="font-display text-4xl lg:text-5xl leading-tight mb-6"
              style={{ fontWeight: 300, fontStyle: 'italic' }}
            >
              Designed around
              <br />
              <em style={{ fontStyle: 'normal', fontWeight: 600 }}>
                your comfort.
              </em>
            </h2>
            <p
              className="text-sm leading-relaxed mb-8"
              style={{ color: 'var(--muted-foreground)' }}
            >
              We built Vernay from the ground up to remove friction from hotel
              booking — without removing the personal touch that makes a great stay.
            </p>
            <button
              onClick={() => navigate('search')}
              className="flex items-center gap-2 text-sm tracking-wider uppercase transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              Browse all rooms <ArrowRight size={14} />
            </button>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="p-6 border transition-shadow hover:shadow-md"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card)',
                }}
              >
                <div
                  className="w-6 h-0.5 mb-4"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {f.label}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room preview gallery */}
      <section style={{ backgroundColor: 'var(--muted)' }} className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs tracking-[0.35em] uppercase mb-3"
                style={{ color: 'var(--accent)' }}
              >
                Our Collection
              </p>
              <h2
                className="font-display text-4xl"
                style={{ fontWeight: 300, fontStyle: 'italic' }}
              >
                Featured Rooms
              </h2>
            </div>
            <button
              onClick={() => navigate('search')}
              className="hidden md:flex items-center gap-2 text-sm tracking-wider uppercase"
              style={{ color: 'var(--muted-foreground)' }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Classic Double',
                price: 189,
                img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&h=400&fit=crop&auto=format',
                badge: 'Most Popular',
              },
              {
                name: 'Deluxe King Suite',
                price: 320,
                img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop&auto=format',
                badge: 'Recommended',
              },
              {
                name: 'Executive Penthouse',
                price: 580,
                img: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=400&fit=crop&auto=format',
                badge: 'Signature',
              },
            ].map((room) => (
              <div
                key={room.name}
                className="group cursor-pointer overflow-hidden"
                style={{ backgroundColor: 'var(--card)' }}
                onClick={() => navigate('search')}
              >
                <div className="relative overflow-hidden h-52">
                  <img
                    src={room.img}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    className="absolute top-3 left-3 text-xs tracking-widest uppercase px-2 py-1"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--accent)' }}
                  >
                    {room.badge}
                  </span>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{room.name}</h3>
                    <p
                      className="text-xs tracking-wide"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Starting from
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-display text-xl font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      PHP {room.price}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      / night
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p
            className="text-xs tracking-[0.35em] uppercase mb-3"
            style={{ color: 'var(--accent)' }}
          >
            Guest Reviews
          </p>
          <h2
            className="font-display text-4xl"
            style={{ fontWeight: 300, fontStyle: 'italic' }}
          >
            What our guests say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-8 border"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
            >
              <div className="flex gap-0.5 mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill="currentColor"
                    style={{ color: 'var(--accent)' }}
                  />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed mb-6 font-display italic"
                style={{ fontWeight: 300 }}
              >
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--accent)' }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <MapPin size={10} />
                    {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section
        className="py-20 text-center"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <p
          className="text-xs tracking-[0.35em] uppercase mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Reserve Today
        </p>
        <h2
          className="font-display text-4xl lg:text-5xl mb-6"
          style={{ color: 'var(--primary-foreground)', fontWeight: 300, fontStyle: 'italic' }}
        >
          Your perfect stay awaits.
        </h2>
        <p
          className="text-sm mb-8 max-w-md mx-auto"
          style={{ color: 'rgba(246,241,233,0.5)' }}
        >
          Check availability now. Instant confirmation. Free cancellation up to 48 hours.
        </p>
        <button
          onClick={() => navigate('search')}
          className="px-8 py-3.5 text-sm tracking-widest uppercase font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          Find Your Room
        </button>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-10"
        style={{
          backgroundColor: 'var(--primary)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p
            className="font-display italic text-lg"
            style={{ color: 'rgba(246,241,233,0.35)', fontWeight: 300 }}
          >
            Vernay Hotels
          </p>
          <p
            className="text-xs tracking-wide"
            style={{ color: 'rgba(246,241,233,0.25)' }}
          >
            © 2026 Vernay Hotels. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
