require('dotenv/config')
require('express-async-errors')
const mongoose = require('mongoose')

const app = require('./app')

// Database
mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
).then(() => {
  console.log('> 🥭🥭🥭 Database is connected 🔥')
})

// Server
const PORT = 5000
const server = app.listen(PORT, () => console.log(
  process.env.NODE_ENV === 'production' ? `> 🚀🚀🚀 Server is running 🔥`
    : `> 🚀🚀🚀 Server is running on http://localhost:${PORT} 🔥`
))

process.on('uncaughtException', error => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...')
  console.error(error.name, error.message)
  process.exit(1)
})

process.on('unhandledRejection', error => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...')
  console.error(error.name, error.message)
  server.close(() => process.exit(1))
})

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully')
  server.close(() => console.log('💥 Process terminated!'))
})
