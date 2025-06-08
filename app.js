const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const profilesRouter = require('./controllers/profiles')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const path = require('path')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)

// Servir archivos estáticos
app.use(express.static('public'))

// Rutas de la API
app.use('/api/profiles', profilesRouter)

// Ruta principal
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app