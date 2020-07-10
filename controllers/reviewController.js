const Review = require('../models/reviewModel')
const factory = require('./../controllers/handlerFactory')

exports.getReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)
