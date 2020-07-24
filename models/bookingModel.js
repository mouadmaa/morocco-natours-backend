const { Schema, model } = require('mongoose')

const bookingSchema = new Schema(
  {
    tour: {
      type: Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Booking must belong to a tour!']
    },
    user: {
      type: Schema.ObjectId,
      ref: 'User',
      require: [true, 'Booking must belong to a user!']
    },
    price: {
      type: Number,
      require: [true, 'Booking must have a price.']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    paid: {
      type: Boolean,
      default: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'role name email photo' })
    .populate({ path: 'tour', select: 'name' })
  next()
})

const Booking = model('Booking', bookingSchema)

module.exports = Booking
