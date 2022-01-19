const express = require('express')
const http = require('http')
const path = require('path')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options }) 
    
    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    
    socket.emit('welcomeMessage', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('welcomeMessage', generateMessage('Admin', `${user.username} has joined the room.`))
  
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('sendMessage', (newMessage, callback) => {
    const filter = new Filter()
    const user = getUser(socket.id)

    if (filter.isProfane(newMessage)) {
      return callback('Profanity is not allowed')
    }

    io.to(user.room).emit('welcomeMessage', generateMessage(user.username, newMessage))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {     
    io.to(user.room).emit('welcomeMessage', generateMessage('Admin', `${user.username} has left.`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })  
  }
 })

  socket.on('shareLocation', (position, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
    callback()
   })
})


server.listen(PORT, () => {
    console.log('Server is up & running on PORT: ' + PORT)
})