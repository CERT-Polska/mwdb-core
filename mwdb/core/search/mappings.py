import re
from typing import Dict, List, Tuple, Type

from mwdb.model import (
    Comment,
    Config,
    File,
    KartonAnalysis,
    Object,
    Tag,
    TextBlob,
    User,
)

from .exceptions import FieldNotQueryableException, MultipleObjectsQueryException
from .fields import (
    AttributeField,
    BaseField,
    CommentAuthorField,
    DatetimeField,
    FavoritesField,
    FileNameField,
    JSONField,
    ListField,
    MultiField,
    RelationField,
    ShareField,
    SharerField,
    SizeField,
    StringField,
    UploadCountField,
    UploaderField,
    UUIDField,
)

object_mapping: Dict[str, Type[Object]] = {
    "file": File,
    "object": Object,
    "static": Config,  # legacy
    "config": Config,
    "blob": TextBlob,
}

field_mapping: Dict[str, Dict[str, BaseField]] = {
    Object.__name__: {
        "dhash": StringField(Object.dhash),
        "tag": ListField(Object.tags, Tag.tag),
        "comment": ListField(Object.comments, Comment.comment),
        "meta": AttributeField(Object.attributes),  # legacy
        "attribute": AttributeField(Object.attributes),
        "shared": ShareField(Object.shares),
        "sharer": SharerField(Object.shares),
        "uploader": UploaderField(Object.shares),
        "upload_time": DatetimeField(Object.upload_time),
        "parent": RelationField(Object.parents),
        "child": RelationField(Object.children),
        "favorites": FavoritesField(Object.followers),
        "karton": UUIDField(Object.analyses, KartonAnalysis.id),
        "comment_author": CommentAuthorField(Object.comment_authors, User.login),
        "upload_count": UploadCountField(Object.upload_count),
    },
    File.__name__: {
        "name": FileNameField(File.file_name),
        "size": SizeField(File.file_size),
        "type": StringField(File.file_type),
        "md5": StringField(File.md5),
        "sha1": StringField(File.sha1),
        "sha256": StringField(File.sha256),
        "sha512": StringField(File.sha512),
        "ssdeep": StringField(File.ssdeep),
        "crc32": StringField(File.crc32),
        "multi": MultiField(File.id),
    },
    Config.__name__: {
        "type": StringField(Config.config_type),
        "family": StringField(Config.family),
        "cfg": JSONField(Config.cfg),
        "multi": MultiField(Config.id),
    },
    TextBlob.__name__: {
        "name": StringField(TextBlob.blob_name),
        "size": SizeField(TextBlob.blob_size),
        "type": StringField(TextBlob.blob_type),
        "content": StringField(TextBlob._content),
        "first_seen": DatetimeField(TextBlob.upload_time),
        "last_seen": DatetimeField(TextBlob.last_seen),
        "multi": MultiField(TextBlob.id),
    },
}


def parse_field_path(field_path):
    """
    Extract subfields from fields path with proper control character handling:

    - \\x - escaped character
    - * - array element reference e.g. (array*:2)
    - . - field separator
    - " - quote for control character escaping
    """
    fields = [""]
    last_pos = 0

    for match in re.finditer(r"\\.|[.]|[*]+(?:[.]|$)", field_path):
        control_char = match.group(0)
        control_char_pos, next_pos = match.span(0)
        # Append remaining characters to the last field
        fields[-1] = fields[-1] + field_path[last_pos:control_char_pos]
        last_pos = next_pos
        # Check control character
        if control_char[0] == "\\":
            # Escaped character
            fields[-1] = fields[-1] + control_char[1]
        elif control_char == ".":
            # End of field
            fields.append("")
        elif control_char[0] == "*":
            # Terminate field as a tuple with count of trailing asterisks
            fields[-1] = (fields[-1], control_char.count("*"))
            # End of field with trailing asterisks
            if control_char[-1] == ".":
                fields.append("")

    if len(field_path) > last_pos:
        # Last field should not be a tuple at this point. If it is: something went wrong
        assert type(fields[-1]) is str
        fields[-1] = fields[-1] + field_path[last_pos:]
    return [field if type(field) is tuple else (field, 0) for field in fields]


def get_field_mapper(
    queried_type: Type[Object], field_selector: str
) -> Tuple[BaseField, List[str]]:
    field_path = parse_field_path(field_selector)
    field_name, asterisks = field_path[0]
    # Map object type selector
    if field_name in object_mapping:
        selected_type = object_mapping[field_name]
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
    field_name, asterisks = field_path[0]
    if field_name in field_mapping[selected_type.__name__]:
        field = field_mapping[selected_type.__name__][field_name]
    elif field_name in field_mapping[Object.__name__]:
        field = field_mapping[Object.__name__][field_name]
    else:
        raise FieldNotQueryableException(f"No such field: {field_name}")

    return field, field_path
