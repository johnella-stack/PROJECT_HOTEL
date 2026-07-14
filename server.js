import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const port = process.env.PORT || 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
})

const DEFAULT_ROOMS = [
  { id: '101', name: 'Classic Double Room', type: 'Standard', price: 189, status: 'occupied', floor: 1, last_cleaned: '2026-07-08 09:00', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&h=480&fit=crop&auto=format', size: 28, capacity: 2, available: 0 },
  { id: '205', name: 'Superior Twin Room', type: 'Standard', price: 210, status: 'available', floor: 2, last_cleaned: '2026-07-08 10:15', image: 'https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=700&h=480&fit=crop&auto=format', size: 32, capacity: 2, available: 1 },
  { id: '312', name: 'Deluxe King Suite', type: 'Deluxe', price: 320, status: 'occupied', floor: 3, last_cleaned: '2026-07-07 14:00', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&h=480&fit=crop&auto=format', size: 45, capacity: 2, available: 0 },
  { id: '401', name: 'Junior Suite', type: 'Deluxe', price: 265, status: 'maintenance', floor: 4, last_cleaned: '2026-07-06 11:30', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&h=480&fit=crop&auto=format', size: 52, capacity: 3, available: 0 },
  { id: '502', name: 'Executive Business Room', type: 'Executive', price: 390, status: 'available', floor: 5, last_cleaned: '2026-07-08 08:45', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&h=480&fit=crop&auto=format', size: 55, capacity: 2, available: 1 },
  { id: 'PH1', name: 'Executive Penthouse', type: 'Suite', price: 580, status: 'occupied', floor: 12, last_cleaned: '2026-07-08 07:00', image: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=700&h=480&fit=crop&auto=format', size: 90, capacity: 4, available: 0 },
]

async function seedRooms() {
  for (const room of DEFAULT_ROOMS) {
    await pool.query(
      `INSERT IGNORE INTO rooms (id, name, type, price, status, floor, last_cleaned, image, size, capacity, available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [room.id, room.name, room.type, room.price, room.status, room.floor, room.last_cleaned, room.image, room.size, room.capacity, room.available]
    )
  }
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM rooms')
  console.log(`Rooms in database: ${rows[0].count}`)
}

const mapRoom = (row, bookedForDates = false) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  price: Number(row.price),
  status: row.status,
  floor: row.floor,
  lastCleaned: row.last_cleaned,
  image: row.image ?? undefined,
  size: row.size ?? undefined,
  capacity: row.capacity ?? undefined,
  available: Boolean(row.available) && row.status === 'available' && !bookedForDates,
  bookedForDates,
})

async function ensureBookingsSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM bookings LIKE "room_id"')
  if (!columns.length) {
    await pool.query('ALTER TABLE bookings ADD COLUMN room_id VARCHAR(20) NULL AFTER id')
    await pool.query(
      `UPDATE bookings b
       JOIN rooms r ON LOWER(r.name) = LOWER(b.room_name)
       SET b.room_id = r.id
       WHERE b.room_id IS NULL`
    )
  }
}

async function getBookedRoomIds(checkIn, checkOut) {
  const [rows] = await pool.query(
    `SELECT DISTINCT COALESCE(room_id, (
        SELECT r.id FROM rooms r WHERE LOWER(r.name) = LOWER(b.room_name) LIMIT 1
      )) AS room_id
     FROM bookings b
     WHERE status NOT IN ('cancelled')
       AND check_in < ?
       AND check_out > ?`,
    [checkOut, checkIn]
  )
  return new Set(rows.map((row) => row.room_id).filter(Boolean))
}

async function hasBookingConflict(roomId, checkIn, checkOut) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM bookings
     WHERE status NOT IN ('cancelled')
       AND check_in < ?
       AND check_out > ?
       AND (
         room_id = ?
         OR (room_id IS NULL AND LOWER(room_name) = (
           SELECT LOWER(name) FROM rooms WHERE id = ? LIMIT 1
         ))
       )`,
    [checkOut, checkIn, roomId, roomId]
  )
  return rows[0].count > 0
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, database: 'connected' })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), password, role || 'guest']
    )
    res.json({
      id: result.insertId,
      name,
      email: email.toLowerCase(),
      role: role || 'guest',
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Account already exists' })
    }
    console.error('Register error:', error.message)
    res.status(500).json({ message: 'Unable to register right now' })
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email.toLowerCase(), password]
    )
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Unable to sign in right now' })
  }
})

app.get('/api/users', async (_req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users ORDER BY id')
    res.json(users)
  } catch (error) {
    console.error('Users error:', error.message)
    res.status(500).json({ message: 'Unable to load users' })
  }
})

app.get('/api/bookings', async (_req, res) => {
  try {
    const [bookings] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC')
    res.json(bookings)
  } catch (error) {
    console.error('Bookings error:', error.message)
    res.status(500).json({ message: 'Unable to load bookings' })
  }
})

