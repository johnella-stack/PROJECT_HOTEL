import { useState } from 'react'
import './ChatBot.css'

export default function ChatBot() {
  const [open, setOpen] = useState(false)

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
            <p>
              👋 Hello!
            </p>

            <p>
              Welcome to Vernay Hotel.
            </p>

            <p>
              How can I help you today?
            </p>
          </div>

          <div className="chatbot-footer">
            <input
              placeholder="Type your question..."
            />

            <button>
              Send
            </button>
          </div>

        </div>
      )}
    </>
  )
}