const { createHash } = require('crypto')

const { verify } = require('jsonwebtoken')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const Email = require('../services/Email')
const { sendUserWithToken, sendRefreshToken } = require('../utils/createToken')

exports.signup = async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body
  const user = await User.create({ name, email, password, passwordConfirm })

  const url = `${process.env.FRONTEND_URL}/account`
  await new Email(user, url).sendWelcome()

  sendUserWithToken(res, user)
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Please provide email and password')
  }

  const user = await User.findByCredentials(email, password)
  sendUserWithToken(res, user)
}

exports.logout = (_, res) => {
  sendRefreshToken(res, '')
  res.send({ success: true })
}

exports.protect = async (req, _, next) => {
  // 1) Getting token and check of it's there
  const authorization = req.headers['authorization']
  if (!authorization) throw new AppError('You are not logged in! Please log in to get access.', 401)

  // 2) Verification token
  const token = authorization.replace('Bearer ', '')
  const { userId, userRole } = verify(token, process.env.ACCESS_TOKEN_SECRET)

  // GRANT ACCESS TO PROTECTED ROUTE
  req.userId = userId
  req.userRole = userRole
  next()
}

exports.restrictTo = (...roles) => async (req, _, next) => {
  if (!roles.includes(req.userRole)) {
    throw new AppError('you do not have permission to perform this action.', 403)
  }
  next()
}

exports.refreshToken = async (req, res) => {
  const { jwt } = req.cookies
  if (!jwt) throw new AppError('You are not logged in! Please log in to get access.', 401)

  const { userId } = verify(jwt, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(userId)
  if (!user) throw new AppError('You are not logged in! Please log in to get access.', 401)

  sendUserWithToken(res, user)
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
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    await new Email(user, resetURL).sendPasswordReset()

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

  // 3) Save user and update changedPasswordAt property for the user
  await user.save()

  // 4) Log the user in, send JWt
  sendUserWithToken(res, user)
}

exports.updateMyPassword = async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.userId).select('+password')

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    throw new AppError('Your current password is wrong.', 401)
  }

  // 3) If so, update password
  user.password = req.body.passwordNew
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()

  // 4) Log user in, send JWT
  sendUserWithToken(res, user)
}
