const { promisify } = require('util')
const { createHash } = require('crypto')

const { verify } = require('jsonwebtoken')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const sendEmail = require('../services/email')

exports.signup = async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body
  const user = await User.create({ name, email, password, passwordConfirm })
  createSendToken(res, user)
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Please provide email and password')
  }

  const user = await User.findByCredentials(email, password)
  createSendToken(res, user)
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
  const currentUser = await User.findById(id).select('role name email photo')
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

exports.restrictTo = (...roles) => async (req, _, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('you do not have permission to perform this action.', 403)
  }
  next()
}

exports.forgotPassword = async (req, res) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    throw new AppError('There is no user with email address.')
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: 
    ${resetURL}.\nIf you didn't forgot your password, please ignore this email!`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    })

    res.send({
      status: 'success',
      message: 'Token sent to email!'
    })
  } catch (error) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    throw new AppError('There was an error sending the email. Try again later!', 500)
  }
}

exports.resetPassword = async (req, res) => {
  // 1) Get user based on the token
  const hashedToken = createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    throw new AppError('Token is invalid or has expired', 400)
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined

  // 3) Save user and update changedPassswordAt proprty for the user
  await user.save()

  // 4) Log the user in, send JWt
  createSendToken(res, user)
}

exports.updateMyPassword = async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password')

  // 2) Check if POSTed current password is correnct 
  if (!(await user.correctPassword(req.body.PasswordCurrent, user.password))) {
    throw new AppError('Your current password is wrong.', 401)
  }

  // 3) If so, update password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()

  // 4) Log user in, send JWT
  createSendToken(res, user)
}

const createSendToken = (res, user) => {
  res.send({
    token: user.generateAuthToken(),
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      photo: user.photo,
    }
  })
}
