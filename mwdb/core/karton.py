import logging
from typing import Any, Dict, Optional

from flask import g
from karton.core import Config as KartonConfig
from karton.core import Producer, Resource, Task
from karton.core.inspect import KartonState
from karton.core.task import TaskPriority

from ..model.blob import TextBlob
from ..model.config import Config
from ..model.file import File
from ..model.object import Object
from ..version import app_version
from .config import app_config

logger = logging.getLogger("mwdb.karton")


class KartonProducer(Producer):
    identity = "karton.mwdb"
    version = app_version
    with_service_info = True


if app_config.mwdb.enable_karton:
    try:
        karton_producer = KartonProducer(
            config=KartonConfig(app_config.karton.config_path)
        )
    except Exception:
        logger.exception("Failed to load Karton producer")
        karton_producer = None
else:
    karton_producer = None


def get_karton_producer() -> Optional[Producer]:
    return karton_producer


def prepare_headers(obj: Object, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare headers to use when submitting this object to Karton.
    Takes into account object arguments to this analysis, some attributes,
    and share_3rd_party field (in this order of precedence).
    """
    headers = {
        "share_3rd_party": obj.share_3rd_party,
    }

    passthrough_attributes = ["execute"]
    for attribute in obj.attributes:
        if attribute.key in passthrough_attributes:
            headers[attribute.key] = attribute.value

    for attribute, value in arguments.items():
        headers[attribute] = value

    return headers


def send_file_to_karton(file: File, arguments: Dict[str, Any]) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    feed_quality = g.auth_user.feed_quality
    headers_persistent = prepare_headers(file, arguments)
    headers_persistent["quality"] = feed_quality
    task_priority = TaskPriority.NORMAL if feed_quality == "high" else TaskPriority.LOW

    file_stream = file.open()
    try:
        task = Task(
            headers={
                "type": "sample",
                "kind": "raw",
            },
            headers_persistent=headers_persistent,
            payload={
                "sample": Resource(file.file_name, fd=file_stream, sha256=file.sha256),
                "attributes": file.get_attributes(
                    as_dict=True, check_permissions=False
                ),
            },
            priority=task_priority,
        )
        producer.send_task(task)
    finally:
        file_stream.close()

    logger.info("File sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_config_to_karton(config: Config, arguments: Dict[str, Any]) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    task = Task(
        headers={
            "type": "config",
            "kind": config.config_type,
            "family": config.family,
        },
        headers_persistent=prepare_headers(config, arguments),
        payload={
            "config": config.cfg,
            "dhash": config.dhash,
            "attributes": config.get_attributes(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)

    logger.info("Configuration sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_blob_to_karton(blob: TextBlob, arguments: Dict[str, Any]) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    task = Task(
        headers={
            "type": "blob",
            "kind": blob.blob_type,
        },
        headers_persistent=prepare_headers(blob, arguments),
        payload={
            "content": blob.content,
            "dhash": blob.dhash,
            "attributes": blob.get_attributes(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)

    logger.info("Blob sent to Karton with %s", task.root_uid)
    return task.root_uid


def get_karton_state():
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    karton_state = KartonState(producer.backend)
    return karton_state
