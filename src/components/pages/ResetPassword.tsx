import { useState } from 'react'

interface Props {
  token: string
}

export default function ResetPassword({ token }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch( 'https://project-hotel-xz49.onrender.com/api/reset-password',, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      )

      const data = await response.json()

      setMessage(data.message)
    } catch {
      setMessage('Something went wrong.')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <h1 className="text-3xl mb-4">
        Reset Password
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border p-3"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3"
        >
          {loading ? 'Updating...' : 'Reset Password'}
        </button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </div>
  )
}