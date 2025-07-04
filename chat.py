from datetime import datetime
from src.models.user import db

class ChatRoom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_private = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='room', lazy='dynamic', cascade='all, delete-orphan')
    members = db.relationship('RoomMember', backref='room', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatRoom {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_private': self.is_private,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': self.members.count()
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_room.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, etc.
    
    def __repr__(self):
        return f'<Message {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'sender_id': self.sender_id,
            'sender_username': self.sender.username if self.sender else None,
            'room_id': self.room_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'message_type': self.message_type
        }

class RoomMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_room.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.String(20), default='member')  # admin, moderator, member
    
    # Unique constraint to prevent duplicate memberships
    __table_args__ = (db.UniqueConstraint('user_id', 'room_id', name='unique_user_room'),)
    
    def __repr__(self):
        return f'<RoomMember {self.user_id}:{self.room_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'room_id': self.room_id,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'role': self.role,
            'username': self.user.username if self.user else None
        }

