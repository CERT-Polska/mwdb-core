import os
import hashlib

from sqlalchemy import or_
from werkzeug.utils import secure_filename

from core.humanhash import Humanhash
from core.util import calc_hash, calc_crc32, calc_magic, calc_ssdeep, get_sample_path

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
            file.save(get_sample_path(sha256))

        return file_obj, is_new
