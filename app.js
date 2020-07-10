const express = require('express')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
require('express-async-errors')

const AppError = require('./utils/appError')
const ErrorHandler = require('./controllers/errorController')

// Start express app
const app = express()

// ------------ GLOBAL MIDDLEWARES ------------
// Secure Express apps by setting various HTTP headers
app.use(helmet())

// Basic rate-limiting middleware for Express
app.use('/api', rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
}))

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

// ------------ ROUTES ------------
// Home Route
app.get('/', (_, res) => {
  res.send('Morocco Natours API')
})

// API Routes
app.use('/api/v1/users', require('./routes/userRoutes'))
app.use('/api/v1/tours', require('./routes/tourRoutes'))

// Server not find (404)
app.all('*', (req, _, next) => next(
  new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
)

// Global Error Handler
app.use(ErrorHandler)

module.exports = app
