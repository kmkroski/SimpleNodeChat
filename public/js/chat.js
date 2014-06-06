(function () {

    var socket,
        rooms = [],
        messages = [],
        current_room = 'Home';

    function getTime () {
        var dt = new Date();

        var hours   = dt.getHours();
        var minutes = dt.getMinutes();
        var seconds = dt.getSeconds();

        hr = hours > 12 ? hours % 12 : hours;
        hr = hr === 0 ? 12 : hr;

        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}

        var time    = hr+':'+minutes+':'+seconds + ' ' +(hours > 12 ? 'PM' : 'AM');
        return time;
    }

    // If we don't have a username, grab one
    function getName (cb) {
        var username = window.prompt("What's your username?");
        if (username) {
            localStorage['username'] = username;
            cb();
        } else {
            getName(cb);
        }
    }

    // Connect to server
    function connectToSocket () {
        socket = io.connect();

        socket.on('identify', function (data) {
            socket.emit('identify', { username: localStorage['username'] });
        });

        socket.on('room_data', function (data) {
            rooms[ data.room ] = data.users;
            drawRooms();
            if (data.room == current_room) {
                drawRoom (current_room);
            }
        });

        socket.on('message', function (data) {
            addMessage(data.room, data.username, data.message, 0);

            if (data.room == current_room) {
                drawRoom(current_room);
            } else {
                $('.room').each(function (i, el) {
                    if ($(this).children('.name').html() == data.room) {
                        $(this).addClass('unread');
                    }
                });
            }
        });
    }

    function addMessage (room, user, text, me) {
        if (!messages[ room ]) { messages[ room ] = ""; }

        messages[ room ] += "<div class='message "+(me?'me':'')+"'>";
        messages[ room ] += "<span class='time'>" + getTime() + "</span>";
        messages[ room ] += "<span class='name'>" + user + "</span>";
        messages[ room ] += "<span class='text'>" + text + "</span>";
        messages[ room ] += "</div>";
    }

    // Handle message sent
    function sendMessage (ele) {
        var txt = ele.val();
        ele.val('');

        if (txt === '') { return; }

        socket.emit('message', {
            username: localStorage['username'],
            message: txt,
            room: current_room
        });

        addMessage(current_room, localStorage['username'], txt, 1);
        drawRoom(current_room);
    }

    // Add a room to the server
    function addRoom () {
        var room = window.prompt("What's the name of the new room?");
        if (room) {
            current_room = room;
            socket.emit('join_room', { room: room });
        }
    }

    // Add a room to the server
    function leaveRoom (room) {
        socket.emit('leave_room', { room: room });

        if (current_room == room) {
            current_room = 'Home';
            drawRoom (current_room);
        }

        delete rooms[room];
        drawRooms();
    }

    // Draw current list of rooms
    function drawRooms () {
        $('#rooms_list').html('');
        for (var r in rooms) {
            var ct = "<div class='room";
                ct += (current_room == r ? " active'>" : "'>");
                ct += "<span class='name'>"+r+"</span>";
                if (r != 'Home') {
                    ct += "<span class='right quit'>x</span>";
                }
                ct += "</div>";
            $('#rooms_list').append(ct);
        }

        $('.room > .name').click(function () {
            $('.room').removeClass('active');
            $(this).parent().addClass('active');
            $(this).parent().removeClass('unread');

            $('#send_text').val('');

            drawRoom($(this).html());
        });

        $('.room > .quit').click(function () {
            leaveRoom($(this).parent().children('.name').html());
        });
    }

    // Change rooms
    function drawRoom (room) {
        current_room = room;

        $('#users_list').html('');
        for (var u in rooms[current_room]) {
            var ct = "<div class='user'>"+rooms[current_room][u]+"</div>";
            $('#users_list').append(ct);
        }

        if (!messages[room]) {
            messages[room] = '';
        }

        $('#chat_log').html(messages[room]);
        $('#chat_log').animate({ scrollTop: $('#chat_log')[0].scrollHeight }, 1);
    }

    // Attach click add handlers
    $('#rooms > .add').click(function (e) {
        e.preventDefault();
        addRoom();
        return false;
    });

    // Attach send form handler
    $('#send').on('submit', function (e) {
        e.preventDefault();
        sendMessage($('#send_text'));
        return false;
    });

    // Get us rolling
    if (localStorage['username']) {
        connectToSocket();
    } else {
        getName(connectToSocket);
    }

})();
