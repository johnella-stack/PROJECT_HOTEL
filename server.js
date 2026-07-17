import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { Resend } from 'resend'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const resend = new Resend(process.env.RESEND_API_KEY)
dotenv.config()
console.log('MYSQLHOST:', process.env.MYSQLHOST)
console.log('MYSQLPORT:', process.env.MYSQLPORT)
console.log('MYSQLUSER:', process.env.MYSQLUSER)
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE)
const app = express()
const port = process.env.PORT || 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
})

const DEFAULT_ROOMS = [
 { id: '101', name: 'Classic Double Room', type: 'Standard', price: 189, status: 'available', floor: 1, last_cleaned: '2026-07-08 09:00', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&h=480&fit=crop&auto=format', size: 28, capacity: 2, available: 1 },
  { id: '205', name: 'Superior Twin Room', type: 'Standard', price: 210, status: 'available', floor: 2, last_cleaned: '2026-07-08 10:15', image: 'https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=700&h=480&fit=crop&auto=format', size: 32, capacity: 2, available: 1 },
  { id: '312', name: 'Deluxe King Suite', type: 'Deluxe', price: 320, status: 'occupied', floor: 3, last_cleaned: '2026-07-07 14:00', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&h=480&fit=crop&auto=format', size: 45, capacity: 2, available: 0 },
  { id: '401', name: 'Junior Suite', type: 'Deluxe', price: 265, status: 'maintenance', floor: 4, last_cleaned: '2026-07-06 11:30', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&h=480&fit=crop&auto=format', size: 52, capacity: 3, available: 0 },
  { id: '502', name: 'Executive Business Room', type: 'Executive', price: 390, status: 'available', floor: 5, last_cleaned: '2026-07-08 08:45', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&h=480&fit=crop&auto=format', size: 55, capacity: 2, available: 1 },
  { id: 'PH1', name: 'Executive Penthouse', type: 'Suite', price: 580, status: 'occupied', floor: 12, last_cleaned: '2026-07-08 07:00', image: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=700&h=480&fit=crop&auto=format', size: 90, capacity: 4, available: 0 },
]
async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'guest'
    )
  `)

  await pool.query(`
  CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    floor INT DEFAULT 1,
    last_cleaned DATETIME,
    size INT DEFAULT 28,
    capacity INT DEFAULT 2,
    image TEXT,
    available TINYINT(1) DEFAULT 1
  )
`)
try {
  await pool.query(`
    ALTER TABLE rooms
    ADD COLUMN capacity INT DEFAULT 2
  `)
} catch (error) {
  if (error.code !== 'ER_DUP_FIELDNAME') {
    throw error
  }
}

try {
  await pool.query(`
    ALTER TABLE rooms
    ADD COLUMN size INT DEFAULT 28
  `)
} catch (error) {
  if (error.code !== 'ER_DUP_FIELDNAME') {
    throw error
  }
}

try {
  await pool.query(`
    ALTER TABLE rooms
    ADD COLUMN image TEXT
  `)
} catch (error) {
  if (error.code !== 'ER_DUP_FIELDNAME') {
    throw error
  }
}

try {
  await pool.query(`
    ALTER TABLE rooms
    ADD COLUMN available TINYINT(1) DEFAULT 1
  `)
} catch (error) {
  if (error.code !== 'ER_DUP_FIELDNAME') {
    throw error
  }
}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(255) PRIMARY KEY,
      room_id VARCHAR(20) NULL,
      room_name VARCHAR(255) NOT NULL,
      room_type VARCHAR(100) NOT NULL,
      room_price DECIMAL(10, 2) NOT NULL,
      room_image TEXT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INT NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      guest_name VARCHAR(255) NOT NULL,
      guest_email VARCHAR(255) NOT NULL,
      payment_method VARCHAR(100) NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Database tables ready')
}
await pool.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

async function seedRooms() {
  for (const room of DEFAULT_ROOMS) {
    await pool.query(
      `INSERT IGNORE INTO rooms (
        id,
        name,
        type,
        price,
        status,
        floor,
        last_cleaned,
        image,
        size,
        capacity,
        available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
     [
      room.id,
      room.name,
      room.type,
      Number(room.price),
      room.status || 'available',
      Number(room.floor) || 1,
      room.last_cleaned || null,
      room.image || null,
      Number(room.size) || 28,
      Number(room.capacity) || 2,
      room.available === false || room.available === 0 ? 0 : 1,
      ]
    )
  } 

  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM rooms'
  )

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
  available:
  row.status !== 'maintenance' &&
  !bookedForDates,
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
    `SELECT DISTINCT COALESCE(
        b.room_id,
        (
          SELECT r.id
          FROM rooms r
          WHERE LOWER(r.name) = LOWER(b.room_name)
          LIMIT 1
        )
      ) AS room_id
     FROM bookings b
     WHERE b.status NOT IN ('cancelled')
       AND b.check_in < ?
       AND b.check_out > ?`,
    [checkOut, checkIn]
  )

  return new Set(
    rows
      .map((row) => String(row.room_id))
      .filter(Boolean)
  )
}

