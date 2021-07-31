// const express = require('express')
// const path = require('path')
// const app = express()
// const publicDirectoryPath = path.join(__dirname, '../views')
// app.use(express.static(publicDirectoryPath))

// //routes
// app.get('/', (req, res) => {
// 	res.render('login.html')
// })

// //Listen on port 3000
// server = app.listen(3000,()=>{
//     console.log('sever is running')
// })

// //socket.io instantiation
// const io = require("socket.io")(server)

// //listen on every connection
// io.on('connection', (socket) => {

//     socket.on('new_message1', (data) => {
//         //send message to others except caller
//         console.log(data);
//         socket.broadcast.emit('new_message1', data);
//     })
    
// })


const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')



const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../views')

app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index')
})
io.on('connection', (socket) => {
    

    socket.on('new_message1', (data) => {
        //send message to others except caller
        
        socket.broadcast.emit('new_message1', data);
    })
    
})


server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
