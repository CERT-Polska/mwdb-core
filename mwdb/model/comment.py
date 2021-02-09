import datetime

from . import db


class Comment(db.Model):
    __tablename__ = "comment"
    id = db.Column(db.Integer, primary_key=True)
    comment = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    object_id = db.Column(db.Integer, db.ForeignKey("object.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    author = db.relationship("User", lazy="joined")

    @property
    def author_login(self):
        return self.author.login
