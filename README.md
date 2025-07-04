# TalkWave Real-Time Chat Application

## Project Overview
TalkWave is a modern, real-time chat application built with Flask and WebSocket technology. It provides a complete chat experience with user authentication, real-time messaging, and user presence tracking.

## Features Implemented

### ✅ User Authentication
- User registration and login system
- Secure password hashing with bcrypt
- Session management with Flask-Login
- Authentication middleware for protected routes

### ✅ WebSocket Integration
- Real-time messaging using Flask-SocketIO
- Automatic connection management
- Event-driven architecture for instant communication
- Support for multiple concurrent users

### ✅ Private & Group Chat Functionality
- Create and join chat rooms
- Private messaging between users
- Group chat with multiple participants
- Room membership management
- Message history and pagination

### ✅ User Presence Tracking
- Real-time online/offline status
- User presence indicators in the UI
- Automatic status updates on connect/disconnect
- Typing indicators for active conversations

### ✅ Modern Frontend Interface
- Responsive design for desktop and mobile
- Beautiful gradient backgrounds and animations
- Smooth transitions and hover effects
- Professional UI with modern design principles
- Real-time message display with user avatars

## Technical Architecture

### Backend (Flask)
- **Framework**: Flask with Flask-SocketIO
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: Flask-Login + Flask-Bcrypt
- **Real-time**: WebSocket connections via eventlet

### Frontend
- **Technologies**: HTML5, CSS3, JavaScript
- **Design**: Responsive, mobile-first approach
- **Real-time**: Socket.IO client for WebSocket communication
- **UI/UX**: Modern design with smooth animations

### Database Models
- **User**: Authentication and profile information
- **ChatRoom**: Room management and metadata
- **Message**: Chat messages with timestamps
- **RoomMember**: User-room relationships and permissions

## Project Structure
```
talkwave/
├── src/
│   ├── main.py              # Main Flask application
│   ├── socket_events.py     # WebSocket event handlers
│   ├── models/
│   │   ├── user.py          # User model and authentication
│   │   └── chat.py          # Chat models (Room, Message, etc.)
│   ├── routes/
│   │   ├── auth.py          # Authentication routes
│   │   ├── chat.py          # Chat API routes
│   │   └── user.py          # User management routes
│   ├── static/
│   │   ├── index.html       # Main frontend interface
│   │   └── app.js           # Frontend JavaScript logic
│   └── database/
│       └── app.db           # SQLite database
├── venv/                    # Virtual environment
└── requirements.txt         # Python dependencies
```

## Key Features in Detail

### Real-Time Messaging
- Instant message delivery via WebSockets
- Message persistence in database
- Support for different message types
- Automatic scrolling and message ordering

### User Management
- Secure user registration and login
- Password validation and hashing
- Session persistence across browser sessions
- User profile management

### Room Management
- Create public and private rooms
- Join/leave room functionality
- Room member management
- Room discovery for public rooms

### Presence System
- Real-time online/offline status
- User activity tracking
- Typing indicators
- Connection state management

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd talkwave
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python src/main.py
   ```

3. **Access the Application**:
   Open http://localhost:5000 in your browser

## Usage Instructions

1. **Registration**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create Room**: Click "Create Room" to start a new chat room
4. **Join Room**: Browse public rooms and join conversations
5. **Chat**: Send messages in real-time with other users
6. **Presence**: See who's online and typing in real-time

## Technical Highlights

- **Scalable Architecture**: Modular design with separate models, routes, and views
- **Security**: Secure password hashing and session management
- **Performance**: Efficient WebSocket connections with event-driven updates
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Features**: Instant messaging, presence, and typing indicators

## Future Enhancements

- File sharing and image uploads
- Message reactions and emoji support
- Push notifications
- Advanced user roles and permissions
- Message search and filtering
- Voice and video calling integration

The application successfully demonstrates all the requested features and provides a solid foundation for a production-ready chat system.

