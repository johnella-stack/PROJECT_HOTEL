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