const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Tour = require('./../models/tourModel')
const factory = require('./../controllers/handlerFactory')
const AppError = require('../utils/appError')

exports.getCheckoutSession = async (req, res) => {
  // Get the currently booked tour 
  const tour = await Tour.findById(req.params.tourId)

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${process.env.FRONTEND_URL}`,
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
