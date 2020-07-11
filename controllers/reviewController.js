const Review = require('../models/reviewModel')
const factory = require('./../controllers/handlerFactory')
const APIFeatures = require('../utils/apiFeatures')

exports.getReview = factory.getOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)

exports.getReviews = async (req, res) => {
  let filter = {}
  if (req.params.tourId) filter = { tour: req.params.tourId }

  const features = new APIFeatures(Review.find(filter), req.query)
    .filter().sort().limitFields().paginate()

  const reviews = await features.query
  res.send(reviews)
}

exports.createReview = async (req, res) => {
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id
  const review = await Review.create(req.body)
  res.status(201).send(review)
}
