from typing import Dict, List, Tuple, Type

import regex

from mwdb.model import Comment, Config, File, KartonAnalysis, Object, Tag, TextBlob

from .exceptions import FieldNotQueryableException, MultipleObjectsQueryException
from .fields import (
    AttributeField,
    BaseField,
    DatetimeField,
    FavoritesField,
    JSONField,
    ListField,
    RelationField,
    ShareField,
    SizeField,
    StringField,
    UploaderField,
    UUIDField,
)

object_mapping: Dict[str, Type[Object]] = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob,
}

field_mapping: Dict[str, Dict[str, BaseField]] = {
    Object.__name__: {
        "dhash": StringField(Object.dhash),
        "tag": ListField(Object.tags, Tag.tag),
        "comment": ListField(Object.comments, Comment.comment),
        "meta": AttributeField(Object.meta),
        "shared": ShareField(Object.shares),
        "uploader": UploaderField(Object.related_shares),
        "upload_time": DatetimeField(Object.upload_time),
        "parent": RelationField(Object.parents),
        "child": RelationField(Object.children),
        "favorites": FavoritesField(Object.followers),
        "karton": UUIDField(Object.analyses, KartonAnalysis.id),
    },
    File.__name__: {
        "name": StringField(File.file_name),
        "size": SizeField(File.file_size),
        "type": StringField(File.file_type),
        "md5": StringField(File.md5),
        "sha1": StringField(File.sha1),
        "sha256": StringField(File.sha256),
        "sha512": StringField(File.sha512),
        "ssdeep": StringField(File.ssdeep),
        "crc32": StringField(File.crc32),
    },
    Config.__name__: {
        "type": StringField(Config.config_type),
        "family": StringField(Config.family),
        "cfg": JSONField(Config.cfg),
    },
    TextBlob.__name__: {
        "name": StringField(TextBlob.blob_name),
        "size": SizeField(TextBlob.blob_size),
        "type": StringField(TextBlob.blob_type),
        "content": StringField(TextBlob._content),
        "first_seen": DatetimeField(TextBlob.upload_time),
        "last_seen": DatetimeField(TextBlob.last_seen),
    },
}


def get_field_mapper(
    queried_type: Type[Object], field_selector: str
) -> Tuple[BaseField, List[str]]:
    field_path = regex.split(r"(?<!\\)(?:\\\\)*\K[.]", field_selector)

    # Map object type selector
    if field_path[0] in object_mapping:
        selected_type = object_mapping[field_path[0]]
        # Because object type selector determines queried type, we can't use specialized
        # fields from different types in the same query
        if not issubclass(selected_type, queried_type):
            raise MultipleObjectsQueryException(
                f"Can't search for objects with type '{selected_type.__name__}' "
                f"and '{queried_type.__name__}' in the same query"
            )
        field_path = field_path[1:]
    else:
        selected_type = queried_type

    # Map object field selector
    if field_path[0] in field_mapping[selected_type.__name__]:
        field = field_mapping[selected_type.__name__][field_path[0]]
    elif field_path[0] in field_mapping[Object.__name__]:
        field = field_mapping[Object.__name__][field_path[0]]
    else:
        raise FieldNotQueryableException(f"No such field: {field_selector}")
    return field, field_path[1:]
