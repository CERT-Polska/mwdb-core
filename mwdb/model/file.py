import os
import hashlib

from sqlalchemy import or_
from itsdangerous import TimedJSONWebSignatureSerializer, SignatureExpired, BadSignature
from werkzeug.utils import secure_filename

from mwdb.core.config import app_config
from mwdb.core.humanhash import Humanhash
from mwdb.core.util import calc_hash, calc_crc32, calc_magic, calc_ssdeep

from . import db
from .object import Object


class EmptyFileError(ValueError):
    pass


class File(Object):
    __tablename__ = 'file'

    id = db.Column(db.Integer, db.ForeignKey('object.id'), primary_key=True)
    file_name = db.Column(db.String, nullable=False, index=True)
    file_size = db.Column(db.Integer, nullable=False, index=True)
    file_type = db.Column(db.Text, nullable=False, index=True)
    md5 = db.Column(db.String(32), nullable=False, index=True)
    crc32 = db.Column(db.String(8), nullable=False, index=True)
    sha1 = db.Column(db.String(40), nullable=False, index=True)
    sha256 = db.Column(db.String(64), nullable=False, index=True, unique=True)
    sha512 = db.Column(db.String(128), nullable=False, index=True)
    humanhash = db.Column(db.String, nullable=False, index=True)
    # ssdeep is nullable due to lack of support in earlier versions
    ssdeep = db.Column(db.String(255), nullable=True, index=True)

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
    }

    @classmethod
    def get(cls, identifier):
        identifier = identifier.lower()
        file = File.query.filter(File.dhash == identifier)
        if file.scalar():
            return file
        return File.query.filter(or_(
            File.sha1 == identifier,
            File.sha256 == identifier,
            File.sha512 == identifier,
            File.md5 == identifier))

    @classmethod
    def get_or_create(cls, file, parent=None, metakeys=None, share_with=None):
        file.stream.seek(0, os.SEEK_END)
        file_size = file.tell()
        if file_size == 0:
            raise EmptyFileError

        sha256 = calc_hash(file.stream, hashlib.sha256(), lambda h: h.hexdigest())
        file_obj = File(
            dhash=sha256,
            file_name=secure_filename(file.filename),
            file_size=file_size,
            file_type=calc_magic(file.stream),
            crc32=calc_crc32(file.stream),
            md5=calc_hash(file.stream, hashlib.md5(), lambda h: h.hexdigest()),
            sha1=calc_hash(file.stream, hashlib.sha1(), lambda h: h.hexdigest()),
            sha256=sha256,
            sha512=calc_hash(file.stream, hashlib.sha512(), lambda h: h.hexdigest()),
            humanhash=Humanhash._humanhash(sha256),
            ssdeep=calc_ssdeep(file.stream)
        )

        file_obj, is_new = cls._get_or_create(
            file_obj, parent=parent, metakeys=metakeys, share_with=share_with
        )

        if is_new:
            file.stream.seek(0, os.SEEK_SET)
            file.save(file_obj.get_path())

        return file_obj, is_new

    def get_path(self):
        upload_root = app_config.mwdb.uploads_folder
        sample_sha256 = self.sha256.lower()
        # example: uploads/9/f/8/6/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
        subdir_path = os.path.abspath(os.path.join(upload_root, *list(sample_sha256)[0:4]))
        os.makedirs(subdir_path, mode=0o755, exist_ok=True)
        return os.path.join(subdir_path, sample_sha256)

    def generate_download_token(self):
        serializer = TimedJSONWebSignatureSerializer(app_config.mwdb.secret_key, expires_in=60)
        return serializer.dumps({'identifier': self.sha256})

    @staticmethod
    def get_by_download_token(download_token):
        serializer = TimedJSONWebSignatureSerializer(app_config.mwdb.secret_key)
        try:
            download_req = serializer.loads(download_token)
            return File.get(download_req["identifier"]).first()
        except SignatureExpired:
            return None
        except BadSignature:
            return None
