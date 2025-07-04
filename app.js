// TalkWave Chat Application
class TalkWaveApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentRoom = null;
        this.isLogin = true;
        this.typingTimer = null;
        this.typingUsers = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Auth form
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        // Auth switch
        document.getElementById('authSwitchLink').addEventListener('click', () => {
            this.toggleAuthMode();
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            } else {
                this.handleTyping();
            }
        });

        messageInput.addEventListener('blur', () => {
            this.stopTyping();
        });

        // Create room form
        document.getElementById('createRoomForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createRoom();
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.user;
                this.showMainApp();
                this.initializeSocket();
                this.loadUserRooms();
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthModal();
        }
    }

    toggleAuthMode() {
        this.isLogin = !this.isLogin;
        const title = document.getElementById('authTitle');
        const submit = document.getElementById('authSubmit');
        const switchText = document.getElementById('authSwitchText');
        const switchLink = document.getElementById('authSwitchLink');
        const emailField = document.getElementById('email').parentElement;

        if (this.isLogin) {
            title.textContent = 'Welcome Back';
            submit.textContent = 'Sign In';
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = 'Sign Up';
            emailField.style.display = 'none';
        } else {
            title.textContent = 'Join TalkWave';
            submit.textContent = 'Sign Up';
            switchText.textContent = 'Already have an account?';
            switchLink.textContent = 'Sign In';
            emailField.style.display = 'block';
        }
    }

    async handleAuth() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const endpoint = this.isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = this.isLogin 
            ? { username, password }
            : { username, email, password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                this.showMainApp();
                this.initializeSocket();
                this.loadUserRooms();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.currentUser = null;
            this.currentRoom = null;
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
            this.showAuthModal();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('currentUsername').textContent = this.currentUser.username;
    }

    initializeSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('new_message', (message) => {
            this.displayMessage(message);
        });

        this.socket.on('user_status_change', (data) => {
            this.updateUserStatus(data);
        });

        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('user_joined_room', (data) => {
            this.showNotification(`${data.username} joined the room`);
        });

        this.socket.on('user_left_room', (data) => {
            this.showNotification(`${data.username} left the room`);
        });

        this.socket.on('error', (data) => {
            this.showError(data.message);
        });
    }

    async loadUserRooms() {
        try {
            const response = await fetch('/api/chat/rooms');
            const data = await response.json();
            
            if (response.ok) {
                this.displayRooms(data.rooms);
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    }

    async loadPublicRooms() {
        try {
            const response = await fetch('/api/chat/rooms/public');
            const data = await response.json();
            
            if (response.ok) {
                this.displayRooms(data.rooms, true);
            }
        } catch (error) {
            console.error('Failed to load public rooms:', error);
        }
    }

    displayRooms(rooms, isPublic = false) {
        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = '';

        if (rooms.length === 0) {
            roomsList.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #bdc3c7;">
                    ${isPublic ? 'No public rooms available' : 'No rooms yet. Create one to get started!'}
                </div>
            `;
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.onclick = () => isPublic ? this.joinPublicRoom(room.id) : this.selectRoom(room);
            
            roomElement.innerHTML = `
                <div class="room-name">${room.name}</div>
                <div class="room-preview">
                    ${room.latest_message ? room.latest_message.content : 'No messages yet'}
                </div>
            `;
            
            roomsList.appendChild(roomElement);
        });
    }

    async joinPublicRoom(roomId) {
        try {
            const response = await fetch(`/api/chat/rooms/${roomId}/join`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.loadUserRooms();
                this.showMyRooms();
            } else {
                const data = await response.json();
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to join room');
        }
    }

    async selectRoom(room) {
        if (this.currentRoom) {
            this.socket.emit('leave_room_socket', { room_id: this.currentRoom.id });
        }

        this.currentRoom = room;
        document.getElementById('chatTitle').textContent = room.name;
        
        // Join socket room
        this.socket.emit('join_room_socket', { room_id: room.id });
        
        // Load messages
        await this.loadMessages(room.id);
        
        // Show message input
        document.getElementById('messageInputContainer').classList.remove('hidden');
        
        // Update active room in sidebar
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.room-item').classList.add('active');
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
            const data = await response.json();
            
            if (response.ok) {
                this.displayMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    displayMessages(messages) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        messages.forEach(message => {
            this.displayMessage(message);
        });
        
        this.scrollToBottom();
    }

    displayMessage(message) {
        const container = document.getElementById('messagesContainer');
        const isOwn = message.sender_id === this.currentUser.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : ''}`;
        
        const avatar = message.sender_username ? message.sender_username.charAt(0).toUpperCase() : 'U';
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${message.sender_username || 'Unknown'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.content)}</div>
            </div>
        `;
        
        container.appendChild(messageElement);
        this.scrollToBottom();
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content || !this.currentRoom) return;
        
        this.socket.emit('send_message', {
            room_id: this.currentRoom.id,
            content: content,
            message_type: 'text'
        });
        
        input.value = '';
        this.stopTyping();
    }

    handleTyping() {
        if (!this.currentRoom) return;
        
        this.socket.emit('typing_start', { room_id: this.currentRoom.id });
        
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    stopTyping() {
        if (!this.currentRoom) return;
        
        this.socket.emit('typing_stop', { room_id: this.currentRoom.id });
        clearTimeout(this.typingTimer);
    }

    handleUserTyping(data) {
        if (data.typing) {
            this.typingUsers.add(data.username);
        } else {
            this.typingUsers.delete(data.username);
        }
        
        this.updateTypingIndicator();
    }

    updateTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        
        if (this.typingUsers.size === 0) {
            indicator.classList.add('hidden');
        } else {
            const users = Array.from(this.typingUsers);
            let text = '';
            
            if (users.length === 1) {
                text = `${users[0]} is typing...`;
            } else if (users.length === 2) {
                text = `${users[0]} and ${users[1]} are typing...`;
            } else {
                text = `${users[0]} and ${users.length - 1} others are typing...`;
            }
            
            indicator.textContent = text;
            indicator.classList.remove('hidden');
        }
    }

    async createRoom() {
        const name = document.getElementById('roomName').value.trim();
        const description = document.getElementById('roomDescription').value.trim();
        const isPrivate = document.getElementById('isPrivate').checked;
        
        if (!name) return;
        
        try {
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, is_private: isPrivate })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.closeCreateRoomModal();
                this.loadUserRooms();
                this.showMyRooms();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError('Failed to create room');
        }
    }

    showMyRooms() {
        this.setActiveNavButton(0);
        this.loadUserRooms();
    }

    showPublicRooms() {
        this.setActiveNavButton(1);
        this.loadPublicRooms();
    }

    showCreateRoom() {
        document.getElementById('createRoomModal').style.display = 'flex';
    }

    closeCreateRoomModal() {
        document.getElementById('createRoomModal').style.display = 'none';
        document.getElementById('createRoomForm').reset();
    }

    setActiveNavButton(index) {
        document.querySelectorAll('.nav-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
    }

    updateUserStatus(data) {
        // Update user status in UI if needed
        console.log(`User ${data.username} is now ${data.is_online ? 'online' : 'offline'}`);
    }

    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        console.log('Notification:', message);
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TalkWaveApp();
});

// Global functions for onclick handlers
function showMyRooms() {
    window.talkWaveApp?.showMyRooms();
}

function showPublicRooms() {
    window.talkWaveApp?.showPublicRooms();
}

function showCreateRoom() {
    window.talkWaveApp?.showCreateRoom();
}

function closeCreateRoomModal() {
    window.talkWaveApp?.closeCreateRoomModal();
}

function logout() {
    window.talkWaveApp?.logout();
}

function sendMessage() {
    window.talkWaveApp?.sendMessage();
}

// Store app instance globally for onclick handlers
document.addEventListener('DOMContentLoaded', () => {
    window.talkWaveApp = new TalkWaveApp();
});

