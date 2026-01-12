import io
from typing import IO, Iterator

import pyzipper


class StreamingBytesIO(io.BytesIO):
    def seekable(self) -> bool:
        return False

    def seek(self, offset, whence=0):
        # zipfile don't really care about seekable
        raise OSError("Stream is not seekable")

    def tell(self):
        # zipfile don't really care about seekable
        raise OSError("Stream is not tellable")

    def close(self):
        # We want zipfile to flush final headers on close
        # but we don't want to close the underlying stream
        return

    def discard(self):
        # The real BytesIO close will be available here
        super().close()

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.discard()

    def bytes_to_flush(self) -> int:
        return super().tell()

    def flush_out(self) -> Iterator[bytes]:
        # Flush pending data and remove them from buffer
        yield super().getvalue()
        super().truncate(0)
        super().seek(0)


def zip_stream(
    file_name: str,
    file_stream: IO[bytes],
    password: bytes,
    read_size: int = 1 * 1024 * 1024,
    write_size: int = 1 * 1024 * 1024,
) -> Iterator[bytes]:
    with StreamingBytesIO() as zipped_stream:
        with pyzipper.AESZipFile(
            zipped_stream,
            "w",
            compression=pyzipper.ZIP_LZMA,
            encryption=pyzipper.WZ_AES,
        ) as zf:
            zf.setpassword(password)
            with zf.open(file_name, mode="w") as zipped_file:
                while True:
                    buf = file_stream.read(read_size)
                    if not buf:
                        break
                    zipped_file.write(buf)
                    if zipped_stream.bytes_to_flush() > write_size:
                        yield from zipped_stream.flush_out()
        yield from zipped_stream.flush_out()
