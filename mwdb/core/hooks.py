import abc
import functools
from typing import TYPE_CHECKING, Any

from mwdb.core.config import app_config
from mwdb.core.log import getLogger

if TYPE_CHECKING:
    from mwdb.model import Comment, Config, File, Object, Tag, TextBlob
    from mwdb.model.attribute import Attribute, AttributeDefinition
    from mwdb.model.group import Group
    from mwdb.model.user import User

_hook_handlers: list["HookHandler"] = []
logger = getLogger()


def register_hook_handler(hook_handler: "HookHandler"):
    _hook_handlers.append(hook_handler)


def schedule_hook(
    hook_name: str, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> None:
    """
    Schedule hook handler to be executed after successful transaction
    """
    from flask import g

    if not hasattr(g, "scheduled_hooks"):
        g.scheduled_hooks = []
    if (hook_name, args, kwargs) in g.scheduled_hooks:
        return
    g.scheduled_hooks.append((hook_name, args, kwargs))


def execute_hook_handlers():
    """
    Execute scheduled hook handlers
    """
    from flask import g

    if not hasattr(g, "scheduled_hooks"):
        return

    if _hook_handlers and not app_config.mwdb.enable_hooks:
        logger.info("Hooks won't be ran because enable_hooks is disabled.")
        return

    for hook_handler in _hook_handlers:
        for hook_name, args, kwargs in g.scheduled_hooks:
            try:
                fn = getattr(hook_handler, hook_name)
                fn(*args, **kwargs)
            except Exception:
                logger.exception(
                    "Hook handler raised exception while handling '%s'", hook_name
                )


def hook_method(method):
    @functools.wraps(method)
    def hook_handler(self: "HookMethods", *args, **kwargs):
        self._schedule_hook(method.__name__, *args, **kwargs)
        return method(self, *args, **kwargs)

    return hook_handler


def changes_object(method):
    @functools.wraps(method)
    def hook_handler(self: "HookMethods", *args, **kwargs):
        from mwdb.model import Object

        for arg in args:
            if isinstance(arg, Object):
                self._schedule_hook("on_changed_object", arg)
        for kwarg in kwargs.values():
            if isinstance(kwarg, Object):
                self._schedule_hook("on_changed_object", kwarg)
        return method(self, *args, **kwargs)

    return hook_handler


class HookMethods(abc.ABC):
    def _schedule_hook(self, method_name: str, *args: Any, **kwargs: Any): ...

    @hook_method
    def on_created_object(self, object: "Object"): ...

    @hook_method
    def on_reuploaded_object(self, object: "Object"): ...

    @hook_method
    def on_removed_object(self, object: "Object"): ...

    @hook_method
    def on_created_file(self, file: "File"): ...

    @hook_method
    def on_reuploaded_file(self, file: "File"): ...

    @hook_method
    def on_removed_file(self, file: "File"): ...

    @hook_method
    def on_created_config(self, config: "Config"): ...

    @hook_method
    def on_reuploaded_config(self, config: "Config"): ...

    @hook_method
    def on_removed_config(self, config: "Config"): ...

    @hook_method
    def on_created_text_blob(self, blob: "TextBlob"): ...

    @hook_method
    def on_reuploaded_text_blob(self, blob: "TextBlob"): ...

    @hook_method
    def on_removed_text_blob(self, blob: "TextBlob"): ...

    @hook_method
    @changes_object
    def on_created_tag(self, object: "Object", tag: "Tag"): ...

    @hook_method
    @changes_object
    def on_reuploaded_tag(self, object: "Object", tag: "Tag"): ...

    @hook_method
    @changes_object
    def on_removed_tag(self, object: "Object", tag: "Tag"): ...

    @hook_method
    @changes_object
    def on_created_comment(self, object: "Object", comment: "Comment"): ...

    @hook_method
    @changes_object
    def on_removed_comment(self, object: "Object", comment: "Comment"): ...

    @hook_method
    @changes_object
    def on_created_relation(self, parent: "Object", child: "Object"): ...

    @hook_method
    @changes_object
    def on_removed_relation(self, parent: "Object", child: "Object"): ...

    @hook_method
    def on_created_attribute_key(self, attribute_def: "AttributeDefinition"): ...

    @hook_method
    def on_updated_attribute_key(self, attribute_def: "AttributeDefinition"): ...

    @hook_method
    def on_removed_attribute_key(self, attribute_def: "AttributeDefinition"): ...

    @hook_method
    @changes_object
    def on_created_attribute(self, object: "Object", attribute: "Attribute"): ...

    @hook_method
    @changes_object
    def on_removed_attribute(self, object: "Object", attribute: "Attribute"): ...

    @hook_method
    def on_created_user(self, user: "User"): ...

    @hook_method
    def on_removed_user(self, user: "User"): ...

    @hook_method
    def on_updated_user(self, user: "User"): ...

    @hook_method
    def on_created_group(self, group: "Group"): ...

    @hook_method
    def on_removed_group(self, group: "Group"): ...

    @hook_method
    def on_updated_group(self, group: "Group"): ...

    @hook_method
    def on_created_membership(self, group: "Group", user: "User"): ...

    @hook_method
    def on_removed_membership(self, group: "Group", user: "User"): ...

    @hook_method
    def on_updated_membership(self, group: "Group", user: "User"): ...

    @hook_method
    def on_changed_object(self, object: "Object"): ...


class HookHandler(HookMethods):
    def _schedule_hook(self, method_name: str, *args: Any, **kwargs: Any):
        return


class HookDispatcher(HookMethods):
    def _schedule_hook(self, method_name: str, *args: Any, **kwargs: Any):
        schedule_hook(method_name, args, kwargs)


hooks = HookDispatcher()
