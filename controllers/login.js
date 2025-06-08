const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body

  if (!username || !password) {
    return response.status(400).json({
      error: 'Username and password are required'
    })
  }

  try {
    // Buscar usuario por username o email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    })

    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: 'Invalid username/email or password'
      })
    }

    const userForToken = {
      username: user.username,
      id: user._id,
      email: user.email
    }

    // El token expira en 24 horas
    const token = jwt.sign(
      userForToken,
      process.env.SECRET,
      { expiresIn: '24h' }
    )

    response
      .status(200)
      .send({ 
        token, 
        user: {
          id: user._id,
          username: user.username, 
          name: user.name,
          email: user.email
        }
      })
  } catch (error) {
    response.status(500).json({ error: 'Server error during login' })
  }
})

// Endpoint para verificar si el token es válido
loginRouter.post('/verify', async (request, response) => {
  const { token } = request.body

  if (!token) {
    return response.status(400).json({ error: 'Token is required' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    const user = await User.findById(decodedToken.id)

    if (!user) {
      return response.status(401).json({ error: 'User not found' })
    }

    response.status(200).json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'Token expired', valid: false })
    } else if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Invalid token', valid: false })
    }
    
    response.status(500).json({ error: 'Server error during token verification' })
  }
})

module.exports = loginRouter