const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Booking = require('../models/bookingModel')
const Tour = require('./../models/tourModel')
const User = require('../models/userModel')
const factory = require('./../controllers/handlerFactory')

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)

exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })

  const tourIds = bookings.map(el => el.tour)
  const tours = await Tour.find({ _id: { $in: tourIds } })

  res.send(tours)
}

exports.getCheckoutSession = async (req, res) => {
  // Get the currently booked tour 
  const tour = await Tour.findById(req.params.tourId)

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${process.env.FRONTEND_URL}`,
    success_url: `${process.env.FRONTEND_URL}/my-bookings?alert=booking`,
    cancel_url: `${process.env.FRONTEND_URL}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [`${req.protocol}://${req.get('host')}/images/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  })

  // Create session as response
  res.send({ session_id: session.id })
}

const createBookingCheckout = async session => {
  const tour = session.client_reference_id
  const user = (await User.findOne({ email: session.customer_email })).id
  const price = session.display_items[0].amount / 100
  await Booking.create({ user, tour, price })
}

exports.webhookCheckout = (req, res) => {
  const signature = req.headers['stripe-signature']

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object)
    res.send({ received: true })
  }
}
