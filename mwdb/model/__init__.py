from flask_sqlalchemy import SQLAlchemy

from mwdb.core.config import app_config

if app_config.mwdb.statement_timeout:
    st_timeout = app_config.mwdb.statement_timeout
    db = SQLAlchemy(
        engine_options={
            "connect_args": {"options": f"-c statement_timeout={st_timeout}"}
        }
    )
else:
    db = SQLAlchemy()

# These imports must appear after "db" declaration

from .api_key import APIKey  # noqa: E402
from .attribute import Attribute, AttributeDefinition, AttributePermission  # noqa: E402
from .blob import TextBlob  # noqa: E402
from .comment import Comment  # noqa: E402
from .config import Config, StaticConfig  # noqa: E402
from .file import File  # noqa: E402
from .group import Group, Member  # noqa: E402
from .karton import KartonAnalysis, karton_object  # noqa: E402
from .oauth import OpenIDProvider, OpenIDUserIdentity  # noqa: E402
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
    "Attribute",
    "AttributeDefinition",
    "AttributePermission",
    "Object",
    "ObjectPermission",
    "OpenIDProvider",
    "OpenIDUserIdentity",
    "relation",
    "QuickQuery",
    "Tag",
    "object_tag_table",
    "User",
]
