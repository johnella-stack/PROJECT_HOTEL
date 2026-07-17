const API_URL = "https://project-hotel-xz49.onrender.com"

export async function getRooms() {
  const response = await fetch(`${API_URL}/api/rooms`)

  if (!response.ok) {
    throw new Error("Unable to load rooms")
  }

  return await response.json()
}