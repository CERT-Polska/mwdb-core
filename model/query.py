from . import db
import datetime


class Query(db.Model):
    __tablename__ = 'query'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    query = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    author = db.relationship('User', lazy='joined')

    @property
    def author_login(self):
        return self.author.login
