import { useEffect, useState, useMemo } from 'react'
import { SlidersHorizontal, Wifi, Coffee, Car, Dumbbell, Wind, Tv, Users, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Page, SearchParams, Room, User } from '../../App'
import { loadRoomsFromServer, persistStoredRooms, toPublicRoom } from '../../lib/roomStore'
import { getBookedDatesForRoom } from '../../lib/availability'


interface Props {
  navigate: (p: Page) => void
  searchParams: SearchParams
  setSearchParams: (p: SearchParams) => void
  setSelectedRoom: (r: Room) => void
  setPendingRoom: (r: Room | null) => void
  user: User | null
}

const ALL_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Classic Double Room',
    type: 'standard',
    price: 189,
    size: 28,
    capacity: 2,
    available: true,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning'],
    description: 'A well-appointed double room with classic furnishings, a king bed, and garden view. Ideal for couples or solo travelers seeking comfort and value.',
  },
  {
    id: 'r2',
    name: 'Deluxe King Suite',
    type: 'deluxe',
    price: 320,
    size: 45,
    capacity: 2,
    available: true,
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker', 'City View'],
    description: 'Spacious king suite with panoramic city views, a separate sitting area, and premium amenities. The most requested room for business travelers.',
  },
  {
    id: 'r3',
    name: 'Executive Penthouse',
    type: 'suite',
    price: 580,
    size: 90,
    capacity: 4,
    available: true,
    image: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker', 'Gym Access', 'Parking', 'Private Terrace'],
    description: 'Our signature penthouse spans the entire top floor, offering 360° views, a private terrace, two bedrooms, and butler service. For those who expect the extraordinary.',
  },
  {
    id: 'r4',
    name: 'Superior Twin Room',
    type: 'standard',
    price: 210,
    size: 32,
    capacity: 2,
    available: true,
    image: 'https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker'],
    description: 'Two full beds, a bright workspace, and neutral interiors designed for extended stays or pairs who prefer individual sleeping arrangements.',
  },
  {
    id: 'r5',
    name: 'Junior Suite',
    type: 'deluxe',
    price: 265,
    size: 52,
    capacity: 3,
    available: false,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker', 'Gym Access'],
    description: 'A generous junior suite with a day bed, walk-in wardrobe, and luxury bath products. Perfect for longer stays or those wanting extra space.',
  },
  {
    id: 'r6',
    name: 'Executive Business Room',
    type: 'executive',
    price: 390,
    size: 55,
    capacity: 2,
    available: true,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&h=480&fit=crop&auto=format',
    features: ['WiFi', 'TV', 'Air Conditioning', 'Coffee Maker', 'Gym Access', 'Parking', 'Express Check-in'],
    description: 'Purpose-built for the discerning business traveler — ergonomic desk, high-speed fiber internet, Club Lounge access, and same-day pressing service.',
  },
]

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi size={13} />,
  'Coffee Maker': <Coffee size={13} />,
  Parking: <Car size={13} />,
  'Gym Access': <Dumbbell size={13} />,
  'Air Conditioning': <Wind size={13} />,
  TV: <Tv size={13} />,
}

