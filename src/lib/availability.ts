export const API_URL = 'https://your-render-service.onrender.com'

const toISODateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const getBookedDatesForRoom = async (roomId: string, checkIn: string, checkOut: string): Promise<Set<string>> => {
  // Returns a set of date strings (YYYY-MM-DD) that are blocked for selecting.
  // Important behavior:
  // - If the room is NOT available for ANY part of the selected range, mark the whole range as blocked.
  // - This makes “same dates => unavailable” deterministic (e.g. 2026-09-07 to 2026-10-07).

  const blocked = new Set<string>()
  if (!roomId || !checkIn || !checkOut) return blocked
  if (checkIn >= checkOut) return blocked

  // Ask backend for the full range once.
  const resp = await fetch(
    `${API_URL}/api/rooms/${encodeURIComponent(roomId)}/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
  )

  if (!resp.ok) return blocked

  const data = (await resp.json()) as { available: boolean; bookedForDates: boolean }

  // UI behavior required by your spec:
  // If the backend indicates the room is NOT available for the selected range,
  // mark the entire selected range as blocked (so the other user sees it UNAVAILABLE too).
  if (!data.available) {
    const start = new Date(checkIn + 'T00:00:00')
    const end = new Date(checkOut + 'T00:00:00')
    for (let cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
      blocked.add(toISODateInput(cur))
    }
  }





  return blocked
}


export const dateRangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  // Overlap for half-open intervals [start, end)
  return aStart < bEnd && bStart < aEnd
}

