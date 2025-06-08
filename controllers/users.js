const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

// Obtener todos los usuarios
usersRouter.get('/', async (request, response) => {
  try {
    const users = await User
      .find({})
      .populate('profiles', { name: 1, age: 1, popularity: 1, category: 1 })
      .populate('likedProfiles', { name: 1, popularity: 1 })
      .populate('dislikedProfiles', { name: 1, popularity: 1 })
    
    response.json(users)
  } catch (error) {
    response.status(500).json({ error: 'Server error' })
  }
})

// Obtener un usuario específico
usersRouter.get('/:id', async (request, response) => {
  try {
    const user = await User
      .findById(request.params.id)
      .populate('profiles', { name: 1, age: 1, popularity: 1, category: 1, likes: 1, dislikes: 1 })
      .populate('likedProfiles', { name: 1, popularity: 1, category: 1 })
      .populate('dislikedProfiles', { name: 1, popularity: 1, category: 1 })

    if (user) {
      response.json(user)
    } else {
      response.status(404).json({ error: 'User not found' })
    }
  } catch (error) {
    response.status(400).json({ error: 'Invalid user ID' })
  }
})

// Crear un nuevo usuario
usersRouter.post('/', async (request, response, next) => {
  const { username, email, name, password } = request.body

  // Validaciones
  if (!username || username.length < 3) {
    return response.status(400).json({ error: 'Username must be at least 3 characters long' })
  }

  if (!email || !email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
    return response.status(400).json({ error: 'Please provide a valid email address' })
  }

  if (!name || name.length < 2) {
    return response.status(400).json({ error: 'Name must be at least 2 characters long' })
  }

  if (!password || password.length < 6) {
    return response.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  try {
    // Verificar si el usuario o email ya existen
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    })

    if (existingUser) {
      if (existingUser.username === username) {
        return response.status(400).json({ error: 'Username already exists' })
      }
      if (existingUser.email === email) {
        return response.status(400).json({ error: 'Email already exists' })
      }
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
      username,
      email,
      name,
      passwordHash,
    })

    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (exception) {
    next(exception)
  }
})

// Actualizar perfil de usuario
usersRouter.put('/:id', async (request, response, next) => {
  const { name, email } = request.body

  try {
    const updateData = {}
    
    if (name !== undefined) {
      if (name.length < 2) {
        return response.status(400).json({ error: 'Name must be at least 2 characters long' })
      }
      updateData.name = name
    }

    if (email !== undefined) {
      if (!email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
        return response.status(400).json({ error: 'Please provide a valid email address' })
      }
      
      // Verificar si el email ya existe en otro usuario
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: request.params.id } 
      })
      
      if (existingUser) {
        return response.status(400).json({ error: 'Email already exists' })
      }
      
      updateData.email = email
    }

    const updatedUser = await User.findByIdAndUpdate(
      request.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('profiles', { name: 1, age: 1, popularity: 1, category: 1 })

    if (!updatedUser) {
      return response.status(404).json({ error: 'User not found' })
    }

    response.json(updatedUser)
  } catch (exception) {
    next(exception)
  }
})

// Cambiar contraseña
usersRouter.put('/:id/password', async (request, response, next) => {
  const { currentPassword, newPassword } = request.body

  if (!currentPassword || !newPassword) {
    return response.status(400).json({ error: 'Current password and new password are required' })
  }

  if (newPassword.length < 6) {
    return response.status(400).json({ error: 'New password must be at least 6 characters long' })
  }

  try {
    const user = await User.findById(request.params.id)
    
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    const passwordCorrect = await bcrypt.compare(currentPassword, user.passwordHash)
    
    if (!passwordCorrect) {
      return response.status(400).json({ error: 'Current password is incorrect' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    await User.findByIdAndUpdate(request.params.id, { passwordHash })
    
    response.json({ message: 'Password updated successfully' })
  } catch (exception) {
    next(exception)
  }
})

// Obtener estadísticas del usuario
usersRouter.get('/:id/stats', async (request, response) => {
  try {
    const user = await User
      .findById(request.params.id)
      .populate('profiles')
      .populate('likedProfiles')
      .populate('dislikedProfiles')

    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    const stats = {
      totalProfiles: user.profiles.length,
      totalLikes: user.likedProfiles.length,
      totalDislikes: user.dislikedProfiles.length,
      profilesByCategory: {
        HIGH: user.profiles.filter(p => p.category === 'HIGH').length,
        MEDIUM: user.profiles.filter(p => p.category === 'MEDIUM').length,
        LOW: user.profiles.filter(p => p.category === 'LOW').length
      },
      totalPopularityEarned: user.profiles.reduce((sum, profile) => sum + profile.popularity, 0)
    }

    response.json(stats)
  } catch (error) {
    response.status(500).json({ error: 'Server error' })
  }
})

module.exports = usersRouter