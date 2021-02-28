import logging
import shutil
import tempfile
from typing import Optional

from flask import g
from karton.core import Config as KartonConfig
from karton.core import Producer, Resource, Task
from karton.core.backend import KartonBackend
from karton.core.inspect import KartonAnalysis, KartonState
from karton.core.task import TaskPriority

from ..model import Config, File, Object, TextBlob
from .config import app_config

logger = logging.getLogger("mwdb.karton")


def get_karton_producer() -> Producer:
    return Producer(
        identity="karton.mwdb", config=KartonConfig(app_config.karton.config_path)
    )


def send_file_to_karton(file: File) -> str:
    try:
        path = file.get_path()
        tmpfile = None
    except Exception:
        # If get_path doesn't work: download content to NamedTemporaryFile
        tmpfile = tempfile.NamedTemporaryFile()
        file_stream = file.open()
        shutil.copyfileobj(file_stream, tmpfile)
        File.close(file_stream)
        path = tmpfile.name

    producer = get_karton_producer()
    feed_quality = g.auth_user.feed_quality
    task_priority = TaskPriority.NORMAL if feed_quality == "high" else TaskPriority.LOW
    task = Task(
        headers={"type": "sample", "kind": "raw", "quality": feed_quality},
        payload={
            "sample": Resource(file.file_name, path=path, sha256=file.sha256),
            "attributes": file.get_metakeys(as_dict=True, check_permissions=False),
        },
        priority=task_priority,
    )
    producer.send_task(task)

    if tmpfile is not None:
        tmpfile.close()

    file.add_metakey("karton", task.root_uid, check_permissions=False)
    logger.info("File sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_config_to_karton(config: Config) -> str:
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
    config.add_metakey("karton", task.root_uid, check_permissions=False)
    logger.info("Configuration sent to Karton with %s", task.root_uid)
    return task.root_uid


def send_blob_to_karton(blob: TextBlob) -> str:
    producer = get_karton_producer()
    task = Task(
        headers={"type": "blob", "kind": blob.blob_type},
        payload={
            "config": blob.content,
            "dhash": blob.dhash,
            "attributes": blob.get_metakeys(as_dict=True, check_permissions=False),
        },
    )
    producer.send_task(task)
    blob.add_metakey("karton", task.root_uid, check_permissions=False)
    logger.info("Blob sent to Karton with %s", task.root_uid)
    return task.root_uid


def get_karton_analysis(
    db_object: Object, root_uid: Optional[str] = None
) -> Optional[KartonAnalysis]:
    # Includes 'karton' permission check
    metakeys = db_object.get_metakeys(as_dict=True)

    if "karton" not in metakeys:
        return None
    if not root_uid:
        # Metakeys are ordered from oldest to latest one
        root_uid = metakeys["karton"][-1]
    elif root_uid not in metakeys["karton"]:
        # root_uid must occur in attributes to get the analysis status
        return None

    karton_config = KartonConfig(app_config.karton.config_path)
    karton_backend = KartonBackend(karton_config)
    karton_state = KartonState(karton_backend)

    if root_uid not in karton_state.analyses:
        return None

    if karton_state.analyses[root_uid].is_done:
        return None

    return karton_state.analyses[root_uid]
