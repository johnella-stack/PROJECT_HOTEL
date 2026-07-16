import { useState, useEffect, useRef } from 'react'
import { hotelResponses } from './hotelResponses'
import './ChatBot.css'
import { getRooms } from "./services/chatbotService"

interface HotelRoom {
  id: string
  name: string
  type: string
  price: number
  capacity: number
  size: number
  floor: number
  status: string
  available: boolean
}
type Message = {
  sender: 'user' | 'bot'
  text: string
  time: string
}

export default function ChatBot() {
  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [rooms, setRooms] = useState<HotelRoom[]>([])
  const [typing, setTyping] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      time: getTime(),
      text:
        "👋 Welcome to Vernay Hotel!\n\nI'm your Virtual Concierge.\n\nI can help you with:\n\n🏨 Room Reservations\n📅 Room Availability\n❌ Cancellation\n🧹 Room Status\n🏨 Room Information\n📞 Contact Information\n\nHow may I assist you today?",
    },
  ])

  useEffect(() => {

  const loadRooms = async () => {
    try {
      const data = await getRooms()
      setRooms(data)
    } catch (err) {
      console.error(err)
    }
  }

  loadRooms()

  if (open) {
    inputRef.current?.focus()
  }

}, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, typing])

 const findResponse = (question: string) => {
  const lower = question.toLowerCase()

  // =========================
  // CHEAPEST ROOM
  // =========================
  if (lower.includes("cheapest") || lower.includes("cheap")) {

    const cheapest = [...rooms].sort((a, b) => a.price - b.price)[0]

    if (cheapest) {
      return {
        answer: `💰 Cheapest Room

🏨 ${cheapest.name}

₱${cheapest.price} per night`
      }
    }
  }

  // =========================
  // LARGEST ROOM
  // =========================
  if (lower.includes("largest") || lower.includes("biggest")) {

    const largest = [...rooms].sort((a, b) => b.size - a.size)[0]

    if (largest) {
      return {
        answer: `🏨 Largest Room

${largest.name}

📐 ${largest.size} sqm`
      }
    }
  }

  // =========================
  // SPECIFIC ROOM
  // =========================
  const room = rooms.find(r =>
    lower.includes(r.name.toLowerCase())
  )

  if (room) {
    return {
      answer: `🏨 ${room.name}

💰 Price: ₱${room.price}

🛏 Type: ${room.type}

👥 Capacity: ${room.capacity}

📐 Size: ${room.size} sqm

🏢 Floor: ${room.floor}

📌 Status: ${room.status}`
    }
  }

  // =========================
  // DEFAULT RESPONSES
  // =========================
  return hotelResponses.find((item) =>
    item.keywords.some((keyword) => {
      const words = keyword.toLowerCase().split(" ")
      return words.every((word) => lower.includes(word))
    })
  )
}

  

  const resetChat = () => {
    setTyping(false)

    setMessages([
      {
        sender: 'bot',
        time: getTime(),
        text:
          "👋 Welcome to Vernay Hotel!\n\nI'm your Virtual Concierge.\n\nHow may I assist you today?",
      },
    ])
  }

  const sendMessage = () => {
    if (!input.trim()) return

    const room = rooms.find((r) =>
  input.toLowerCase().includes(r.name.toLowerCase())
)

let found

if (room) {
  found = {
    answer: `🏨 ${room.name}

💰 Price: ₱${room.price}

🛏 Type: ${room.type}

👥 Capacity: ${room.capacity}

📐 Size: ${room.size} sqm

🏢 Floor: ${room.floor}

📌 Status: ${room.status}`,
  }
} else {
  found = findResponse(input)
}

    const userMessage: Message = {
      sender: 'user',
      text: input,
      time: getTime(),
    }

    const botMessage: Message = {
      sender: 'bot',
      time: getTime(),
      text:
        found?.answer ??
        `I'm sorry, I couldn't understand your question.

Try asking about:

🏨 Booking a room
📅 Room availability
❌ Cancellation
🧹 Cleaning
🔧 Maintenance
🏨 Deluxe King Suite
🏨 Executive Penthouse
📞 Contact Information`,
    }

    setMessages((prev) => [...prev, userMessage])

    setTyping(true)

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage])
      setTyping(false)
    }, 1000)

    setInput('')
  }

  const quickQuestion = (question: string) => {
    const found = findResponse(question)

    const userMessage: Message = {
      sender: 'user',
      text: question,
      time: getTime(),
    }

    const botMessage: Message = {
      sender: 'bot',
      time: getTime(),
      text:
        found?.answer ??
        "I'm sorry, I couldn't understand your question.",
    }

    setMessages((prev) => [...prev, userMessage])

    setTyping(true)

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage])
      setTyping(false)
    }, 1000)
  }
    return (
    <>
      {/* Floating Button */}
      <button
        className="chatbot-button"
        onClick={() => setOpen(!open)}
      >
        💬
      </button>

      {open && (
        <div className="chatbot-window">

          {/* Header */}
          <div className="chatbot-header">

            <div className="chatbot-title">

              <div className="hotel-avatar">
                🏨
              </div>

              <div>
                <div className="hotel-name">
                  Vernay Virtual Concierge
                </div>

                <div className="hotel-status">
                  ● Online
                </div>
              </div>

            </div>

            <div className="chatbot-actions">

              <button
                className="chatbot-clear"
                onClick={resetChat}
                title="Clear Chat"
              >
                🗑
              </button>

              <button
                className="chatbot-close"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>

            </div>

          </div>

          {/* Body */}

          <div className="chatbot-body">

            {messages.length === 1 && (

              <div className="quick-actions">

                <button
                  onClick={() => quickQuestion('Book Room')}
                >
                  🏨 Book Room
                </button>

                <button
                  onClick={() => quickQuestion('Room Availability')}
                >
                  📅 Availability
                </button>

                <button
                  onClick={() => quickQuestion('Deluxe King Suite')}
                >
                  🛏 Deluxe Suite
                </button>

                <button
                  onClick={() => quickQuestion('Executive Penthouse')}
                >
                  👑 Penthouse
                </button>

                <button
                  onClick={() => quickQuestion('Cancel Reservation')}
                >
                  ❌ Cancel
                </button>

                <button
                  onClick={() => quickQuestion('Cleaning')}
                >
                  🧹 Cleaning
                </button>

                <button
                  onClick={() => quickQuestion('Contact')}
                >
                  📞 Contact
                </button>

              </div>

            )}

            {messages.map((message, index) => (

              <div
                key={index}
                className={
                  message.sender === 'user'
                    ? 'user-message'
                    : 'bot-message'
                }
              >

                {message.text}

                <div className="message-time">
                  {message.time}
                </div>

              </div>

            ))}

            {typing && (

              <div className="bot-message">

                🤖 Vernay Virtual Concierge

                <div className="typing">

                  <span></span>

                  <span></span>

                  <span></span>

                </div>

              </div>

            )}

            <div ref={bottomRef}></div>

          </div>

          {/* Footer */}

          <div className="chatbot-footer">

            <input
              ref={inputRef}
              value={input}
              placeholder="Ask me anything about Vernay Hotel..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage()
                }
              }}
            />

            <button
              onClick={sendMessage}
            >
              Send
            </button>

          </div>

        </div>
      )}

    </>
  )
}