const { Router } = require('express')

const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')

const router = Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser)

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router
