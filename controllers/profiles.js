const profilesRouter = require('express').Router()
const Profile = require('../models/profile')

// Obtener todos los perfiles
profilesRouter.get('/', async (request, response) => {
  try {
    const profiles = await Profile.find({}).sort({ popularity: -1 })
    response.json(profiles)
  } catch (error) {
    response.status(500).json({ error: 'Error al obtener perfiles' })
  }
})

// Obtener perfiles por categoría
profilesRouter.get('/category/:category', async (request, response) => {
  try {
    const { category } = request.params
    const profiles = await Profile.find({ category }).sort({ popularity: -1 })
    response.json(profiles)
  } catch (error) {
    response.status(500).json({ error: 'Error al obtener perfiles por categoría' })
  }
})

// Crear nuevo perfil
profilesRouter.post('/', async (request, response) => {
  try {
    const { name, description, imageUrl } = request.body

    if (!name || !description) {
      return response.status(400).json({ error: 'Nombre y descripción son requeridos' })
    }

    const profile = new Profile({
      name,
      description,
      imageUrl: imageUrl || 'https://via.placeholder.com/150'
    })

    const savedProfile = await profile.save()
    response.status(201).json(savedProfile)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

// Dar like a un perfil
profilesRouter.put('/:id/like', async (request, response) => {
  try {
    const profile = await Profile.findById(request.params.id)
    
    if (!profile) {
      return response.status(404).json({ error: 'Perfil no encontrado' })
    }

    profile.likes += 1
    const updatedProfile = await profile.save()
    
    response.json(updatedProfile)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

// Dar dislike a un perfil
profilesRouter.put('/:id/dislike', async (request, response) => {
  try {
    const profile = await Profile.findById(request.params.id)
    
    if (!profile) {
      return response.status(404).json({ error: 'Perfil no encontrado' })
    }

    profile.dislikes += 1
    const updatedProfile = await profile.save()
    
    response.json(updatedProfile)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

// Obtener un perfil específico
profilesRouter.get('/:id', async (request, response) => {
  try {
    const profile = await Profile.findById(request.params.id)
    if (profile) {
      response.json(profile)
    } else {
      response.status(404).json({ error: 'Perfil no encontrado' })
    }
  } catch (error) {
    response.status(400).json({ error: 'ID malformado' })
  }
})

// Eliminar perfil
profilesRouter.delete('/:id', async (request, response) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(request.params.id)
    if (!deletedProfile) {
      return response.status(404).json({ error: 'Perfil no encontrado' })
    }
    response.status(204).end()
  } catch (error) {
    response.status(400).json({ error: 'ID malformado' })
  }
})

module.exports = profilesRouter