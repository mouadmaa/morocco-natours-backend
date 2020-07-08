const User = require('../models/userModel')
const AppError = require('../utils/appError')

exports.signup = async (req, res) => {
  const { name, email, password } = req.body

  const user = await User.create({ name, email, password })
  const token = user.generateAuthToken()

  res.status(201).send({ token })
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Please provide email and password')
  }

  const user = await User.findByCredentials(email, password)
  const token = user.generateAuthToken()

  res.send({ token })
}
