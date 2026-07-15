import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, TrendingUp,
  CheckCircle, Clock, XCircle, Plus, Search, ArrowUpRight
} from 'lucide-react'
import type { Booking, Page } from '../../App'
import { loadBookings, updateBookingStatus } from '../../lib/bookingStore'
import { createRoomInServer, loadRoomsFromServer, persistStoredRooms, updateRoomInServer, type RoomRecord } from '../../lib/roomStore'
import { formatPeso } from '../../lib/currency'
interface Props {
  navigate: (p: Page) => void
}

type TabId = 'overview' | 'reservations' | 'rooms' | 'guests'

type RoomItem = RoomRecord

const ROOMS: RoomItem[] = [
  { id: '101', name: 'Classic Double Room', type: 'Standard', price: 189, status: 'occupied', floor: 1, lastCleaned: '2026-07-08 09:00' },
  { id: '205', name: 'Superior Twin Room', type: 'Standard', price: 210, status: 'available', floor: 2, lastCleaned: '2026-07-08 10:15' },
  { id: '312', name: 'Deluxe King Suite', type: 'Deluxe', price: 320, status: 'occupied', floor: 3, lastCleaned: '2026-07-07 14:00' },
  { id: '401', name: 'Junior Suite', type: 'Deluxe', price: 265, status: 'maintenance', floor: 4, lastCleaned: '2026-07-06 11:30' },
  { id: '502', name: 'Executive Business Room', type: 'Executive', price: 390, status: 'available', floor: 5, lastCleaned: '2026-07-08 08:45' },
  { id: 'PH1', name: 'Executive Penthouse', type: 'Suite', price: 580, status: 'occupied', floor: 12, lastCleaned: '2026-07-08 07:00' },
]

const STATUS_CONFIG = {
  confirmed: { icon: <CheckCircle size={13} />, color: '#16a34a', bg: 'rgba(22,163,74,0.08)', label: 'Confirmed' },
  pending: { icon: <Clock size={13} />, color: '#d97706', bg: 'rgba(217,119,6,0.08)', label: 'Pending' },
  cancelled: { icon: <XCircle size={13} />, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Cancelled' },
}

const ROOM_STATUS_CONFIG = {
  available: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', label: 'Available' },
  occupied: { color: 'var(--accent)', bg: 'rgba(176,125,58,0.08)', label: 'Occupied' },
  maintenance: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Maintenance' },
}

export default function AdminDashboard({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [reservations, setReservations] = useState<Booking[]>(() => loadBookings())
  const [rooms, setRooms] = useState<RoomItem[]>(ROOMS)
  const [walkInForm, setWalkInForm] = useState({
    guestName: '',
    guestEmail: '',
    roomName: 'Classic Double Room',
    checkIn: '',
    checkOut: '',
    guests: 2,
    totalPrice: 189,
  })

  useEffect(() => {
    setReservations(loadBookings())
  }, [])

  useEffect(() => {
    let mounted = true
    const syncRooms = async () => {
      try {
        const serverRooms = await loadRoomsFromServer()
        if (mounted && serverRooms.length > 0) {
          setRooms(serverRooms)
          persistStoredRooms(serverRooms)
          window.dispatchEvent(new CustomEvent('vernay-rooms-updated', { detail: serverRooms }))
        }
      } catch {
        // keep using local fallback data
      }
    }

    syncRooms()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      persistStoredRooms(rooms)
      window.dispatchEvent(new CustomEvent('vernay-rooms-updated', { detail: rooms }))
    }
  }, [rooms])

  const confirmed = reservations.filter((r) => r.status === 'confirmed').length
  const pending = reservations.filter((r) => r.status === 'pending').length
  const revenue = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.totalPrice, 0)

  const filteredRes = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.room.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [reservations, searchQuery]
  )

