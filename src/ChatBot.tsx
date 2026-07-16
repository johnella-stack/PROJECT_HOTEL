import { useState } from 'react'
import { hotelResponses } from './hotelResponses'
import './ChatBot.css'

export default function ChatBot() {
  const [open, setOpen] = useState(false)

const [input, setInput] = useState('')

const [messages, setMessages] = useState([
  {
    sender: 'bot',
    text: '👋 Hello! Welcome to Vernay Hotel.\n\nHow can I help you today?',
  },
])
const sendMessage = () => {
  if (!input.trim()) return

  const userMessage = {
    sender: 'user',
    text: input,
  }

  const lower = input.toLowerCase()

  const found = hotelResponses.find((item) =>
    item.keywords.some((keyword) => lower.includes(keyword))
  )

  const botMessage = {
    sender: 'bot',
    text: found
      ? found.answer
      : "I'm sorry, I don't understand that yet. Please try asking about booking, cancellation, room availability, maintenance, or check-in.",
  }

  setMessages((prev) => [...prev, userMessage, botMessage])

  setInput('')
}
const quickQuestion = (question: string) => {
  setInput(question)

  const lower = question.toLowerCase()

  const found = hotelResponses.find(item =>
    item.keywords.some(keyword => lower.includes(keyword))
  )

  const userMessage = {
    sender: 'user',
    text: question,
  }

  const botMessage = {
    sender: 'bot',
    text: found
      ? found.answer
      : "Sorry, I don't understand that yet.",
  }

  setMessages(prev => [...prev, userMessage, botMessage])
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

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">

          <div className="chatbot-header">
            <span>🤖 Vernay Assistant</span>

            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="chatbot-body">
            <div className="quick-actions">

  <button onClick={() => quickQuestion('Book Room')}>
    🏨 Book Room
  </button>

  <button onClick={() => quickQuestion('Room Availability')}>
    📅 Availability
  </button>

  <button onClick={() => quickQuestion('Cancel Reservation')}>
    ❌ Cancel
  </button>

  <button onClick={() => quickQuestion('Cleaning')}>
    🧹 Cleaning
  </button>

  <button onClick={() => quickQuestion('Contact')}>
    📞 Contact
  </button>

</div>
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
    </div>
  ))}
</div>

         <div className="chatbot-footer">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') sendMessage()
    }}
    placeholder="Type your question..."
  />

  <button onClick={sendMessage}>
    Send
  </button>
</div>

        </div>
      )}
    </>
  )
}