const { Schema, model } = require('mongoose')
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
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a password']
    },
    photo: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

const User = model('User', userSchema)

module.exports = User
