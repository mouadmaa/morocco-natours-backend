const multer = require('multer')

const User = require('../models/userModel')
const factory = require('./handlerFactory')
const AppError = require('../utils/appError')
const { cloudinaryStorageUsers, cloudinaryRemoveImage } = require('../services/cloudinary')

exports.getUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.createUser = factory.createOne(User)
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

exports.getMe = async (req, res) => {
  const user = await User.findById(req.userId)
    .select('name email role photo')
  res.send(user)
}

const upload = multer({
  storage: cloudinaryStorageUsers,
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true)
    } else (
      cb(new AppError('Not an image! Please upload only images.', 400), false)
    )
  }
})

exports.uploadUserPhoto = upload.single('photo')

exports.updateMe = async (req, res) => {
  // Create error if user POSTsd password data
  if (req.body.password || req.body.passwordConfirm) {
    throw new AppError(
      'This route is not for password updates. Please use /users/updateMyPassword', 400
    )
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email')
  if (req.file) {
    const user = await User.findById(req.userId)
    cloudinaryRemoveImage(`MOROCCO_NATOURS${user.photo.split('/MOROCCO_NATOURS')[1].split('.')[0]}`)
    filteredBody.photo = req.file.path
  }

  // Update user document
  const user = await User.findByIdAndUpdate(req.userId, filteredBody,
    { new: true, runValidators: true }
  )

  res.send({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo,
  })
}

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { active: false })
  res.status(204).send()
}

const filterObj = (obj, ...allwedFields) => {
  const newObj = {}
  for (const key in obj) {
    if (allwedFields.includes(key)) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}
