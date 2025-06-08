const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2
  },
  description: {
    type: String,
    required: true,
    minlength: 5
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['Baja', 'Media', 'Alta'],
    default: 'Baja'
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Middleware para calcular popularidad y categoría antes de guardar
profileSchema.pre('save', function(next) {
  // Calcular popularidad (likes - dislikes)
  this.popularity = this.likes - this.dislikes
  
  // Asignar categoría basada en popularidad
  if (this.popularity >= 20) {
    this.category = 'Alta'
  } else if (this.popularity >= 5) {
    this.category = 'Media'
  } else {
    this.category = 'Baja'
  }
  
  next()
})

profileSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Profile', profileSchema)