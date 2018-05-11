from db.base import DbBase, Base

from db.object import MixObject
from db.email import MixEmail
from db.config import MixConfig
from db.network import MixNetwork
from sqlalchemy_searchable import make_searchable

make_searchable(Base.metadata)

# remove or add new mixins
class Database(DbBase, MixNetwork, MixObject, MixConfig, MixEmail):
    pass

