
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# These imports must appear after "db" declaration

from .user import member, User                                      # noqa: E402
from .api_key import APIKey                                         # noqa: E402
from .group import Group                                            # noqa: E402
from .object import relation, Object, ObjectPermission              # noqa: E402
from .file import File                                              # noqa: E402
from .config import Config, StaticConfig                            # noqa: E402
from .blob import TextBlob                                          # noqa: E402
from .metakey import Metakey, MetakeyDefinition, MetakeyPermission  # noqa: E402
from .tag import Tag, object_tag_table                              # noqa: E402
from .comment import Comment                                        # noqa: E402
from .quick_query import QuickQuery                                 # noqa: E402
