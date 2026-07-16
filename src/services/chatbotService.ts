const API_URL = "https://projecthotel-production.up.railway.app"

export async function getRooms() {
  const response = await fetch(`${API_URL}/api/rooms`)

  if (!response.ok) {
    throw new Error("Unable to load rooms")
  }

  return await response.json()
}