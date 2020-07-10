const { randomBytes, createHash } = require('crypto')

const { Schema, model } = require('mongoose')
const { hash, compare } = require('bcryptjs')
const { sign } = require('jsonwebtoken')
const { isEmail } = require('validator')

const AppError = require('../utils/appError')

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name']
    },
    photo: String,
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please provide a valide email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'A password must have more or equal then 8 characters'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) { return el === this.password },
        message: 'Passwords are not the same!'
      }
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Hash the plan text password before saving
userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await hash(user.password, 12)
    user.passwordConfirm = undefined

    if (!user.isNew) {
      user.passwordChangedAt = Date.now() - 5000
    }
  }
  next()
})

// Generate Auth Token
userSchema.methods.generateAuthToken = function () {
  const user = this
  const token = sign(
    { id: user.id }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
  return token
}

// Find By Credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await compare(password, user.password))) {
    throw new AppError('Email or Password is Invalid!', 401)
  }
  return user
}

// Check correct password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await compare(candidatePassword, userPassword)
}

// Check if user changed password after the token wass issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = randomBytes(32).toString('hex')

  this.passwordResetToken = createHash('sha256').update(resetToken).digest('hex')
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  return resetToken
}

const User = model('User', userSchema)

module.exports = User
