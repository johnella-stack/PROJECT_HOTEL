export interface ChatResponse {
  keywords: string[]
  answer: string
}

export const hotelResponses: ChatResponse[] = [

{
keywords:[
"hello",
"hi",
"hey",
"good morning",
"good afternoon",
"good evening"
],

answer:
`👋 Hello!

Welcome to Vernay Hotel.

How may I assist you today?`
},

{
keywords:[
"thank you",
"thanks"
],

answer:
`😊 You're welcome!

Thank you for choosing Vernay Hotel.

Have a wonderful stay!`
},

{
keywords:[
"book",
"booking",
"reserve",
"reservation",
"book room",
"reserve room",
"need room",
"i need room",
"i want room",
"i want to book"
],

answer:
`🏨 Booking a Room

1. Go to Rooms.

2. Select your preferred room.

3. Choose your check-in and check-out dates.

4. Click Book Now.

5. Confirm your reservation.`
},

{
keywords:[
"cancel",
"cancel reservation",
"cancel booking"
],

answer:
`❌ Cancel Reservation

Go to My Bookings.

Choose the reservation.

Click Cancel Reservation.

If your booking is still eligible, it will be cancelled immediately.`
},

{
keywords:[
"available",
"availability",
"room available"
],

answer:
`📅 Room Availability

Room availability depends on your selected dates.

If a room is unavailable, it may already be reserved or currently under maintenance.`
},

{
keywords:[
"clean",
"cleaning"
],

answer:
`🧹 Cleaning

Rooms marked as Cleaning are being prepared for the next guest.

Once the administrator marks them as cleaned, they become available again.`
},

{
keywords:[
"maintenance",
"repair"
],

answer:
`🔧 Maintenance

Rooms under maintenance cannot be booked until maintenance has been completed.`
},

{
keywords:[
"check in",
"check-in"
],

answer:
`🕑 Check-In

Guests may check in on the reservation's scheduled check-in date.`
},

{
keywords:[
"check out",
"checkout",
"check-out"
],

answer:
`🕛 Check-Out

Guests should check out on their scheduled check-out date.`
},

{
keywords:[
"wifi",
"internet"
],

answer:
`📶 Wi-Fi

Complimentary high-speed Wi-Fi is available in all rooms.`
},

{
keywords:[
"parking"
],

answer:
`🚗 Parking

Free parking is available for all hotel guests.`
},

{
keywords:[
"contact",
"phone",
"email"
],

answer:
`📞 Contact

For additional assistance, please contact Vernay Hotel using the contact information provided on our website.`
},

{
keywords:[
"classic double room",
"classic room",
"room 101"
],

answer:
`🏨 Classic Double Room

💰 ₱189 per night

👥 Capacity: 2 Guests

📐 Size: 28 sqm

✔ Double Bed

✔ Air Conditioning

✔ Smart TV

✔ Free Wi-Fi`
},

{
keywords:[
"superior twin",
"room 205"
],

answer:
`🏨 Superior Twin Room

💰 ₱210 per night

👥 Capacity: 2 Guests

📐 Size: 32 sqm

✔ Twin Beds

✔ Air Conditioning

✔ Smart TV

✔ Free Wi-Fi`
},

{
keywords:[
"deluxe king suite",
"deluxe",
"room 312"
],

answer:
`🏨 Deluxe King Suite

💰 ₱320 per night

👥 Capacity: 2 Guests

📐 Size: 45 sqm

✔ King-size Bed

✔ Air Conditioning

✔ Smart TV

✔ Free Wi-Fi

✔ Private Bathroom`
},

{
keywords:[
"junior suite",
"room 401"
],

answer:
`🏨 Junior Suite

💰 ₱265 per night

👥 Capacity: 3 Guests

📐 Size: 52 sqm

✔ Queen Bed

✔ Sofa Area

✔ Smart TV

✔ Free Wi-Fi`
},

{
keywords:[
"executive business room",
"business room",
"room 502"
],

answer:
`🏨 Executive Business Room

💰 ₱390 per night

👥 Capacity: 2 Guests

📐 Size: 55 sqm

✔ Business Workspace

✔ Smart TV

✔ Air Conditioning

✔ Free Wi-Fi`
},

{
keywords:[
"executive penthouse",
"penthouse",
"ph1"
],

answer:
`🏨 Executive Penthouse

💰 ₱580 per night

👥 Capacity: 4 Guests

📐 Size: 90 sqm

✔ Living Room

✔ Dining Area

✔ Premium Bathroom

✔ Smart TV

✔ City View`
}

]