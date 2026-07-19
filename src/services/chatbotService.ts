

export async function getRooms() {
  const response = await fetch(`/api/rooms`)

  if (!response.ok) {
    throw new Error("Unable to load rooms")
  }

  return await response.json()
}