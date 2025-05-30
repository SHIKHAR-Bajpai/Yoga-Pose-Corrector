from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from db import db  


# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(80), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)

    practice_logs = db.relationship('PracticeLog', backref='user', lazy=True)
    favorite_poses = db.relationship('FavoritePose', backref='user', lazy=True)


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.name}>'

class PracticeLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    practice_date = db.Column(db.Date, default=datetime.utcnow().date())
    poses_practiced = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<PracticeLog for {self.practice_date} by User {self.user_id}>'
    
class FavoritePose(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pose_name = db.Column(db.String(100), nullable=False)
    pose_image = db.Column(db.String(300))  
    added_on = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<FavoritePose {self.pose_name} by User {self.user_id}>'


class Pose(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pose_name = db.Column(db.String(100), nullable=False)
    pose_image = db.Column(db.String(300))  
    pose_link = db.Column(db.String(500)) 

    def __repr__(self):
        return f'<Pose {self.pose_name} by User >'

    def to_dict(self):
        return {
            'id': self.id,
            'pose_name': self.pose_name,
            'pose_image': self.pose_image,
            'pose_link': self.pose_link
        }