async function hasBookingConflict(roomId, checkIn, checkOut) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM bookings b
     WHERE b.status NOT IN ('cancelled')
       AND b.check_in < ?
       AND b.check_out > ?
       AND (
         b.room_id = ?
         OR (
           b.room_id IS NULL
           AND LOWER(b.room_name) = (
             SELECT LOWER(r.name)
             FROM rooms r
             WHERE r.id = ?
             LIMIT 1
           )
         )
       )`,
    [checkOut, checkIn, roomId, roomId]
  )

  return Number(rows[0].count) > 0
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

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Name, email, and password are required',
    })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await pool.query(
      `INSERT INTO users (
        name,
        email,
        password,
        role
      ) VALUES (?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        role || 'guest',
      ]
    )

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: role || 'guest',
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Account already exists',
      })
    }

    console.error('Register error:', error.message)

    res.status(500).json({
      message: 'Unable to register right now',
    })
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()

    const [rows] = await pool.query(
      `SELECT id, name, email, password, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    )

    if (!rows.length) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    const user = rows[0]
    const storedPassword = String(user.password ?? '')

    const isBcryptPassword =
      storedPassword.startsWith('$2a$') ||
      storedPassword.startsWith('$2b$') ||
      storedPassword.startsWith('$2y$')

    let passwordMatches = false

    if (isBcryptPassword) {
      passwordMatches = await bcrypt.compare(
        password,
        storedPassword
      )
    } else {
      passwordMatches = password === storedPassword

      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(password, 12)

        await pool.query(
          `UPDATE users
           SET password = ?
           WHERE id = ?`,
          [hashedPassword, user.id]
        )

        console.log(
          `Migrated user ${user.id} to hashed password`
        )
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    console.error('Login error:', error.message)

    res.status(500).json({
      message: 'Unable to sign in right now',
    })
  }
})
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      message: 'Email is required'
    })
  }

  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    )

    // Don't reveal whether the email exists
    if (!users.length) {
      return res.json({
        message: 'If that email exists, a password reset link has been sent.'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')

    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.query(
      `INSERT INTO password_resets (email, token, expires_at)
       VALUES (?, ?, ?)`,
      [email.toLowerCase(), token, expires]
    )

    const resetLink =
`https://projecthotel-production.up.railway.app/?resetToken=${token}`
    await resend.emails.send({
  from: 'vernayhotel.noreply@gmail.com',
  to: email,
  subject: 'Vernay Hotel Password Reset',
  html: `
    <h2>Password Reset</h2>

    <p>You requested to reset your password.</p>

    <p>
      <a href="${resetLink}">
        Click here to reset your password
      </a>
    </p>

    <p>This link expires in 1 hour.</p>

    <p>If you didn't request this, ignore this email.</p>
  `
})

res.json({
  message: 'Password reset email sent.'
})

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Unable to send reset email.'
    })
  }
})
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({
      message: 'Token and password are required.'
    })
  }

  try {
    // Find valid token
    const [tokens] = await pool.query(
      `SELECT email
       FROM password_resets
       WHERE token = ?
         AND expires_at > NOW()
       LIMIT 1`,
      [token]
    )

    if (!tokens.length) {
      return res.status(400).json({
        message: 'Invalid or expired reset link.'
      })
    }

    const email = tokens[0].email

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await pool.query(
      `UPDATE users
       SET password = ?
       WHERE email = ?`,
      [hashedPassword, email]
    )

    // Delete the used token
    await pool.query(
      `DELETE FROM password_resets
       WHERE token = ?`,
      [token]
    )

    res.json({
      success: true,
      message: 'Password has been reset successfully.'
    })

  } catch (error) {
    console.error('Reset password error:', error)

    res.status(500).json({
      message: 'Unable to reset password.'
    })
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
    return res.status(400).json({
      message: 'Room and dates are required'
    })
  }

  if (booking.checkIn >= booking.checkOut) {
    return res.status(400).json({
      message: 'Check-out must be after check-in'
    })
  }

  let connection

  try {
    connection = await pool.getConnection()

    await connection.beginTransaction()

    // Lock the selected room.
    // Only one booking request for this room can continue at a time.
    const [rooms] = await connection.query(
      `
        SELECT id, status
        FROM rooms
        WHERE id = ?
        FOR UPDATE
      `,
      [roomId]
    )

    if (rooms.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Room not found'
      })
    }

   if (rooms[0].status === 'maintenance') {
  await connection.rollback()

  return res.status(409).json({
    message: 'This room is under maintenance'
  })
}
    // Check for overlapping active reservations while room is locked.
    const [conflicts] = await connection.query(
      `
        SELECT id
        FROM bookings
        WHERE room_id = ?
          AND status <> 'cancelled'
          AND check_in < ?
          AND check_out > ?
        LIMIT 1
      `,
      [
        roomId,
        booking.checkOut,
        booking.checkIn
      ]
    )

    if (conflicts.length > 0) {
      await connection.rollback()

      return res.status(409).json({
        message:
          'This room is no longer available for the selected dates. Please choose another room or different dates.'
      })
    }

    await connection.query(
      `
        INSERT INTO bookings (
          id,
          room_id,
          room_name,
          room_type,
          room_price,
          room_image,
          check_in,
          check_out,
          guests,
          total_price,
          guest_name,
          guest_email,
          payment_method,
          status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        booking.id,
        roomId,
        booking.room.name,
        booking.room.type,
        booking.room.price,
        booking.room.image ?? null,
        booking.checkIn,
        booking.checkOut,
        booking.guests,
        booking.totalPrice,
        booking.guestName,
        booking.guestEmail,
        booking.paymentMethod,
        booking.status,
      ]
    )

    await connection.commit()

    return res.status(201).json(booking)
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error(
          'Booking rollback error:',
          rollbackError.message
        )
      }
    }

    console.error('Create booking error:', error.message)

    return res.status(500).json({
      message: 'Unable to create booking'
    })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})
app.put('/api/bookings/:id/status', async (req, res) => {
  const connection = await pool.getConnection()

  try {
    const { status } = req.body
    const bookingId = req.params.id

    const allowedStatuses = [
      'pending',
      'confirmed',
      'cancelled',
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid booking status',
      })
    }

    await connection.beginTransaction()

    const [bookings] = await connection.query(
      `SELECT id, room_id, room_name, check_in, check_out
       FROM bookings
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [bookingId]
    )

    if (bookings.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Booking not found',
      })
    }

    const booking = bookings[0]

    let roomId = booking.room_id

    if (!roomId) {
      const [rooms] = await connection.query(
        `SELECT id
         FROM rooms
         WHERE LOWER(name) = LOWER(?)
         LIMIT 1`,
        [booking.room_name]
      )

      if (rooms.length > 0) {
        roomId = rooms[0].id

        await connection.query(
          `UPDATE bookings
           SET room_id = ?
           WHERE id = ?`,
          [roomId, bookingId]
        )
      }
    }

    await connection.query(
      `UPDATE bookings
       SET status = ?
       WHERE id = ?`,
      [status, bookingId]
    )

        if (roomId) {
      if (status === 'confirmed') {
        const formatMySQLDate = (value) => {
          const date = new Date(value)

          if (Number.isNaN(date.getTime())) {
            throw new Error('Invalid booking date')
          }

          return date.toISOString().slice(0, 10)
        }

        const checkInDate = formatMySQLDate(booking.check_in)
        const checkOutDate = formatMySQLDate(booking.check_out)
        const today = getManilaDate()

        console.log('Booking room status check:', {
          roomId,
          today,
          checkInDate,
          checkOutDate,
        })

        await connection.query(
          `UPDATE rooms
           SET status = CASE
             WHEN DATE(?) >= DATE(?)
              AND DATE(?) < DATE(?)
             THEN 'occupied'
             ELSE 'available'
           END,
            available = 1
           WHERE id = ?
             AND status != 'maintenance'`,
          [
            today,
            checkInDate,
            today,
            checkOutDate,
            today,
            checkInDate,
            today,
            checkOutDate,
            roomId,
          ]
        )
      }
    }

    await connection.commit()

    res.json({
      ok: true,
      bookingId,
      roomId,
      status,
    })
  } catch (error) {
    await connection.rollback()

    console.error(
      'Update booking status error:',
      error.message
    )

    res.status(500).json({
      message: 'Unable to update booking',
      error: error.message,
    })
  } finally {
    connection.release()
  }
})
const getManilaDateTime = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}
const getManilaDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
const syncAutomaticRoomStatuses = async () => {
  const today = getManilaDate()

  try {
    // 1. ACTIVE CONFIRMED STAY -> OCCUPIED
    await pool.query(
      `
      UPDATE rooms r
SET
    r.status = 'occupied',
    r.available = 1
WHERE r.status != 'maintenance'
  AND EXISTS (
          SELECT 1
          FROM bookings b
          WHERE CAST(b.room_id AS CHAR) = CAST(r.id AS CHAR)
            AND b.status = 'confirmed'
            AND DATE(?) >= DATE(b.check_in)
            AND DATE(?) < DATE(b.check_out)
        )
      `,
      [today, today]
    )

    // 2. RELEASE STALE OCCUPIED ROOMS
    // If there is no active confirmed stay today,
    // the room must not remain stuck as occupied.
    await pool.query(
  `
  UPDATE rooms r
SET
    r.status = 'available',
    r.available = 1
WHERE r.status = 'occupied'
  AND NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE CAST(b.room_id AS CHAR) = CAST(r.id AS CHAR)
        AND b.status = 'confirmed'
        AND DATE(?) >= DATE(b.check_in)
        AND DATE(?) < DATE(b.check_out)
  )
  `,
  [today, today]
)

    // 3. FINISHED STAY -> CLEANING
    // Only if the room has not been cleaned after checkout.
    await pool.query(
      `
      UPDATE rooms r
      SET
        r.status = 'cleaning',
        r.available = 0
      WHERE r.status != 'maintenance'
        AND r.status != 'occupied'

        AND NOT EXISTS (
          SELECT 1
          FROM bookings active_booking
          WHERE CAST(active_booking.room_id AS CHAR) = CAST(r.id AS CHAR)
            AND active_booking.status = 'confirmed'
            AND DATE(?) >= DATE(active_booking.check_in)
            AND DATE(?) < DATE(active_booking.check_out)
        )

        AND EXISTS (
          SELECT 1
          FROM bookings b
          WHERE CAST(b.room_id AS CHAR) = CAST(r.id AS CHAR)
            AND b.status = 'confirmed'
            AND DATE(?) >= DATE(b.check_out)

            AND (
              r.last_cleaned IS NULL
              OR DATE(r.last_cleaned) < DATE(b.check_out)
            )
        )
      `,
      [today, today, today]
    )

    console.log(
      'Automatic room statuses synchronized:',
      today
    )
  } catch (error) {
    console.error(
      'Automatic room status sync error:',
      error.message
    )
  }
}

