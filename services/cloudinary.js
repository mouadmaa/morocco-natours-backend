const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  folder: 'MOROCCO_NATOURS',
})

exports.cloudinaryStorageTours = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'MOROCCO_NATOURS/TOURS',
  },
})

exports.cloudinaryStorageUsers = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'MOROCCO_NATOURS/USERS',
  },
})

exports.cloudinaryRemoveImage = publicId => {
  cloudinary.uploader.destroy(publicId)
}
