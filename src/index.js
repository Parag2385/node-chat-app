const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMsg, generateLocationMsg } = require('./utils/messages')
const {addUser, getUser, getUsersInRoom, removeUser} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

//define public path
const publicPath = path.join(__dirname, '../public')


app.use(express.static(publicPath))


io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({username, room}, callback) => {

        const { error, user } = addUser({id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMsg('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {

        const user = getUser(socket.id)

        if (!user) {
            return
        }

        const filter = new Filter()

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMsg(user.username, msg))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {

        const user = getUser(socket.id)

        if (!user) {
            return
        }


        io.to(user.room).emit('locationMessage', generateLocationMsg(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {

        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMsg('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server listing on ${port}`)
})