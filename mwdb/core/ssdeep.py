import ctypes

from .config import app_config

# https://github.com/ssdeep-project/ssdeep/blob/df3b860f8918261b3faeec9c7d2c8a241089e6e6/fuzzy.h#L221
_FUZZY_MAX_RESULT = 2 * 64 + 20
_libfuzzy = None

if app_config.mwdb.enable_ssdeep:
    try:
        _libfuzzy = ctypes.cdll.LoadLibrary("libfuzzy.so.2")
        _libfuzzy.fuzzy_new.restype = ctypes.c_void_p
        _libfuzzy.fuzzy_update.argtypes = ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int
        _libfuzzy.fuzzy_update.restype = ctypes.c_int
        _libfuzzy.fuzzy_digest.argtypes = ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int
        _libfuzzy.fuzzy_digest.restype = ctypes.c_int
        _libfuzzy.fuzzy_free.argtypes = (ctypes.c_void_p,)
    except Exception:
        raise RuntimeError(
            "Failed to load libfuzzy.so. Disable ssdeep evaluation by setting "
            "enable_ssdeep option in configuration to 0 or make sure that 'libfuzzy2' "
            "is installed correctly."
        )


class SsdeepHash:
    def __init__(self):
        self._state = None
        if not _libfuzzy:
            raise RuntimeError("libfuzzy not loaded")
        self._state = _libfuzzy.fuzzy_new()
        if not self._state:
            raise RuntimeError("fuzzy_new() failed")

    def update(self, buf: bytes) -> None:
        if not self._state:
            raise ValueError("Hash object is closed")
        if (res := _libfuzzy.fuzzy_update(self._state, buf, len(buf))) != 0:
            raise RuntimeError(f"fuzzy_update() failed with {res}")

    def digest(self) -> str:
        if not self._state:
            raise ValueError("Hash object is closed")
        digest_buf = ctypes.create_string_buffer(_FUZZY_MAX_RESULT)
        if (res := _libfuzzy.fuzzy_digest(self._state, digest_buf, 0)) != 0:
            raise RuntimeError(f"fuzzy_update() failed with {res}")
        return digest_buf.value.decode("ascii")

    def close(self):
        if self._state:
            _libfuzzy.fuzzy_free(self._state)
            self._state = None

    def __del__(self):
        self.close()
