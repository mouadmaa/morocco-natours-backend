const User = require('../models/userModel')

exports.signup = async (req, res) => {
  const user = await User.create(req.body)
  res.status(201).send(user)
}
