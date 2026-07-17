import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './components/pages/Home'
import SearchResults from './components/pages/SearchResults'
import RoomDetail from './components/pages/RoomDetail'
import Confirmation from './components/pages/Confirmation'
import Auth from './components/pages/Auth'
import AdminDashboard from './components/pages/AdminDashboard'
import MyBookings from './components/pages/MyBookings'
import ChatBot from './ChatBot'
import ForgotPassword from './components/pages/ForgotPassword'
import ResetPassword from './components/pages/ResetPassword'

export type Page =
  | 'home'
  | 'search'
  | 'room'
  | 'confirm'
  | 'auth'
  | 'forgot-password'
  | 'reset-password'
  | 'admin'
  | 'my-bookings'

export interface User {
  name: string
  email: string
  role: 'guest' | 'admin'
}

export interface SearchParams {
  checkIn: string
  checkOut: string
  guests: number
  roomType: string
}

export interface Room {
  id: string
  name: string
  type: string
  price: number
  size: number
  capacity: number
  available: boolean
  image: string
  features: string[]
  description: string
  status?: 'available' | 'occupied' | 'cleaning'| 'maintenance'
  floor?: number
  lastCleaned?: string
}

export interface Booking {
  id: string
  room: Room
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  guestName: string
  guestEmail: string
  paymentMethod: string
  status: 'confirmed' | 'pending' | 'cancelled'
  createdAt: string
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [resetToken, setResetToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
   useEffect(() => {
  const params = new URLSearchParams(window.location.search)

  const token = params.get('resetToken')

  if (token) {
    setResetToken(token)
    setPage('reset-password')
  }
}, [])
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    checkIn: '',
    checkOut: '',
    guests: 2,
    roomType: 'any',
  })
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)

  const navigate = (p: Page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p)
  }

  const handleAuthSuccess = (authenticatedUser: User) => {
    if (pendingRoom) {
      setSelectedRoom(pendingRoom)
      setPendingRoom(null)
      navigate('room')
      return
    }

    navigate(authenticatedUser.role === 'admin' ? 'admin' : 'home')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar page={page} navigate={navigate} user={user} setUser={setUser} />
      {page === 'home' && (
        <Home
          navigate={navigate}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
      )}
      {page === 'search' && (
        <SearchResults
          navigate={navigate}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          setSelectedRoom={setSelectedRoom}
          setPendingRoom={setPendingRoom}
          user={user}
        />
      )}
      {page === 'room' && selectedRoom && (
        <RoomDetail
          navigate={navigate}
          room={selectedRoom}
          searchParams={searchParams}
          user={user}
          setLastBooking={setLastBooking}
        />
      )}
      {page === 'confirm' && lastBooking && (
        <Confirmation navigate={navigate} booking={lastBooking} />
      )}
      {page === 'my-bookings' && (
        <MyBookings navigate={navigate} user={user} />
      )}
      {page === 'auth' && (
        <Auth navigate={navigate} setUser={setUser} onAuthSuccess={handleAuthSuccess} />
      )}
      {page === 'reset-password' && (
  <ResetPassword
    token={resetToken}
  />
)}
      {page === 'forgot-password' && (
  <ForgotPassword
    navigate={navigate}
  />
)}
      {page === 'admin' && user?.role === 'admin' && (
        <AdminDashboard navigate={navigate} />
      )}
      <ChatBot />

    </div>
  )
}