app.get('/api/rooms', async (req, res) => {
  const { checkIn, checkOut } = req.query

  try {
   await syncAutomaticRoomStatuses()
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
    const available =
  Boolean(room.available) &&
  room.status !== 'maintenance' &&
  !booked

    res.json({ available, bookedForDates: booked })
  } catch (error) {
    console.error('Availability error:', error.message)
    res.status(500).json({ message: 'Unable to check availability' })
  }
})

app.post('/api/rooms', async (req, res) => {
  try {
    const room = req.body

    await pool.query(
      `INSERT INTO rooms
      (
        id,
        name,
        type,
        price,
        status,
        floor,
        last_cleaned,
        image,
        size,
        capacity,
        available
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        room.id,
        room.name,
        room.type,
        room.price,
        room.status,
        room.floor,
        room.image,
        room.size,
        room.capacity,
        room.available,
      ]
    )

    res.status(201).json(room)
  } catch (error) {
    console.error('Create room error:', error.message)

    res.status(500).json({
      message: 'Unable to create room',
      error: error.message,
    })
  }
})

app.put('/api/rooms/:id', async (req, res) => {
  const updates = req.body

  try {
    const [existing] = await pool.query(
      'SELECT * FROM rooms WHERE id = ?',
      [req.params.id]
    )

    if (!existing.length) {
      return res.status(404).json({
        message: 'Room not found',
      })
    }

    const current = mapRoom(existing[0])
    const merged = { ...current, ...updates }

      let lastCleaned = merged.lastCleaned

const isMarkingAsCleaned =
  updates.status === 'available' &&
  updates.available === true &&
  updates.lastCleaned

if (isMarkingAsCleaned) {
  lastCleaned = getManilaDateTime()
} else if (lastCleaned) {
  const cleanedDate = new Date(lastCleaned)

  if (!Number.isNaN(cleanedDate.getTime())) {
    lastCleaned = cleanedDate
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')
  }
}

    await pool.query(
      `UPDATE rooms
       SET name = ?,
           type = ?,
           price = ?,
           status = ?,
           floor = ?,
           last_cleaned = ?,
           image = ?,
           size = ?,
           capacity = ?,
           available = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.type,
        merged.price,
        merged.status,
        merged.floor,
        lastCleaned ?? null,
        merged.image ?? null,
        merged.size ?? null,
        merged.capacity ?? null,
        merged.available ? 1 : 0,
        req.params.id,
      ]
    )

    const [updatedRows] = await pool.query(
      'SELECT * FROM rooms WHERE id = ?',
      [req.params.id]
    )

    res.json(mapRoom(updatedRows[0]))
  } catch (error) {
    console.error('Update room error:', error)

    res.status(500).json({
      message: 'Unable to update room',
      error: error.message,
    })
  }
})

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
app.listen(port, async () => {
  try {
    await createTables()
    await ensureBookingsSchema()
    await seedRooms()
    await pool.query(
  `UPDATE rooms
   SET status = 'available',
       available = 1
   WHERE id = '101'`
)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error.message)
  }

  console.log(`Hotel API running on http://localhost:${port}`)
  console.log(`Connected to MySQL database: ${process.env.MYSQLDATABASE}`)
})