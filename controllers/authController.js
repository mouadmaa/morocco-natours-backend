const { promisify } = require('util')

const { verify } = require('jsonwebtoken')

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

exports.protect = async (req, _, next) => {
  // 1) Getting token and check of it's there
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    throw new AppError('You are not logged in! Please log in to get access.', 401)
  }

  // 2) Verification token
  const { id, iat } = await promisify(verify)(token, process.env.JWT_SECRET)

  // 3) Check if user still exists
  const currentUser = await User.findById(id).select('-password')
  if (!currentUser) {
    throw new AppError('The user belonging to this token does no longer exist.', 401)
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(iat)) {
    throw new AppError('User recently changed password! Please log in again.', 401)
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser
  next()
}
