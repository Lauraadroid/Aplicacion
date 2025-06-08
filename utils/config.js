require('dotenv').config()

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://laura:lsrv0521@cluster0.cg3qvir.mongodb.net/baseblog?retryWrites=true&w=majority&appName=Cluster0'

module.exports = {
  MONGODB_URI,
  PORT
}