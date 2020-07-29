const express = require('express')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const cors = require('cors')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const enforce = require('express-sslify')
require('express-async-errors')

const AppError = require('./utils/appError')
const ErrorHandler = require('./controllers/errorController')
const { webhookCheckout } = require('./controllers/bookingController')

// Start express app
const app = express()

// ------------ GLOBAL MIDDLEWARES ------------
// Implement CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: 'GET,HEAD,POST,PATCH,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
}))

app.enable('trust proxy')

// Redirect to HTTPS
app.use(enforce.HTTPS({ trustProtoHeader: true }))

// Secure Express apps by setting various HTTP headers
app.use(helmet())

// Serving static images
app.use('/images', express.static('images'))

// Basic rate-limiting middleware for Express
app.use('/api', rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
}))

// Stripe Webhook
app.post('/webhook-checkout',
  express.raw({ type: 'application/json' }), webhookCheckout
)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())
// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
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
