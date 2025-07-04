from flask_socketio import emit, join_room, leave_room, disconnect
from flask_login import current_user
from src.main import socketio
from src.models.user import db, User
from src.models.chat import ChatRoom, Message, RoomMember
from datetime import datetime

# Store active connections
active_users = {}

@socketio.on('connect')
def on_connect():
    """Handle client connection"""
    if current_user.is_authenticated:
        # Set user as online
        current_user.set_online()
        
        # Store user as active (simplified without session ID)
        active_users[current_user.id] = True
        
        # Join user to their personal room for private messages
        join_room(f"user_{current_user.id}")
        
        # Join user to all their chat rooms
        user_rooms = db.session.query(ChatRoom).join(RoomMember).filter(
            RoomMember.user_id == current_user.id
        ).all()
        
        for room in user_rooms:
            join_room(f"room_{room.id}")
        
        # Notify other users that this user is online
        emit('user_status_change', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': True
        }, broadcast=True)
        
        print(f"User {current_user.username} connected")
    else:
        disconnect()

@socketio.on('disconnect')
def on_disconnect():
    """Handle client disconnection"""
    if current_user.is_authenticated:
        # Set user as offline
        current_user.set_offline()
        
        # Remove from active users
        if current_user.id in active_users:
            del active_users[current_user.id]
        
        # Notify other users that this user is offline
        emit('user_status_change', {
            'user_id': current_user.id,
            'username': current_user.username,
            'is_online': False
        }, broadcast=True)
        
        print(f"User {current_user.username} disconnected")

@socketio.on('send_message')
def handle_send_message(data):
    """Handle sending a message to a room"""
    if not current_user.is_authenticated:
        return
    
    try:
        room_id = data.get('room_id')
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'text')
        
        if not room_id or not content:
            emit('error', {'message': 'Room ID and content are required'})
            return
        
        # Check if user is a member of the room
        membership = RoomMember.query.filter_by(
            user_id=current_user.id,
            room_id=room_id
        ).first()
        
        if not membership:
            emit('error', {'message': 'Not a member of this room'})
            return
        
        # Create and save message
        message = Message(
            content=content,
            sender_id=current_user.id,
            room_id=room_id,
            message_type=message_type
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Prepare message data
        message_data = message.to_dict()
        
        # Emit message to all users in the room
        emit('new_message', message_data, room=f"room_{room_id}")
        
        print(f"Message sent by {current_user.username} to room {room_id}")
        
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': str(e)})

@socketio.on('join_room_socket')
def handle_join_room(data):
    """Handle joining a room via socket"""
    if not current_user.is_authenticated:
        return
    
    try:
        room_id = data.get('room_id')
        
        if not room_id:
            emit('error', {'message': 'Room ID is required'})
            return
        
        # Check if user is a member of the room
        membership = RoomMember.query.filter_by(
            user_id=current_user.id,
            room_id=room_id
        ).first()
        
        if not membership:
            emit('error', {'message': 'Not a member of this room'})
            return
        
        # Join the socket room
        join_room(f"room_{room_id}")
        
        # Notify room members that user joined
        emit('user_joined_room', {
            'user_id': current_user.id,
            'username': current_user.username,
            'room_id': room_id
        }, room=f"room_{room_id}")
        
        print(f"User {current_user.username} joined room {room_id}")
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('leave_room_socket')
def handle_leave_room(data):
    """Handle leaving a room via socket"""
    if not current_user.is_authenticated:
        return
    
    try:
        room_id = data.get('room_id')
        
        if not room_id:
            emit('error', {'message': 'Room ID is required'})
            return
        
        # Leave the socket room
        leave_room(f"room_{room_id}")
        
        # Notify room members that user left
        emit('user_left_room', {
            'user_id': current_user.id,
            'username': current_user.username,
            'room_id': room_id
        }, room=f"room_{room_id}")
        
        print(f"User {current_user.username} left room {room_id}")
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('typing_start')
def handle_typing_start(data):
    """Handle user starting to type"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if room_id:
        emit('user_typing', {
            'user_id': current_user.id,
            'username': current_user.username,
            'room_id': room_id,
            'typing': True
        }, room=f"room_{room_id}", include_self=False)

@socketio.on('typing_stop')
def handle_typing_stop(data):
    """Handle user stopping typing"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if room_id:
        emit('user_typing', {
            'user_id': current_user.id,
            'username': current_user.username,
            'room_id': room_id,
            'typing': False
        }, room=f"room_{room_id}", include_self=False)

@socketio.on('get_online_users')
def handle_get_online_users():
    """Get list of online users"""
    if not current_user.is_authenticated:
        return
    
    try:
        online_users = User.query.filter_by(is_online=True).all()
        users_data = [user.to_dict() for user in online_users]
        
        emit('online_users_list', {'users': users_data})
        
    except Exception as e:
        emit('error', {'message': str(e)})

