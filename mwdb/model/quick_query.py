import datetime

from . import db


class QuickQuery(db.Model):
    __tablename__ = "quick_query"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    query = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    owner = db.relationship("User", lazy="joined")

    @property
    def owner_login(self):
        return self.owner.login
