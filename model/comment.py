import datetime

from . import db
from .utils import ColumnToSearchInDict


class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    comment = db.Column(db.String, nullable=False, info=ColumnToSearchInDict)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    object_id = db.Column(db.Integer, db.ForeignKey('object.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