app.post('/api/bookings', async (req, res) => {
  const booking = req.body
  const roomId = booking.room?.id

  if (!roomId || !booking.checkIn || !booking.checkOut) {
    return res.status(400).json({ message: 'Room and dates are required' })
  }

  if (booking.checkIn >= booking.checkOut) {
    return res.status(400).json({ message: 'Check-out must be after check-in' })
  }

  try {
    const conflict = await hasBookingConflict(roomId, booking.checkIn, booking.checkOut)
    if (conflict) {
      return res.status(409).json({ message: 'This room is not available for the selected dates' })
    }

    await pool.query(
      `INSERT INTO bookings (
        id, room_id, room_name, room_type, room_price, room_image, check_in, check_out, guests, total_price, guest_name, guest_email, payment_method, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        roomId,
        booking.room.name,
        booking.room.type,
        booking.room.price,
        booking.room.image,
        booking.checkIn,
        booking.checkOut,
        booking.guests,
        booking.totalPrice,
        booking.guestName,
        booking.guestEmail,
        booking.paymentMethod,
        booking.status,
        booking.createdAt,
      ]
    )
    res.status(201).json(booking)
  } catch (error) {
    console.error('Create booking error:', error.message)
    res.status(500).json({ message: 'Unable to create booking' })
  }
})

app.put('/api/bookings/:id/status', async (req, res) => {
  const { status } = req.body
  try {
    const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Booking not found' })
    res.json({ ok: true })
  } catch (error) {
    console.error('Update booking error:', error.message)
    res.status(500).json({ message: 'Unable to update booking' })
  }
})

app.get('/api/rooms', async (req, res) => {
  const { checkIn, checkOut } = req.query

  try {
    const [rooms] = await pool.query('SELECT * FROM rooms ORDER BY name')
    let bookedRoomIds = new Set()

    if (checkIn && checkOut && checkIn < checkOut) {
      bookedRoomIds = await getBookedRoomIds(String(checkIn), String(checkOut))
    }

    res.json(
      rooms.map((room) => mapRoom(room, bookedRoomIds.has(room.id)))
    )
  } catch (error) {
    console.error('Rooms error:', error.message)
    res.status(500).json({ message: 'Unable to load rooms' })
  }
})

app.get('/api/rooms/:id/availability', async (req, res) => {
  const { checkIn, checkOut } = req.query

  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: 'checkIn and checkOut are required' })
  }

  if (checkIn >= checkOut) {
    return res.status(400).json({ message: 'Check-out must be after check-in' })
  }

  try {
    const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id])
    if (!rooms.length) return res.status(404).json({ message: 'Room not found' })

    const room = rooms[0]
    const booked = await hasBookingConflict(req.params.id, String(checkIn), String(checkOut))
    const available = Boolean(room.available) && room.status === 'available' && !booked

    res.json({ available, bookedForDates: booked })
  } catch (error) {
    console.error('Availability error:', error.message)
    res.status(500).json({ message: 'Unable to check availability' })
  }
})

app.post('/api/rooms', async (req, res) => {
  const room = req.body
  try {
    await pool.query(
      `INSERT INTO rooms (id, name, type, price, status, floor, last_cleaned, image, size, capacity, available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        room.id,
        room.name,
        room.type,
        room.price,
        room.status || 'available',
        room.floor || 1,
        room.lastCleaned || new Date().toLocaleString(),
        room.image ?? null,
        room.size ?? null,
        room.capacity ?? null,
        room.available !== false ? 1 : 0,
      ]
    )
    res.status(201).json(room)
  } catch (error) {
    console.error('Create room error:', error.message)
    res.status(500).json({ message: 'Unable to create room' })
  }
})

app.put('/api/rooms/:id', async (req, res) => {
  const updates = req.body
  try {
    const [existing] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id])
    if (!existing.length) return res.status(404).json({ message: 'Room not found' })

    const current = mapRoom(existing[0])
    const merged = { ...current, ...updates }

    await pool.query(
      `UPDATE rooms SET name = ?, type = ?, price = ?, status = ?, floor = ?, last_cleaned = ?, image = ?, size = ?, capacity = ?, available = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.type,
        merged.price,
        merged.status,
        merged.floor,
        merged.lastCleaned,
        merged.image ?? null,
        merged.size ?? null,
        merged.capacity ?? null,
        merged.available ? 1 : 0,
        req.params.id,
      ]
    )
    res.json(merged)
  } catch (error) {
    console.error('Update room error:', error.message)
    res.status(500).json({ message: 'Unable to update room' })
  }
})

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(port, async () => {
  try {
    await ensureBookingsSchema()
    await seedRooms()
  } catch (error) {
    console.error('Room seed error:', error.message)
  }
  console.log(`Hotel API running on http://localhost:${port}`)
  console.log(`Connected to MySQL database: ${process.env.DB_NAME || 'hotel_db'}`)
})