const updateStatus = async (
  id: string,
  status: Booking['status']
) => {
  try {
    const nextBookings = await updateBookingStatus(id, status)

    setReservations(nextBookings)

    const serverRooms = await loadRoomsFromServer()

    setRooms(serverRooms)
    persistStoredRooms(serverRooms)

    window.dispatchEvent(
      new CustomEvent('vernay-rooms-updated', {
        detail: serverRooms,
      })
    )
  } catch (error) {
    console.error('Failed to update booking status:', error)

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to update booking status'
    )
  }
}

  const updateRoomStatus = async (id: string, status: RoomItem['status']) => {
    const nextRooms = rooms.map((room) => (room.id === id ? { ...room, status, available: status === 'available' } : room))
    setRooms(nextRooms)
    try {
      await updateRoomInServer(id, { status, available: status === 'available' })
    } catch {
      // ignore server sync errors and keep local state
    }
  }

  const addRoom = async () => {
  const nextId = `ROOM-${Date.now()}`

  const newRoom: RoomItem = {
    id: nextId,
    name: `New Room`,
    type: 'Standard',
    price: 2500,
    status: 'available',
    floor: 1,
    lastCleaned: new Date().toISOString(),
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&h=480&fit=crop&auto=format',
    size: 28,
    capacity: 2,
    available: true,
  }

  try {
    const savedRoom = await createRoomInServer(newRoom)

    setRooms((current) => [savedRoom, ...current])

    persistStoredRooms([savedRoom, ...rooms])

    window.dispatchEvent(
      new CustomEvent('vernay-rooms-updated', {
        detail: [savedRoom, ...rooms],
      })
    )

    alert('Room added and saved to database successfully!')
  } catch (error) {
    console.error('CREATE ROOM ERROR:', error)

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to create room'
    )
  }
}

  const updateRoomField = async (
  id: string,
  field: 'name' | 'type' | 'price' | 'image' | 'floor' | 'size' | 'capacity',
  value: string | number
) => {
  try {
    const savedRoom = await updateRoomInServer(id, {
      [field]: value,
    } as Partial<RoomItem>)

    const nextRooms = rooms.map((room) =>
      room.id === id
        ? savedRoom
        : room
    )

    setRooms(nextRooms)
    persistStoredRooms(nextRooms)

    window.dispatchEvent(
      new CustomEvent('vernay-rooms-updated', {
        detail: nextRooms,
      })
    )
  } catch (error) {
    console.error('UPDATE ROOM ERROR:', error)

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to update room'
    )
  }
}

  const handleWalkInCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const booking: Booking = {
     id: `VNY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      room: {
        id: `walkin-${walkInForm.roomName.toLowerCase().replace(/\s+/g, '-')}`,
        name: walkInForm.roomName,
        type: 'walk-in',
        price: walkInForm.totalPrice,
        size: 30,
        capacity: walkInForm.guests,
        available: true,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&h=480&fit=crop&auto=format',
        features: ['WiFi', 'TV'],
        description: 'Walk-in reservation created by the front desk.',
      },
      checkIn: walkInForm.checkIn,
      checkOut: walkInForm.checkOut,
      guests: walkInForm.guests,
      totalPrice: walkInForm.totalPrice,
      guestName: walkInForm.guestName,
      guestEmail: walkInForm.guestEmail,
      paymentMethod: 'cash',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const nextBookings = [booking, ...reservations]
    localStorage.setItem('vernay-bookings', JSON.stringify(nextBookings))
    setReservations(nextBookings)
    setWalkInForm({
      guestName: '',
      guestEmail: '',
      roomName: 'Classic Double Room',
      checkIn: '',
      checkOut: '',
      guests: 2,
      totalPrice: 189,
    })
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'reservations', label: 'Reservations', icon: <CalendarCheck size={15} /> },
    { id: 'rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { id: 'guests', label: 'Guests', icon: <Users size={15} /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p
            className="text-xs tracking-[0.3em] uppercase mb-1"
            style={{ color: 'var(--accent)' }}
          >
            Admin
          </p>
          <h1 className="font-display text-3xl italic" style={{ fontWeight: 300 }}>
            Dashboard
          </h1>
        </div>
        <button
          onClick={() => navigate('home')}
          className="text-sm tracking-wide flex items-center gap-2 px-4 py-2 border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--border)' }}
        >
          View Site <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Tab nav */}
      <div
        className="flex border-b mb-8"
        style={{ borderColor: 'var(--border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-5 py-3 text-sm tracking-wide border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted-foreground)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              {
  label: 'Total Revenue',
  value: formatPeso(revenue),
  sub: 'Confirmed bookings',
  icon: <TrendingUp size={18} />,
  accent: true
},
              { label: 'Confirmed', value: confirmed, sub: `${pending} pending`, icon: <CheckCircle size={18} />, accent: false },
              { label: 'Rooms Available', value: rooms.filter((r) => r.status === 'available').length, sub: `${rooms.filter((r) => r.status === 'occupied').length} occupied`, icon: <BedDouble size={18} />, accent: false },
              { label: 'Total Guests', value: reservations.length, sub: 'All time', icon: <Users size={18} />, accent: false },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="p-5 border"
                style={{
                  backgroundColor: kpi.accent ? 'var(--primary)' : 'var(--card)',
                  borderColor: kpi.accent ? 'transparent' : 'var(--border)',
                }}
              >
                <div
                  className="flex items-center justify-between mb-3"
                  style={{ color: kpi.accent ? 'var(--accent)' : 'var(--muted-foreground)' }}
                >
                  {kpi.icon}
                  <span
                    className="text-xs tracking-widests uppercase"
                    style={{ color: kpi.accent ? 'rgba(246,241,233,0.4)' : 'var(--muted-foreground)' }}
                  >
                    {kpi.label}
                  </span>
                </div>
                <p
                  className="font-display text-3xl font-semibold"
                  style={{ color: kpi.accent ? 'var(--primary-foreground)' : 'var(--foreground)' }}
                >
                  {kpi.value}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: kpi.accent ? 'rgba(246,241,233,0.4)' : 'var(--muted-foreground)' }}
                >
                  {kpi.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Recent reservations preview */}
          <div
            className="border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="text-sm font-semibold tracking-wide">Recent Reservations</h2>
              <button
                onClick={() => setActiveTab('reservations')}
                className="text-xs tracking-widests uppercase"
                style={{ color: 'var(--accent)' }}
              >
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Guest', 'Room', 'Check-in', 'Amount', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs tracking-widests uppercase"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(0, 4).map((r) => {
                    const s = STATUS_CONFIG[r.status]
                    return (
                      <tr
                        key={r.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <td
                          className="px-6 py-3.5 font-mono text-xs"
                          style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--muted-foreground)' }}
                        >
                          {r.id}
                        </td>
                        <td className="px-6 py-3.5 font-medium">{r.guestName}</td>
                        <td className="px-6 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{r.room.name}</td>
                        <td className="px-6 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{r.checkIn}</td>
                        <td className="px-6 py-3.5 font-mono" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatPeso(r.totalPrice)}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className="flex items-center gap-1.5 w-fit text-xs px-2 py-1"
                            style={{ backgroundColor: s.bg, color: s.color }}
                          >
                            {s.icon} {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reservations tab */}
      {activeTab === 'reservations' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div
              className="relative flex items-center"
              style={{ width: '280px' }}
            >
              <Search
                size={14}
                className="absolute left-3"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <input
                type="text"
                placeholder="Search by guest, ID, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border"
                style={{ borderColor: 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
              />
            </div>
            <button
              onClick={() => setActiveTab('guests')}
              className="flex items-center gap-2 px-4 py-2 text-sm tracking-wide"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={14} /> New Reservation
            </button>
          </div>
          <div
            className="border overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                    {['ID', 'Guest', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs tracking-widests uppercase"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRes.map((r) => {
                    const s = STATUS_CONFIG[r.status]
                    return (
                      <tr
                        key={r.id}
                        className="border-b last:border-b-0 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <td
                          className="px-5 py-3 font-mono text-xs"
                          style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--muted-foreground)' }}
                        >
                          {r.id}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{r.guestName}</p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.guestEmail}</p>
                        </td>
                        <td className="px-5 py-3" style={{ color: 'var(--muted-foreground)' }}>{r.room.name}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>{r.checkIn}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>{r.checkOut}</td>
                        <td className="px-5 py-3 font-mono" style={{ fontFamily: 'var(--font-dm-mono)' }}>€{r.totalPrice.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span
                            className="flex items-center gap-1.5 w-fit text-xs px-2 py-1"
                            style={{ backgroundColor: s.bg, color: s.color }}
                          >
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value as Booking['status'])}
                            className="text-xs border px-2 py-1"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
                          >
                            <option value="confirmed">Confirm</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rooms tab */}
      {activeTab === 'rooms' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-3">
              {Object.entries(ROOM_STATUS_CONFIG).map(([key, val]) => {
                const count = rooms.filter((r) => r.status === key).length
                return (
                  <span
                    key={key}
                    className="text-xs px-3 py-1.5 flex items-center gap-1.5"
                    style={{ backgroundColor: val.bg, color: val.color }}
                  >
                    {count} {val.label}
                  </span>
                )
              })}
            </div>
            <button
              onClick={addRoom}
              className="flex items-center gap-2 px-4 py-2 text-sm tracking-wide"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={14} /> Add Room
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => {
              const s = ROOM_STATUS_CONFIG[room.status]
              return (
                <div
                  key={room.id}
                  className="border p-5"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p
                        className="font-mono text-xs mb-1"
                        style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-dm-mono)' }}
                      >
                        Room {room.id} · Floor {room.floor}
                      </p>
                      <h3 className="font-semibold text-sm">{room.name}</h3>
                    </div>
                    <span
                      className="text-xs px-2 py-1"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{room.type}</span>
                    <span
                      className="font-display text-base font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                     {formatPeso(room.price)}<span className="text-xs font-normal">/night</span>
                    </span>
                  </div>
                  <div
                    className="mt-3 pt-3 border-t text-xs"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    Last cleaned: {room.lastCleaned}
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Manage status
                      </label>
                      <select
                        value={room.status}
                        onChange={(e) => updateRoomStatus(room.id, e.target.value as RoomItem['status'])}
                        className="text-xs border px-2 py-1"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <input
                      value={room.name}
                      onChange={(e) => updateRoomField(room.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 border text-xs"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
                      placeholder="Room name"
                    />
                    
                   <input
                      type="number"
                      value={room.price}
                      onChange={(e) =>
                        updateRoomField(
                          room.id,
                          'price',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2 py-1.5 border text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'transparent',
                        outline: 'none',
                      }}
                      placeholder="Price"
                    />

                    {/* MAXIMUM GUESTS */}
                    <div>
                      <label
                        className="block text-xs mb-1"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Maximum Guests
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={room.capacity ?? 2}
                        onChange={(e) =>
                          updateRoomField(
                            room.id,
                            'capacity',
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1.5 border text-xs"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: 'transparent',
                          outline: 'none',
                        }}
                        placeholder="Maximum guests"
                      />
                    </div>

                    {/* ROOM SIZE */}
                    <div>
                      <label
                        className="block text-xs mb-1"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Room Size (m²)
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={room.size ?? 28}
                        onChange={(e) =>
                          updateRoomField(
                            room.id,
                            'size',
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1.5 border text-xs"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: 'transparent',
                          outline: 'none',
                        }}
                        placeholder="Room size"
                      />
                    </div>

                    {/* FLOOR */}
                    <div>
                      <label
                        className="block text-xs mb-1"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Floor
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={room.floor}
                        onChange={(e) =>
                          updateRoomField(
                            room.id,
                            'floor',
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1.5 border text-xs"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: 'transparent',
                          outline: 'none',
                        }}
                        placeholder="Floor"
                      />
                    </div>

                    {/* IMAGE URL */}
                    <input
                      value={room.image ?? ''}
                      onChange={(e) =>
                        updateRoomField(
                          room.id,
                          'image',
                          e.target.value
                        )
                      }
                      className="w-full px-2 py-1.5 border text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'transparent',
                        outline: 'none',
                      }}
                      placeholder="Image URL"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Guests tab */}
      {activeTab === 'guests' && (
        <div className="space-y-6">
          <div
            className="border p-6"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-semibold tracking-wide mb-4">Add Walk-In Reservation</h2>
            <form onSubmit={handleWalkInCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="Guest name"
                value={walkInForm.guestName}
                onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              />
              <input
                required
                type="email"
                placeholder="Guest email"
                value={walkInForm.guestEmail}
                onChange={(e) => setWalkInForm({ ...walkInForm, guestEmail: e.target.value })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              />
              <select
                value={walkInForm.roomName}
                onChange={(e) => setWalkInForm({ ...walkInForm, roomName: e.target.value, totalPrice: Number(e.target.value === 'Deluxe King Suite' ? 320 : e.target.value === 'Executive Penthouse' ? 580 : 189) })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              >
                <option value="Classic Double Room">Classic Double Room</option>
                <option value="Deluxe King Suite">Deluxe King Suite</option>
                <option value="Executive Penthouse">Executive Penthouse</option>
              </select>
              <input
                required
                type="date"
                value={walkInForm.checkIn}
                onChange={(e) => setWalkInForm({ ...walkInForm, checkIn: e.target.value })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              />
              <input
                required
                type="date"
                value={walkInForm.checkOut}
                onChange={(e) => setWalkInForm({ ...walkInForm, checkOut: e.target.value })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              />
              <input
                required
                type="number"
                min="1"
                max="4"
                value={walkInForm.guests}
                onChange={(e) => setWalkInForm({ ...walkInForm, guests: Number(e.target.value) })}
                className="px-3 py-2 text-sm border rounded"
                style={{ borderColor: 'var(--border)', backgroundColor: 'transparent', outline: 'none' }}
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm tracking-wide"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                Create Walk-In Booking
              </button>
            </form>
          </div>
          <div
            className="border overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                {['Guest', 'Email', 'Bookings', 'Total Spent', 'Last Stay'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs tracking-widests uppercase"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...new Map(reservations.map((r) => [r.guestEmail, r])).values()].map((r) => {
                const guestReservations = reservations.filter((res) => res.guestEmail === r.guestEmail)
                const totalSpent = guestReservations.reduce((sum, res) => sum + res.totalPrice, 0)
                return (
                  <tr
                    key={r.guestEmail}
                    className="border-b last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: 'var(--primary)', color: 'var(--accent)' }}
                        >
                          {r.guestName.charAt(0)}
                        </div>
                        <span className="font-medium">{r.guestName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--muted-foreground)' }}>{r.guestEmail}</td>
                    <td className="px-6 py-4">{guestReservations.length}</td>
                    <td
                      className="px-6 py-4 font-mono"
                      style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--accent)' }}
                    >
                      {formatPeso(totalSpent)}
                    </td>
                    <td
                      className="px-6 py-4 font-mono text-xs"
                      style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--muted-foreground)' }}
                    >
                      {r.checkIn}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
