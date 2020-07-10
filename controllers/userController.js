const User = require('../models/userModel')
const factory = require('./handlerFactory')
const AppError = require('../utils/appError')
const filterObj = require('../utils/filterObj')

exports.getUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.createUser = factory.createOne(User)
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

exports.updateMe = async (req, res) => {
  // Create error if user POSTsd password data
  if (req.body.password || req.body.passwordConfirm) {
    throw new AppError('This route is not for password updates. Please use /users/updateMyPassword', 400)
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email')

  // Update user document
  const user = await User.findByIdAndUpdate(req.user.id, filterBody,
    { new: true, runValidators: true }
  )

  res.send(user)
}

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).send()
}
