const { connect } = require('mongoose')
const dotenv = require('dotenv')

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})

dotenv.config({ path: './config.env' })
const app = require('./app')

  // Database
  ; (async () => {
    await connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    console.log('Database is connected...')
  })()

// Server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running...`)
})

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  server.close(() => process.exit(1))
})

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully')
  server.close(() => console.log('💥 Process terminated!'))
})
