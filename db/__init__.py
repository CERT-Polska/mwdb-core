from db.base import DbBase

from sqlalchemy_searchable import make_searchable

make_searchable()

from db.object import MixObject
from db.email import MixEmail
from db.config import MixConfig
from db.network import MixNetwork


# remove or add new mixins
class Database(DbBase, MixNetwork, MixObject, MixConfig, MixEmail):
    pass
