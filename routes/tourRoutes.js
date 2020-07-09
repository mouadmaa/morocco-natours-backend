const { Router } = require('express')

const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authController')

const router = Router()

router.get('/top-5-cheap', tourController.aliasTopTours, tourController.getTours)
router.get('/tour-stats', tourController.getTourStats)
router.get('/monthly-plan/:year', tourController.getMonthlyPlan)

router.route('/')
  .get(authController.protect, tourController.getTours)
  .post(tourController.createTour)

router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

module.exports = router
