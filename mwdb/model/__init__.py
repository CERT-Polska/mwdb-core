from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# These imports must appear after "db" declaration

from .api_key import APIKey  # noqa: E402
from .blob import TextBlob  # noqa: E402
from .comment import Comment  # noqa: E402
from .config import Config, StaticConfig  # noqa: E402
from .file import File  # noqa: E402
from .group import Group, Member  # noqa: E402
from .karton import KartonAnalysis, karton_object  # noqa: E402
from .metakey import Metakey, MetakeyDefinition, MetakeyPermission  # noqa: E402
from .object import Object, ObjectPermission, relation  # noqa: E402
from .quick_query import QuickQuery  # noqa: E402
from .tag import Tag, object_tag_table  # noqa: E402
from .user import User  # noqa: E402

__all__ = [
    "db",
    "APIKey",
    "TextBlob",
    "Comment",
    "Config",
    "StaticConfig",
    "File",
    "Group",
    "KartonAnalysis",
    "karton_object",
    "Member",
    "Metakey",
    "MetakeyDefinition",
    "MetakeyPermission",
    "Object",
    "ObjectPermission",
    "relation",
    "QuickQuery",
    "Tag",
    "object_tag_table",
    "User",
]
