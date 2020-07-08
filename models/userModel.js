const { Schema, model } = require('mongoose')
const { hash } = require('bcryptjs')
const { isEmail } = require('validator')

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name']
    },
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
      minlength: [8, 'A password must have more or equal then 8 characters']
    },
    photo: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Hash the plan text password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12)
  }
  next()
})

const User = model('User', userSchema)

module.exports = User
