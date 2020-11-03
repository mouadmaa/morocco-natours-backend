const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const hpp = require('hpp')
const helmet = require('helmet')
const xss = require('xss-clean')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const enforce = require('express-sslify')

const AppError = require('./utils/appError')
const ErrorHandler = require('./controllers/errorController')
const bookingController = require('./controllers/bookingController')

// Start express app
const app = express()

// ------------ GLOBAL MIDDLEWARES ------------
// Implement CORS
app.use(cors({
  origin: true,
  credentials: true,
}))

if (process.env.NODE_ENV === 'production') {
  // Heroku Trust Proxy
  app.enable('trust proxy')
  // Redirect to HTTPS
  app.use(enforce.HTTPS({ trustProtoHeader: true }))
}

// Secure Express apps by setting various HTTP headers
app.use(helmet())

// Basic rate-limiting middleware for Express
app.use('/api', rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
}))

// Stripe Webhook
app.post('/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
)

// Body parser, reading data from body into req.body
app.use(express.json())
app.use(cookieParser())

// // Data sanitization against NoSQL query injection
app.use(mongoSanitize())
// // Data sanitization against XSS
app.use(xss())

// // Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage',
    'maxGroupSize', 'difficulty', 'price'
  ]
}))

// ------------ ROUTES ------------
// Home Route
app.get('/', (_, res) => {
  res.send('Morocco Natours API')
})

// API Routes
app.use('/api/v1/users', require('./routes/userRoutes'))
app.use('/api/v1/tours', require('./routes/tourRoutes'))
app.use('/api/v1/reviews', require('./routes/reviewRoutes'))
app.use('/api/v1/bookings', require('./routes/bookingRoutes'))

// Server not find (404)
app.all('*', (req, _, next) => next(
  new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
)

// Global Error Handler
app.use(ErrorHandler)

module.exports = app
