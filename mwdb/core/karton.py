import logging
from typing import Optional

from flask import g
from karton.core import Config as KartonConfig
from karton.core import Producer, Resource, Task
from karton.core.inspect import KartonState
from karton.core.task import TaskPriority

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


def send_file_to_karton(file) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    file_stream = file.open()
    try:
        feed_quality = g.auth_user.feed_quality
        task_priority = (
            TaskPriority.NORMAL if feed_quality == "high" else TaskPriority.LOW
        )
        task = Task(
            headers={
                "type": "sample",
                "kind": "raw",
            },
            headers_persistent={
                "quality": feed_quality,
                "share_3rd_party": file.share_3rd_party,
            },
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


def send_config_to_karton(config) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    task = Task(
        headers={
            "type": "config",
            "kind": config.config_type,
            "family": config.family,
        },
        headers_persistent={
            "share_3rd_party": config.share_3rd_party,
        },
        payload={
            "config": config.cfg,
            "dhash": config.dhash,
            "attributes": config.get_attributes(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)

    logger.info("Configuration sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_blob_to_karton(blob) -> str:
    producer = get_karton_producer()

    if producer is None:
        raise RuntimeError("Karton is not enabled or failed to load properly")

    task = Task(
        headers={
            "type": "blob",
            "kind": blob.blob_type,
        },
        headers_persistent={
            "share_3rd_party": blob.share_3rd_party,
        },
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
