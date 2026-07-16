import type { Room } from '../App'

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'

export interface RoomRecord {
  id: string
  name: string
  type: string
  price: number
  status: RoomStatus
  floor: number
  lastCleaned: string
  image?: string
  size?: number
  capacity?: number
  available?: boolean
  bookedForDates?: boolean
}

const API_URL = 'https://projecthotel-production.up.railway.app'

const fallbackImage = (name: string, type: string) => {
  const normalizedName = name.toLowerCase()
  const normalizedType = type.toLowerCase()

  if (normalizedName.includes('penthouse')) {
    return 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=700&h=480&fit=crop&auto=format'
  }
  if (normalizedName.includes('suite') || normalizedType.includes('deluxe')) {
    return 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&h=480&fit=crop&auto=format'
  }
  return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&h=480&fit=crop&auto=format'
}

const normalizeRoomRecord = (
  room: Partial<RoomRecord> & Record<string, unknown>
): RoomRecord => {
  const statusValue = String(room.status ?? 'available').toLowerCase()

  const status: RoomStatus =
  statusValue === 'occupied' ||
  statusValue === 'cleaning' ||
  statusValue === 'maintenance'
    ? statusValue
    : 'available'

  const rawAvailable = (room as Record<string, unknown>).available
  const rawBookedForDates = (room as Record<string, unknown>).bookedForDates
  const rawBookedForDatesSnake = (room as Record<string, unknown>).booked_for_dates
  const rawLastCleaned = (room as Record<string, unknown>).last_cleaned

  const available =
    rawAvailable === true ||
    rawAvailable === 1 ||
    rawAvailable === '1' ||
    rawAvailable === 'true'

  const bookedForDates =
    rawBookedForDates === true ||
    rawBookedForDates === 1 ||
    rawBookedForDates === '1' ||
    rawBookedForDates === 'true' ||
    rawBookedForDatesSnake === true ||
    rawBookedForDatesSnake === 1 ||
    rawBookedForDatesSnake === '1' ||
    rawBookedForDatesSnake === 'true'

  return {
    id: String(room.id ?? ''),
    name: String(room.name ?? 'Room'),
    type: String(room.type ?? 'standard'),
    price: Number(room.price) || 0,
    status,
    floor: Number(room.floor) || 1,

    lastCleaned: String(
      room.lastCleaned ??
        rawLastCleaned ??
        new Date().toISOString()
    ),

    image:
      typeof room.image === 'string'
        ? room.image
        : undefined,

    size:
      room.size !== undefined
        ? Number(room.size)
        : undefined,

    capacity:
      room.capacity !== undefined
        ? Number(room.capacity)
        : undefined,

    available:
      rawAvailable === undefined
        ? status === 'available'
        : available,

    bookedForDates,
  }
}
export const readStoredRooms = (): RoomRecord[] => {
  if (typeof window === 'undefined') return []

  try {
    const saved = window.localStorage.getItem('vernay-rooms')
    if (!saved) return []
    const parsed = JSON.parse(saved) as Array<Partial<RoomRecord>>
    return Array.isArray(parsed) ? parsed.map(normalizeRoomRecord) : []
  } catch {
    return []
  }
}

export const persistStoredRooms = (rooms: RoomRecord[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('vernay-rooms', JSON.stringify(rooms))
}

export const loadRoomsFromServer = async (checkIn?: string, checkOut?: string): Promise<RoomRecord[]> => {
  const params = new URLSearchParams()
  if (checkIn) params.set('checkIn', checkIn)
  if (checkOut) params.set('checkOut', checkOut)

  const query = params.toString()
  const response = await fetch(`${API_URL}/api/rooms${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error('Failed to load rooms')
  const data = await response.json()
  return Array.isArray(data) ? data.map(normalizeRoomRecord) : []
}

export const checkRoomAvailability = async (
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<boolean> => {
  const params = new URLSearchParams({ checkIn, checkOut })
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/availability?${params}`)
  if (!response.ok) throw new Error('Failed to check availability')
  const data = await response.json()
  return Boolean(data.available)
}

export const createRoomInServer = async (room: RoomRecord): Promise<RoomRecord> => {
  const response = await fetch(`${API_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room),
  })

  if (!response.ok) throw new Error('Failed to create room')
  return normalizeRoomRecord(await response.json())
}

export const updateRoomInServer = async (id: string, updates: Partial<RoomRecord>): Promise<RoomRecord> => {
  const response = await fetch(`${API_URL}/api/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) throw new Error('Failed to update room')
  return normalizeRoomRecord(await response.json())
}

export const toPublicRoom = (room: RoomRecord): Room => ({
  id: room.id,
  name: room.name,
  type: room.type.toLowerCase(),
  price: room.price,

  size:
    room.size ??
    (
      room.type.toLowerCase() === 'deluxe'
        ? 45
        : room.type.toLowerCase() === 'executive'
          ? 55
          : 28
    ),

  capacity:
    room.capacity ??
    (room.name.toLowerCase().includes('penthouse') ? 4 : 2),

 available:
  room.available !== false &&
  room.bookedForDates !== true,

  image:
    room.image ??
    fallbackImage(room.name, room.type),

  features: [
    'WiFi',
    'TV',
    'Air Conditioning',
  ],

  description: `${room.name} is currently ${room.status}.`,

  status: room.status,
  floor: room.floor,
  lastCleaned: room.lastCleaned,
})
