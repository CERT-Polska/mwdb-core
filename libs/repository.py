import os
import re

from libs.objects import File, Config


def is_raw_ext(fn):
    RAW_EXT = ['.zip', '.js', '.jse', '.wsf', '.jar', '.vbe', '.vbs', '.html', '.htm', '.pdf', '.doc', '.xls']
    return os.path.splitext(fn)[1].lower() in RAW_EXT


def store_sample(data, cfg='api.conf'):
    sha256 = File(file_data=data).get_sha256()

    folder = os.path.join(Config(cfg).api.repository, sha256[0], sha256[1], sha256[2], sha256[3])
    if not os.path.exists(folder):
        os.makedirs(folder, 0750)

    file_path = os.path.join(folder, sha256)

    if not os.path.exists(file_path):
        sample = open(file_path, "wb")
        sample.write(data)
        sample.close()

    return file_path


def get_sample_path(sha256, cfg='api.conf'):
    path = os.path.join(Config(cfg).api.repository, sha256[0], sha256[1], sha256[2], sha256[3], sha256)
    if not os.path.exists(path):
        return None
    return path


def _file_name(m):
    import pefile, random, string
    with open(get_sample_path(m.sha256), 'rb') as f:
        d = f.read()
    name = pe = None
    try:
        pe = pefile.PE(data=d)
        name = pe.FileInfo[0].StringTable[0].entries['OriginalFilename']
        name = re.sub(r'[^0-9a-zA-Z_.-]', '_', name)
        if not name: raise Exception('noname')
    except:
        if pe:
            name = ''.join(random.sample(string.letters, random.randint(5, 20))) + (
                '.dll' if pe.FILE_HEADER.IMAGE_FILE_DLL else '.exe')

    return name or m.file_name


def file_name(m):
    fn = m.file_name
    name = fn if fn and is_raw_ext(fn) else _file_name(m)
    return name
