const express = require('express')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const cors = require('cors')
const xss = require('xss-clean')
const hpp = require('hpp')
require('express-async-errors')

const AppError = require('./utils/appError')
const ErrorHandler = require('./controllers/errorController')

// Start express app
const app = express()

// ------------ GLOBAL MIDDLEWARES ------------
// Secure Express apps by setting various HTTP headers
app.use(helmet())

// Implement CORS
app.use(cors())
app.options('*', cors())

// Basic rate-limiting middleware for Express
app.use('/api', rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
}))

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

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

// Server not find (404)
app.all('*', (req, _, next) => next(
  new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
)

// Global Error Handler
app.use(ErrorHandler)

module.exports = app
