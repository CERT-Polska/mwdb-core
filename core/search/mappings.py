from model import File, Object, Config, TextBlob

mapping_objects = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob
}

mapping = {
    "file": {
        "dhash": File.dhash,
        "sha512": File.sha512,
        "sha256": File.sha256,
        "sha1": File.sha1,
        "md5": File.md5,
        "ssdeep": File.ssdeep,
        "crc32": File.crc32,
        "humanhash": File.humanhash,
        "name": File.file_name,
        "size": File.file_size,
        "type": File.file_type,
    },
    "object": {
        "dhash": Object.dhash,
    },
    "static": {
        "dhash": Config.dhash,
        "type": Config.config_type,
        "family": Config.family,
    },
    "config": {
        "dhash": Config.dhash,
        "type": Config.config_type,
        "family": Config.family,
    },
    "blob": {
        "dhash": TextBlob.dhash,
        "content": TextBlob._content,
        "type": TextBlob.blob_type,
        "name": TextBlob.blob_name,
        "size": TextBlob.blob_size
    }
}

multi_mapping_objects = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob
}

multi_mapping = {
    "file": {
        "tag": File.tags,
        "comment": File.comments,
    },
    "object": {
        "tag": Object.tags,
        "comment": Object.comments,
    },
    "static": {
        "tag": Config.tags,
        "comment": Config.comments,
    },
    "config": {
        "tag": Config.tags,
        "comment": Config.comments,
    },
    "blob": {
        "tag": TextBlob.tags,
        "comment": TextBlob.comments,
    }
}

meta_mapping_objects = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob
}

meta_mapping = {
    "file": {
        "meta": File.meta,
    },
    "object": {
        "meta": Object.meta,
    },
    "static": {
        "meta": Config.meta,
    },
    "config": {
        "meta": Config.meta,
    },
    "blob": {
        "meta": TextBlob.meta,
    }
}

share_mapping_objects = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob
}

share_mapping = {
    "file": {
        "shared": File.shares,
        "uploader": File.related_shares,
    },
    "object": {
        "shared": Object.shares,
        "uploader": Object.related_shares,
    },
    "static": {
        "shared": Config.shares,
        "uploader": Config.related_shares,
    },
    "config": {
        "shared": Config.shares,
        "uploader": Config.related_shares,
    },
    "blob": {
        "shared": TextBlob.shares,
        "uploader": TextBlob.related_shares,
    }
}

json_mapping_objects = {
    "static": Config,
    "config": Config
}

json_mapping = {
    "static": {
        "cfg": Config.cfg,
    },
    "config": {
        "cfg": Config.cfg,
    }
}

date_mapping_objects = {
    "file": File,
    "object": Object,
    "static": Config,
    "config": Config,
    "blob": TextBlob
}

date_mapping = {
    "file": {
        "upload_time": File.upload_time,
    },
    "object": {
        "upload_time": Object.upload_time,
    },
    "static": {
        "upload_time": Config.upload_time,
    },
    "config": {
        "upload_time": Config.upload_time,
    },
    "blob": {
        "upload_time": TextBlob.upload_time,
        "first_seen": TextBlob.upload_time,
        "last_seen": TextBlob.last_seen,
    }
}
