import { useState } from 'react'
import type { Page } from '../../App'

interface Props {
  navigate: (page: Page) => void
}

export default function ForgotPassword({ navigate }: Props) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  console.log("Button clicked!")

  try {
    const response = await fetch('https://project-hotel-xz49.onrender.com/api/forgot-password', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    )

    console.log("Status:", response.status)

    const data = await response.json()

    console.log("Response:", data)

    setMessage(data.message)
  } catch (err) {
    console.error("Fetch error:", err)
  }
}
  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <h1 className="text-3xl mb-4">
        Forgot Password
      </h1>

      <p className="mb-6">
        Enter your email address and we'll send you a password reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          className="w-full border p-3 mb-4"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <button
          className="w-full bg-black text-white py-3"
          type="submit"
        >
          Send Reset Link
        </button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}

      <button
        className="mt-6 underline"
        onClick={() => navigate('auth')}
      >
        Back to Login
      </button>
    </div>
  )
}