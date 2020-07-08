const express = require('express')

const AppError = require('./utils/appError')
const ErrorHandler = require('./controllers/errorController')

// Start express app
const app = express()

// Express for catch async errors
require('express-async-errors')

// Body parser, reading data from body into req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ------------ ROUTES ------------
// Home Route
app.get('/', (_, res) => {
  res.send('Morocco Natours API')
})

// API Route
app.use('/api/v1/users', require('./routes/userRoutes'))
app.use('/api/v1/tours', require('./routes/tourRoutes'))

// Server not find (404)
app.all('*', (req, _, next) => next(
  new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
)

// Global Error Handler
app.use(ErrorHandler)

module.exports = app
