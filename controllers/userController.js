const multer = require('multer')
const sharp = require('sharp')

const fs = require('fs')

const User = require('../models/userModel')
const factory = require('./handlerFactory')
const AppError = require('../utils/appError')

exports.getUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.createUser = factory.createOne(User)
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

exports.getMe = (req, res) => {
  res.send(req.user)
}

// const multerStorage = multer.diskStorage({
//   destination: (_1, _2, cb) => {
//     cb(null, 'images/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })
const multerStorage = multer.memoryStorage()

const multerFilter = (_, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else (
    cb(new AppError('Not an image! Please upload only images.', 400), false)
  )
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`images/users/${req.file.filename}`)

  next()
}

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
    filteredBody.photo = req.file.filename

    if (req.user.photo) {
      fs.unlink(`images/users/${req.user.photo}`, () => {
        new AppError('Something went wrong, could not delete photo', 500)
      })
    }
  }

  // Update user document
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody,
    { new: true, runValidators: true }
  )

  res.send({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    photo: user.photo,
  })
}

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
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
