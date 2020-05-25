from .relations import *
from .utils import base62uuid


def test_file_name_search():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)

    found_objs = test.search(f'file.name:{sample["file_name"]}')

    assert len(found_objs) > 0
    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_wildcard_search():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)

    found_objs = test.search(f'file.name:{filename[:len(filename)//2]}*')

    assert len(found_objs) > 0
    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]

    found_objs = test.search(f'file.name:*{filename[len(filename)//2:]}')

    assert len(found_objs) > 0
    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]

    found_objs = test.search(f'file.name:{filename[:len(filename)//2]}?{filename[len(filename)//2+1:]}')

    assert len(found_objs) > 0
    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_search_tag():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)
    tag = base62uuid().lower()
    test.add_tag(sample["id"], tag)

    found_objs = test.search(f'tag:{tag}')
    assert len(found_objs) > 0

    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_search_size():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = b"a"*1337

    test.add_sample(filename, file_content)
    found_objs = test.search(f'file.size:1337')
    assert len(found_objs) > 0
    found_objs = test.search(f'file.size:[1336 TO 1337]')
    assert len(found_objs) > 0


def test_search_comment():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)
    comment = base62uuid().lower()
    test.add_comment(sample["id"], comment)

    found_objs = test.search(f'comment:{comment}')
    assert len(found_objs) > 0

    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_search_bin_op():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)
    comment = base62uuid().lower()
    test.add_comment(sample["id"], comment)

    found_objs = test.search(f'comment:{comment} AND file.name:{filename}')
    assert len(found_objs) > 0

    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_search_metakey():
    test = MwdbTest()
    test.login()

    filename = base62uuid()
    file_content = base62uuid()

    key = base62uuid().lower()
    value = base62uuid().lower()

    sample = test.add_sample(filename, file_content)
    test.add_attribute_definition(key, "")
    test.add_attribute(sample["id"], key, value)

    found_objs = test.search(f'meta.{key}:{value}')
    assert len(found_objs) > 0

    found_objs = test.search(f'file.meta.{key}:{value}')
    assert len(found_objs) > 0

    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_search_json():
    test = MwdbTest()
    test.login()

    value = base62uuid().lower()

    test.add_config(None, "malwarex", {
        "plain": value,
        "list": [
            {"dict_in_list": value}
        ],
        "dict": {
            "field": value
        }
    })

    found_objs = test.search(f'config.cfg.plain:{value}')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg.plain:xxx')
    assert len(found_objs) == 0

    found_objs = test.search(f'config.cfg.dict.field:{value}')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg.dict.field:xxx')
    assert len(found_objs) == 0

    found_objs = test.search(f'config.cfg:*{value}*')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg:"*\\"dict_in_list\\": \\"{value}\\"*"')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg:"*\\"dict_in_list\\": \\"xxx\\"*"')
    assert len(found_objs) == 0
