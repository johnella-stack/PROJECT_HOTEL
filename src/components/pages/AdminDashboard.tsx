import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, TrendingUp,
  CheckCircle, Clock, XCircle, Plus, Search, ArrowUpRight
} from 'lucide-react'
import type { Booking, Page } from '../../App'
import {addBooking,
  loadBookings,
  loadBookingsFromServer,
  updateBookingStatus,
} from '../../lib/bookingStore'
import { createRoomInServer, loadRoomsFromServer, persistStoredRooms, updateRoomInServer, type RoomRecord } from '../../lib/roomStore'
import { formatPeso } from '../../lib/currency'
interface Props {
  navigate: (p: Page) => void
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formatBookingDate = (date: string) => {
  const [year, month, day] = date.split("T")[0].split("-")

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`
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
  completed: {
  icon: <CheckCircle size={13} />,
  color: '#2563eb',
  bg: 'rgba(37,99,235,0.08)',
  label: 'Completed',
},
}


const ROOM_STATUS_CONFIG = {
  available: {
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    label: 'Available',
  },
  occupied: {
    color: 'var(--accent)',
    bg: 'rgba(176,125,58,0.08)',
    label: 'Occupied',
  },
  cleaning: {
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    label: 'Cleaning',
  },
  maintenance: {
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    label: 'Maintenance',
  },
} as const

export default function AdminDashboard({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [reservations, setReservations] = useState<Booking[]>(() => loadBookings())
  const [rooms, setRooms] = useState<RoomItem[]>(ROOMS)
  const [walkInForm, setWalkInForm] = useState({
  
  guestName: '',
  guestEmail: '',
  roomId: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
})
const [selectedReservation, setSelectedReservation] =
  useState<Booking | null>(null)
const today = new Date().toISOString().split('T')[0]

const getMinimumWalkInCheckOut = (checkIn: string) => {
  if (!checkIn) return today

  const date = new Date(`${checkIn}T00:00:00`)
  date.setDate(date.getDate() + 1)

  return date.toISOString().split('T')[0]
}

const minimumWalkInCheckOut =
  getMinimumWalkInCheckOut(walkInForm.checkIn)
  const availableWalkInRooms = useMemo(() => {
  if (!walkInForm.checkIn || !walkInForm.checkOut) {
    return []
  }

  return rooms.filter((room) => {
    if (room.status !== 'available') {
      return false
    }

    const hasDateConflict = reservations.some((booking) => {
      if (booking.status === 'cancelled') {
        return false
      }

      if (String(booking.room.id) !== String(room.id)) {
        return false
      }

      return (
        walkInForm.checkIn < booking.checkOut &&
        walkInForm.checkOut > booking.checkIn
      )
    })

    return !hasDateConflict
  })
}, [
  rooms,
  reservations,
  walkInForm.checkIn,
  walkInForm.checkOut,
])
const selectedWalkInRoom = useMemo(
  () => rooms.find((room) => room.id === walkInForm.roomId),
  [rooms, walkInForm.roomId]
)

const walkInNights = useMemo(() => {
  if (!walkInForm.checkIn || !walkInForm.checkOut) {
    return 0
  }

  const checkIn = new Date(walkInForm.checkIn)
  const checkOut = new Date(walkInForm.checkOut)

  const difference =
    checkOut.getTime() - checkIn.getTime()

  return Math.max(
    0,
    Math.ceil(difference / 86400000)
  )
}, [walkInForm.checkIn, walkInForm.checkOut])

const walkInTotal =
  selectedWalkInRoom && walkInNights > 0
    ? selectedWalkInRoom.price * walkInNights
    : 0



  useEffect(() => {
  let mounted = true

  const syncReservations = async () => {
    try {
      const serverBookings = await loadBookingsFromServer()

      if (mounted) {
        setReservations(serverBookings)
      }
    } catch (error) {
      console.error(
        'Failed to load reservations from server:',
        error
      )

      if (mounted) {
        setReservations(loadBookings())
      }
    }
  }

  void syncReservations()

  return () => {
    mounted = false
  }
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

  const confirmed = reservations.filter(
  (r) => r.status === 'confirmed'
).length

const pending = reservations.filter(
  (r) => r.status === 'pending'
).length

const revenue = reservations
  .filter((r) => r.status === 'confirmed')
  .reduce((sum, r) => sum + r.totalPrice, 0)

const filteredRes = useMemo(() => {
  const query = searchQuery.toLowerCase()

  return reservations.filter((r) => {
    const guestName = r.guestName ?? ''
    const bookingId = r.id ?? ''
    const roomName = r.room?.name ?? ''

    return (
      guestName.toLowerCase().includes(query) ||
      bookingId.toLowerCase().includes(query) ||
      roomName.toLowerCase().includes(query)
    )
  })
}, [reservations, searchQuery])
useEffect(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  reservations.forEach((booking) => {
    if (booking.status !== 'confirmed') return

    const checkOut = new Date(booking.checkOut)
    checkOut.setHours(0, 0, 0, 0)

    if (checkOut <= today) {
      updateStatus(booking.id, 'completed')
    }
  })
}, [reservations])
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

const markRoomAsCleaned = async (roomId: string) => {
  try {
    const cleanedAt = new Date().toISOString()

    const updatedRoom = await updateRoomInServer(roomId, {
      status: 'available',
      available: true,
      lastCleaned: cleanedAt,
    })

    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === roomId ? updatedRoom : room
      )
    )
  } catch (error) {
    console.error('Mark room as cleaned error:', error)
    alert('Unable to mark room as cleaned.')
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

  const handleWalkInCreate = async (
  e: React.FormEvent
) => {
  e.preventDefault()

  if (!selectedWalkInRoom) {
    alert('Please select a room.')
    return
  }

  if (!walkInForm.checkIn || !walkInForm.checkOut) {
    alert('Please select check-in and check-out dates.')
    return
  }

  if (walkInNights <= 0) {
    alert('Check-out date must be after check-in date.')
    return
  }

  if (
    walkInForm.guests < 1 ||
    walkInForm.guests > (selectedWalkInRoom.capacity ?? 2)
  ) {
    alert(
      `This room allows a maximum of ${
        selectedWalkInRoom.capacity ?? 2
      } guests.`
    )
    return
  }

  const booking: Booking = {
    id: `VNY-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`,

    room: {
      id: selectedWalkInRoom.id,
      name: selectedWalkInRoom.name,
      type: selectedWalkInRoom.type.toLowerCase(),
      price: selectedWalkInRoom.price,
      size: selectedWalkInRoom.size ?? 28,
      capacity: selectedWalkInRoom.capacity ?? 2,
      available: true,
      image:
        selectedWalkInRoom.image ??
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&h=480&fit=crop&auto=format',
      features: ['WiFi', 'TV', 'Air Conditioning'],
      description: `${selectedWalkInRoom.name} front desk reservation.`,
    },

    checkIn: walkInForm.checkIn,
    checkOut: walkInForm.checkOut,
    guests: walkInForm.guests,
    totalPrice: walkInTotal,
    guestName: walkInForm.guestName,
    guestEmail: walkInForm.guestEmail,
    paymentMethod: 'cash',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }

  try {
    const savedBooking = await addBooking(booking)

    const serverBookings = await loadBookingsFromServer()

setReservations(serverBookings)

    setWalkInForm({
      guestName: '',
      guestEmail: '',
      roomId: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
    })

    alert('Reservation created successfully!')
  } catch (error) {
    console.error(
      'CREATE FRONT DESK RESERVATION ERROR:',
      error
    )

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to create reservation'
    )
  }
}
  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'reservations', label: 'Reservations', icon: <CalendarCheck size={15} /> },
    { id: 'rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { id: 'guests', label: 'Guests', icon: <Users size={15} /> },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-10 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
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
          className="w-full sm:w-auto justify-center text-xs sm:text-sm tracking-wide flex items-center gap-2 px-4 py-2.5 border transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--border)' }}
        >
          View Site <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Tab nav */}
      <div
  className="flex overflow-x-auto whitespace-nowrap border-b mb-6 sm:mb-8 -mx-3 px-3 sm:mx-0 sm:px-0"
  style={{
    borderColor: 'var(--border)',
    scrollbarWidth: 'none',
  }}
>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-xs sm:text-sm tracking-wide border-b-2 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
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
                className="p-4 sm:p-5 border min-w-0"
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
                  className="font-display text-2xl sm:text-3xl font-semibold break-words"
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
              className="px-3 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
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
                        className="px-3 sm:px-6 py-3 text-left text-xs tracking-widests uppercase"
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
                         className="px-3 sm:px-6 py-3.5 whitespace-nowrap font-mono text-xs"
                          style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--muted-foreground)' }}
                        >
                          {r.id}
                        </td>
                        <td className="px-6 py-3.5 font-medium">{r.guestName}</td>
                        <td className="px-6 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{r.room?.name ?? 'Unknown Room'}</td>
                        <td className="px-6 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{formatBookingDate(r.checkIn)}</td>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="relative flex items-center w-full sm:w-[280px]">
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
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 text-sm tracking-wide"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={14} /> New Reservation
            </button>
          </div>
          <div
            className="border overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full min-w-[700px] text-sm">
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
                        <td className="px-5 py-3" style={{ color: 'var(--muted-foreground)' }}>{r.room?.name ?? 'Unknown Room'}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatBookingDate(r.checkIn)}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatBookingDate(r.checkOut)}</td>
                        <td className="px-5 py-3 font-mono" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatPeso(r.totalPrice)}</td>
                        <td className="px-5 py-3">
                          <span
                            className="flex items-center gap-1.5 w-fit text-xs px-2 py-1"
                            style={{ backgroundColor: s.bg, color: s.color }}
                          >
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
  <div className="flex gap-2">
    <button
  onClick={() => setSelectedReservation(r)}
  className="px-3 py-1 border text-sm"
>
  View
</button>

    <select
      value={r.status}
      onChange={(e) =>
        updateStatus(
          r.id,
          e.target.value as Booking['status']
        )
      }
      className="text-xs border px-2 py-1"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'transparent',
      }}
    >
      <option value="confirmed">Confirm</option>
      <option value="pending">Pending</option>
      <option value="cancelled">Cancel</option>
    </select>
  </div>
</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* MOBILE RESERVATION CARDS */}
<div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
  {filteredRes.length === 0 ? (
    <div className="px-5 py-10 text-center">
      <p
        className="text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        No reservations found.
      </p>
    </div>
  ) : (
    filteredRes.map((r) => {
      const s = STATUS_CONFIG[r.status]

      return (
        <div
          key={r.id}
          className="p-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* ID + STATUS */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p
                className="text-[10px] tracking-[0.2em] uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Booking ID
              </p>

              <p
                className="font-mono text-xs break-all"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  color: 'var(--accent)',
                }}
              >
                {r.id}
              </p>
            </div>

            <span
              className="shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1"
              style={{
                backgroundColor: s.bg,
                color: s.color,
              }}
            >
              {s.icon}
              {s.label}
            </span>
          </div>

          {/* GUEST */}
          <div className="mb-4">
            <p className="font-medium text-base">
              {r.guestName || 'Unknown Guest'}
            </p>

            <p
              className="text-xs mt-1 break-all"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {r.guestEmail || 'No email provided'}
            </p>
          </div>

          {/* DETAILS */}
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-4 py-4 border-y"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Room
              </p>

              <p className="text-sm font-medium">
                {r.room?.name ?? 'Unknown Room'}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Guests
              </p>

              <p className="text-sm font-medium">
                {r.guests} guest{r.guests !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Check-In
              </p>

              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
                {r.checkIn}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Check-Out
              </p>

              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
               {formatBookingDate(r.checkOut)}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Payment
              </p>

              <p className="text-sm capitalize">
                {r.paymentMethod === 'card'
                  ? 'Card'
                  : 'Pay at hotel'}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] tracking-wider uppercase mb-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Total
              </p>

              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                {formatPeso(r.totalPrice)}
              </p>
            </div>
          </div>

          {/* ACTION */}
          <div className="pt-4 space-y-3">
  <button
    onClick={() => setSelectedReservation(r)}
    className="w-full px-4 py-3 border text-sm font-medium transition-opacity hover:opacity-80"
    style={{
      borderColor: 'var(--border)',
      backgroundColor: 'var(--card)',
    }}
  >
    View Reservation
  </button>

  <select
    value={r.status}
    onChange={(e) =>
      updateStatus(
        r.id,
        e.target.value as Booking['status']
      )
    }
    className="w-full px-3 py-3 text-sm border"
    style={{
      borderColor: 'var(--border)',
      backgroundColor: 'var(--card)',
      outline: 'none',
    }}
  >
    <option value="confirmed">Confirm Reservation</option>
    <option value="pending">Mark as Pending</option>
    <option value="cancelled">Cancel Reservation</option>
    <option value="completed">Completed</option>
  </select>
</div>
        </div>
      )
    })
  )}
</div>
          </div>
        </div>

      )}

      {/* Rooms tab */}
      {activeTab === 'rooms' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex flex-wrap gap-2 sm:gap-3">
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
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 text-sm tracking-wide"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={14} /> Add Room
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
            {rooms.map((room) => {
              const s = ROOM_STATUS_CONFIG[room.status]
              return (
                <div
                  key={room.id}
                  className="border p-3 sm:p-5 min-w-0 overflow-hidden"
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
                        <option value="cleaning">Cleaning</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                      {room.status === 'cleaning' && (
                        <button
                          type="button"
                          onClick={() => markRoomAsCleaned(room.id)}
                          className="w-full mt-2 px-3 py-2 text-xs tracking-[0.15em] uppercase border transition-opacity hover:opacity-70"
                          style={{
                            borderColor: '#2563eb',
                            color: '#2563eb',
                            backgroundColor: 'rgba(37,99,235,0.05)',
                          }}
                        >
                          Mark as Cleaned
                        </button>
                      )}
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
                      className="w-full min-w-0 px-2 py-2 border text-xs"
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
 className="w-full min-w-0 border p-3 sm:p-6 overflow-hidden"
  style={{
    backgroundColor: 'var(--card)',
    borderColor: 'var(--border)',
  }}
>
  <div className="mb-6">
    <p
      className="text-xs tracking-[0.3em] uppercase mb-2"
      style={{ color: 'var(--accent)' }}
    >
      Front Desk
    </p>

    <h2 className="text-xl sm:text-2xl font-semibold">
      Create Reservation
    </h2>

    <p
      className="text-sm mt-1"
      style={{ color: 'var(--muted-foreground)' }}
    >
      Add a walk-in or front desk booking.
    </p>
  </div>

  <form
    onSubmit={handleWalkInCreate}
    className="w-full min-w-0 space-y-4 sm:space-y-5"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="min-w-0">
        <label
          className="block text-xs tracking-wide uppercase mb-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Guest Name
        </label>

        <input
          required
          placeholder="Enter guest name"
          value={walkInForm.guestName}
          onChange={(e) =>
            setWalkInForm({
              ...walkInForm,
              guestName: e.target.value,
            })
          }
          className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            outline: 'none',
          }}
        />
      </div>

      <div className="min-w-0">
        <label
          className="block text-xs tracking-wide uppercase mb-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Guest Email
        </label>

        <input
          required
          type="email"
          placeholder="guest@email.com"
          value={walkInForm.guestEmail}
          onChange={(e) =>
            setWalkInForm({
              ...walkInForm,
              guestEmail: e.target.value,
            })
          }
          className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            outline: 'none',
          }}
        />
      </div>
    </div>

    {/* CHECK-IN / CHECK-OUT */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="min-w-0">
    <label
      className="block text-xs tracking-wide uppercase mb-2"
      style={{ color: 'var(--muted-foreground)' }}
    >
      Check-In
    </label>

    <input
      required
      type="date"
      min={today}
      value={walkInForm.checkIn}
      onChange={(e) => {
        const newCheckIn = e.target.value
        const newMinimumCheckOut =
          getMinimumWalkInCheckOut(newCheckIn)

        setWalkInForm((current) => ({
          ...current,
          checkIn: newCheckIn,
          checkOut:
            !current.checkOut ||
            current.checkOut < newMinimumCheckOut
              ? newMinimumCheckOut
              : current.checkOut,
          roomId: '',
          guests: 1,
        }))
      }}
      className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'transparent',
        outline: 'none',
      }}
    />
  </div>

  <div className="min-w-0">
    <label
      className="block text-xs tracking-wide uppercase mb-2"
      style={{ color: 'var(--muted-foreground)' }}
    >
      Check-Out
    </label>

    <input
      required
      type="date"
      min={minimumWalkInCheckOut}
      value={walkInForm.checkOut}
      onChange={(e) =>
        setWalkInForm((current) => ({
          ...current,
          checkOut: e.target.value,
          roomId: '',
          guests: 1,
        }))
      }
      className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'transparent',
        outline: 'none',
      }}
    />
  </div>
</div>

{/* SELECT AVAILABLE ROOM */}
<div>
  <label
    className="block text-xs tracking-wide uppercase mb-2"
    style={{ color: 'var(--muted-foreground)' }}
  >
    Select Room
  </label>

  <select
    required
    disabled={!walkInForm.checkIn || !walkInForm.checkOut}
    value={walkInForm.roomId}
    onChange={(e) => {
      const selectedRoom = rooms.find(
        (room) => room.id === e.target.value
      )

      setWalkInForm((current) => ({
        ...current,
        roomId: e.target.value,
        guests: Math.min(
          Math.max(current.guests, 1),
          selectedRoom?.capacity ?? 2
        ),
      }))
    }}
    className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      borderColor: 'var(--border)',
      backgroundColor: 'var(--card)',
      outline: 'none',
    }}
  >
    <option value="">
      {!walkInForm.checkIn || !walkInForm.checkOut
        ? 'Select check-in and check-out dates first'
        : availableWalkInRooms.length === 0
          ? 'No rooms available for these dates'
          : 'Choose an available room'}
    </option>

    {availableWalkInRooms.map((room) => (
      <option
        key={room.id}
        value={room.id}
      >
        {room.name} — {formatPeso(room.price)} / night
      </option>
    ))}
  </select>

  {walkInForm.checkIn &&
    walkInForm.checkOut &&
    availableWalkInRooms.length === 0 && (
      <p
        className="text-xs mt-2"
        style={{ color: '#dc2626' }}
      >
        No available rooms for the selected dates.
      </p>
    )}

  {selectedWalkInRoom && (
    <div
      className="mt-3 p-3 border text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div>
        <p className="font-medium">
          {selectedWalkInRoom.name}
        </p>

        <p
          className="text-xs mt-1"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Floor {selectedWalkInRoom.floor} · Up to{' '}
          {selectedWalkInRoom.capacity ?? 2} guests
        </p>
      </div>

      <p
        className="font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        {formatPeso(selectedWalkInRoom.price)}
        <span
          className="text-xs font-normal"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {' '} / night
        </span>
      </p>
    </div>
  )}
</div>
  
      <div>
  <label
    className="block text-xs tracking-wide uppercase mb-2"
    style={{ color: 'var(--muted-foreground)' }}
  >
    Number of Guests
  </label>

  <input
    required
    type="number"
    min="1"
    max={selectedWalkInRoom?.capacity ?? 1}
    value={walkInForm.guests === 0 ? '' : walkInForm.guests}
    onChange={(e) => {
      const value = e.target.value

      setWalkInForm({
        ...walkInForm,
        guests: value === '' ? 0 : Number(value),
      })
    }}
    onBlur={() => {
      if (walkInForm.guests < 1) {
        setWalkInForm({
          ...walkInForm,
          guests: 1,
        })
      }
    }}
    className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border box-border"
    style={{
      borderColor: 'var(--border)',
      backgroundColor: 'transparent',
      outline: 'none',
    }}
  />

  {selectedWalkInRoom && (
    <p
      className="text-xs mt-2"
      style={{ color: 'var(--muted-foreground)' }}
    >
      Maximum {selectedWalkInRoom.capacity ?? 2} guests
      for this room.
    </p>
  )}
</div>

    <div
      className="p-4 border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className="text-xs tracking-[0.2em] uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Reservation Total
          </p>

          {walkInNights > 0 && selectedWalkInRoom && (
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {formatPeso(selectedWalkInRoom.price)} ×{' '}
              {walkInNights} night
              {walkInNights !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <p
          className="text-xl sm:text-2xl font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          {formatPeso(walkInTotal)}
        </p>
      </div>
    </div>

    <button
      type="submit"
      className="w-full px-5 py-3.5 text-sm tracking-[0.15em] uppercase font-medium transition-opacity hover:opacity-90"
      style={{
        backgroundColor: 'var(--accent)',
        color: 'white',
      }}
    >
      Create Reservation
    </button>
  </form>
</div>
          <div
  className="w-full min-w-0 border overflow-x-auto"
  style={{
    backgroundColor: 'var(--card)',
    borderColor: 'var(--border)',
    WebkitOverflowScrolling: 'touch',
  }}
>
  <table className="w-full min-w-[700px] text-sm">
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
                      {formatBookingDate(r.checkIn)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

{selectedReservation && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onClick={() => setSelectedReservation(null)}
  >
    <div
      className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-5 sm:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-semibold mb-4">
        Reservation Details
      </h2>

      <div className="space-y-2">
        <p><strong>Reservation ID:</strong> {selectedReservation.id}</p>
        <p><strong>Guest:</strong> {selectedReservation.guestName}</p>
        <p><strong>Email:</strong> {selectedReservation.guestEmail}</p>
        <p><strong>Room:</strong> {selectedReservation.room.name}</p>
        <p>
          <strong>Check-In:</strong>{" "}
          {formatBookingDate(selectedReservation.checkIn)}
       </p>
        <p>
          <strong>Check-Out:</strong>{" "}
          {formatBookingDate(selectedReservation.checkOut)}
        </p>
        <p><strong>Guests:</strong> {selectedReservation.guests}</p>
        <p><strong>Payment:</strong> {selectedReservation.paymentMethod}</p>
        <p><strong>Total:</strong> {formatPeso(selectedReservation.totalPrice)}</p>
        <p><strong>Status:</strong> {selectedReservation.status}</p>
      </div>

        <div className="mt-6 flex justify-end">
        <button
          onClick={() => setSelectedReservation(null)}
          className="w-full sm:w-auto px-5 py-3 rounded bg-[#0B1736] text-white"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}