export default function SearchResults({ navigate, searchParams, setSearchParams, setSelectedRoom, setPendingRoom, user }: Props) {
  const [maxPrice, setMaxPrice] = useState(700)
  const [filterAvail, setFilterAvail] = useState(false)
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'size'>('price_asc')
  const [showFilters, setShowFilters] = useState(false)
  const [localParams, setLocalParams] = useState(searchParams)
  const [rooms, setRooms] = useState<Room[]>(ALL_ROOMS)

  // blocked dates per room for the current search range
  const [blockedByRoomId, setBlockedByRoomId] = useState<Record<string, Set<string>>>({})


  useEffect(() => {
    const syncRooms = async () => {
      try {
        const serverRooms = await loadRoomsFromServer(localParams.checkIn, localParams.checkOut)
        const nextRooms = serverRooms.map(toPublicRoom)
        setRooms(nextRooms)
        persistStoredRooms(serverRooms)
      } catch {
        setRooms(ALL_ROOMS)
      }
    }


    syncRooms()

    // compute blocked date ranges for each room for the current search range
    const syncBlockedDates = async () => {
      if (!localParams.checkIn || !localParams.checkOut) return

      try {
        const next: Record<string, Set<string>> = {}
        await Promise.all(
          rooms.map(async (r) => {
            try {
              next[r.id] = await getBookedDatesForRoom(r.id, localParams.checkIn, localParams.checkOut)
            } catch {
              next[r.id] = new Set()
            }
          })
        )
        setBlockedByRoomId(next)
      } catch {
        setBlockedByRoomId({})
      }
    }

    window.addEventListener('vernay-rooms-updated', syncRooms)
    window.addEventListener('storage', syncRooms)

    // initial blocked sync
    syncBlockedDates()

    return () => {

      window.removeEventListener('vernay-rooms-updated', syncRooms)
      window.removeEventListener('storage', syncRooms)
    }
  }, [localParams.checkIn, localParams.checkOut])

  const filtered = useMemo(() => {
    let roomsToShow = rooms.filter((r) => {
      if (r.price > maxPrice) return false
      if (filterAvail && !r.available) return false
      if (localParams.roomType !== 'any' && r.type !== localParams.roomType) return false
      if (r.capacity < localParams.guests) return false
      return true
    })
    if (sortBy === 'price_asc') roomsToShow = roomsToShow.sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') roomsToShow = roomsToShow.sort((a, b) => b.price - a.price)
    if (sortBy === 'size') roomsToShow = roomsToShow.sort((a, b) => b.size - a.size)
    return roomsToShow
  }, [maxPrice, filterAvail, sortBy, localParams, rooms])

  const nights = useMemo(() => {
    if (!localParams.checkIn || !localParams.checkOut) return 1

    const diff =
      (new Date(localParams.checkOut).getTime() - new Date(localParams.checkIn).getTime()) /
      86400000
    return Math.max(1, diff)
  }, [localParams.checkIn, localParams.checkOut])

  const handleBook = (room: Room) => {
    if (!user) {
      setSelectedRoom(room)
      setPendingRoom(room)
      navigate('auth')
      return
    }

    setSelectedRoom(room)
    navigate('room')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Search bar */}
      <div
        className="p-5 mb-8 border"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Check-in
            </label>
            <input
              type="date"
              value={localParams.checkIn}
              onChange={(e) => setLocalParams({ ...localParams, checkIn: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded"
              style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
            />
          </div>
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Check-out
            </label>
            <input
              type="date"
              value={localParams.checkOut}
              onChange={(e) => setLocalParams({ ...localParams, checkOut: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded"
              style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
            />
          </div>
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Guests
            </label>
            <select
              value={localParams.guests}
              onChange={(e) => setLocalParams({ ...localParams, guests: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border rounded"
              style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs tracking-widests uppercase mb-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Room Type
            </label>
            <select
              value={localParams.roomType}
              onChange={(e) => setLocalParams({ ...localParams, roomType: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded"
              style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
            >
              {['any', 'standard', 'deluxe', 'suite', 'executive'].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs tracking-widest uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => setSearchParams(localParams)}
            className="px-5 py-2 text-xs tracking-widest uppercase font-medium transition-opacity hover:opacity-85"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Update Search
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6" style={{ borderColor: 'var(--border)' }}>
            <div>
              <label
                className="block text-xs tracking-widests uppercase mb-2"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Max price: €{maxPrice}/night
              </label>
              <input
                type="range"
                min={100}
                max={700}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-700"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="avail"
                checked={filterAvail}
                onChange={(e) => setFilterAvail(e.target.checked)}
                className="accent-amber-700"
              />
              <label htmlFor="avail" className="text-sm">Available rooms only</label>
            </div>
            <div>
              <label
                className="block text-xs tracking-widests uppercase mb-2"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="size">Largest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-display text-3xl mb-1"
            style={{ fontWeight: 300, fontStyle: 'italic' }}
          >
            Available Rooms
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {filtered.length} {filtered.length === 1 ? 'room' : 'rooms'} found
            {nights > 1 ? ` · ${nights} nights` : ''}
          </p>
        </div>
      </div>

      {/* Room cards */}
      {filtered.length === 0 ? (
        <div
          className="py-20 text-center border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <p className="font-display italic text-xl mb-2" style={{ fontWeight: 300 }}>
            No rooms match your criteria.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Try adjusting filters or broadening your search.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((room) => (
            <div
              key={room.id}
              className="border grid grid-cols-1 md:grid-cols-5 overflow-hidden"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--card)',
                opacity: room.available ? 1 : 0.6,
              }}
            >
              <div className="md:col-span-2 relative overflow-hidden h-52 md:h-auto">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {!room.available && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(10,22,40,0.55)' }}
                  >
                    <span
                      className="text-xs tracking-widest uppercase px-3 py-1.5 text-center"
                      style={{ backgroundColor: 'var(--primary)', color: 'rgba(246,241,233,0.6)' }}
                    >
                      {localParams.checkIn && localParams.checkOut ? 'Booked for these dates' : 'Unavailable'}
                    </span>
                  </div>
                )}
              </div>
              <div className="md:col-span-3 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span
                        className="text-xs tracking-widests uppercase font-mono mb-1 block"
                        style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-mono)' }}
                      >
                        {room.type}
                      </span>
                      <h3 className="font-display text-xl italic" style={{ fontWeight: 400 }}>
                        {room.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="font-display text-2xl font-semibold"
                        style={{ color: 'var(--accent)' }}
                      >
                        €{room.price}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        per night
                      </p>
                      {nights > 1 && (
                        <p
                          className="text-xs mt-0.5 font-mono"
                          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-dm-mono)' }}
                        >
                          €{(room.price * nights).toLocaleString()} total
                        </p>
                      )}
                    </div>
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {room.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-1"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    >
                      <Maximize2 size={11} /> {room.size}m²
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-1"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    >
                      <Users size={11} /> Up to {room.capacity}
                    </span>
                    {room.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1 text-xs px-2 py-1"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                      >
                        {FEATURE_ICONS[f] ?? null} {f}
                      </span>
                    ))}
                    {room.features.length > 4 && (
                      <span
                        className="text-xs px-2 py-1"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        +{room.features.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBook(room)}
                  disabled={
                    !room.available ||
                    (blockedByRoomId[room.id]?.size ?? 0) > 0
                  }
                  title={
                    blockedByRoomId[room.id]?.size
                      ? 'Not available for the selected dates'
                      : undefined
                  }
                  className="self-start px-6 py-2.5 text-sm tracking-widests uppercase transition-opacity hover:opacity-85 disabled:opacity-50 disabled:hover:opacity-50"
                  style={{
                    backgroundColor: !room.available ? 'transparent' : 'var(--primary)',
                    color: !room.available ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                    border: !room.available ? '1px solid var(--border)' : 'none',
                  }}
                >
                  Select Room
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
