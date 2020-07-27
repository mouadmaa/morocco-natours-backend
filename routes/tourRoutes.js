const { Router } = require('express')

const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')

const router = Router()

router.use('/:tourId/reviews', reviewRouter)

router.get('/top-3-cheap', tourController.aliasTopTours, tourController.getTours)
router.get('/tour-stats', tourController.getTourStats)
router.get('/monthly-plan/:year', authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)
router.get('/tours-within/:distance/center/:latlng/unit/:unit', tourController.getToursWithin)
router.get('/distances/:latlng/unit/:unit', tourController.getDistances)
router.get('/slug/:slug', tourController.getTourWithSlug)

router.route('/')
  .get(tourController.getTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour)

router.route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

module.exports = router
