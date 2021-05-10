import logging
import shutil
import tempfile

from flask import g
from karton.core import Config as KartonConfig
from karton.core import Producer, Resource, Task
from karton.core.backend import KartonBackend
from karton.core.inspect import KartonState
from karton.core.task import TaskPriority

from .config import app_config

logger = logging.getLogger("mwdb.karton")


def get_karton_producer() -> Producer:
    return Producer(
        identity="karton.mwdb", config=KartonConfig(app_config.karton.config_path)
    )


def send_file_to_karton(file) -> str:
    from mwdb.model.file import File

    tmpfile = None

    try:
        # TODO: Use file.open() directly when Resource(fd=...)
        # is implemented in Karton
        try:
            # If file contents are available via path: just use the path
            path = file.get_path()
        except (ValueError, IOError):
            # If get_path doesn't work: download content to NamedTemporaryFile
            tmpfile = tempfile.NamedTemporaryFile()
            file_stream = file.open()
            shutil.copyfileobj(file_stream, tmpfile)
            File.close(file_stream)
            path = tmpfile.name

        producer = get_karton_producer()
        feed_quality = g.auth_user.feed_quality
        task_priority = (
            TaskPriority.NORMAL if feed_quality == "high" else TaskPriority.LOW
        )
        task = Task(
            headers={"type": "sample", "kind": "raw", "quality": feed_quality},
            payload={
                "sample": Resource(file.file_name, path=path, sha256=file.sha256),
                "attributes": file.get_metakeys(as_dict=True, check_permissions=False),
            },
            priority=task_priority,
        )
        producer.send_task(task)
    finally:
        if tmpfile is not None:
            tmpfile.close()

    logger.info("File sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_config_to_karton(config) -> str:
    producer = get_karton_producer()
    task = Task(
        headers={"type": "config", "kind": config.config_type, "family": config.family},
        payload={
            "config": config.cfg,
            "dhash": config.dhash,
            "attributes": config.get_metakeys(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)

    logger.info("Configuration sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_blob_to_karton(blob) -> str:
    producer = get_karton_producer()
    task = Task(
        headers={"type": "blob", "kind": blob.blob_type},
        payload={
            "content": blob.content,
            "dhash": blob.dhash,
            "attributes": blob.get_metakeys(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)

    logger.info("Blob sent to Karton with %s", task.root_uid)
    return task.root_uid


def get_karton_state():
    karton_config = KartonConfig(app_config.karton.config_path)
    karton_backend = KartonBackend(karton_config)
    karton_state = KartonState(karton_backend)
    return karton_state
