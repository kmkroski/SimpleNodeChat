
/***
 * Utility Stuff
 ***/
function getUsernamesForRoom (room) {
    var userlist = [],
        clients = io.sockets.clients(room);
    for (var i in clients) {
        userlist.push( users[ clients[i].id ].username() );
    }
    return userlist;
}

/***
 * User Object
 ***/
var User = function (sck) {
    var socket = sck,
        name;

    this.username = function () { return name; };

    socket.on('join_room', function (data) {
        socket.join(data.room);

        var resp = {
            room: data.room,
            users: getUsernamesForRoom(data.room)
        };
        socket.broadcast.to(data.room).emit('room_data', resp);

        socket.emit('room_data', resp);
    });

    socket.on('leave_room', function (data) {
        socket.leave(data.room);

        var resp = {
            room: data.room,
            users: getUsernamesForRoom(data.room)
        };
        socket.broadcast.to(data.room).emit('room_data', resp);
    });

    // Broadcast message to the whole room
    socket.on('message', function (data) {
        socket.broadcast.to(data.room).emit('message', data);
    });

    socket.on('identify', function (data) {
        name = data.username;

        socket.join('Home');

        var resp = {
            room: 'Home',
            users: getUsernamesForRoom('Home')
        };
        socket.broadcast.to('Home').emit('room_data', resp);

        socket.emit('room_data', resp);
    });


    socket.on('disconnect', function () {
        var rms = io.sockets.manager.roomClients[socket.id];
        for (var r in rms) {
            if (r === '') { continue; }

            r = r.replace('/', '');
            socket.leave(r);

            var resp = {
                room: r,
                users: getUsernamesForRoom(r)
            };
            socket.broadcast.to(r).emit('room_data', resp);
        }
    });

    socket.emit('identify');
};


/***
 * Server Setup
 ***/
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),

    users = [],
    rooms = ['Home'];

// Serve static files
app.use(express.static(__dirname + '/public'));

// Send chat.html
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/chat.html');
});

// Handle incoming socket connection
io.sockets.on('connection', function (socket) {
    // Make a new User.
    users[socket.id] = new User(socket);
});

// Let's roll
server.listen(8080);
