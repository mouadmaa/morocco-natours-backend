const { sign } = require('jsonwebtoken')

const createAccessToken = user => {
  return sign(
    { userId: user.id, userRole: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '7d' }
  )
}

const createRefreshToken = user => {
  return sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )
}

const sendRefreshToken = (res, token) => {
  res.cookie('jwt', token, {
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 864000000),
    sameSite: 'none',
    httpOnly: true,
  })
}

const sendUserWithToken = (res, user) => {

  sendRefreshToken(res, createRefreshToken(user))

  res.send({
    accessToken: createAccessToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
    },
  })

}

module.exports = {
  sendUserWithToken,
  sendRefreshToken,
}
