export interface ChatResponse {
  keywords: string[]
  answer: string
}

export const hotelResponses: ChatResponse[] = [
  {
    keywords: ['book', 'booking', 'reserve', 'reservation'],
    answer:
      'To book a room:\n\n1. Go to Rooms.\n2. Select your preferred room.\n3. Choose your check-in and check-out dates.\n4. Click Book Now.\n5. Confirm your reservation.',
  },

  {
    keywords: ['cancel', 'cancellation'],
    answer:
      'To cancel your reservation:\n\nGo to My Bookings.\nSelect your reservation.\nClick Cancel Reservation.',
  },

  {
    keywords: ['available', 'availability', 'room available'],
    answer:
      'Room availability depends on your selected check-in and check-out dates. If a room is unavailable, it may already be booked or under maintenance.',
  },

  {
    keywords: ['maintenance'],
    answer:
      'Rooms under maintenance cannot be reserved until maintenance has been completed.',
  },

  {
    keywords: ['cleaning', 'clean'],
    answer:
      'Rooms marked as Cleaning are being prepared for the next guest and will become available once the administrator marks them as cleaned.',
  },

  {
    keywords: ['check in', 'check-in'],
    answer:
      'Guests can check in on the date selected during the reservation process.',
  },

  {
    keywords: ['check out', 'check-out'],
    answer:
      'Guests should check out on the scheduled check-out date indicated in their booking.',
  },

  {
    keywords: ['contact', 'phone', 'email'],
    answer:
      'You may contact Vernay Hotel through the contact information provided on the About page.',
  },
]