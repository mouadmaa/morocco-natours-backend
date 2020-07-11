const { Router } = require('express')

const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')

const router = Router({ mergeParams: true })

router.use(authController.protect)

router.route('/')
  .get(reviewController.getReviews)
  .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview)

router.route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview)
  .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview)

module.exports = router
