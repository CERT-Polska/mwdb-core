import time
import datetime

from .relations import *
from .utils import base62uuid
from .utils import ShouldRaise


def test_file_name_search(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = base62uuid()

    sample = test.add_sample(filename, file_content)

    found_objs = test.search(f'file.name:{sample["file_name"]}')

    assert len(found_objs) > 0
    first_found_obj = found_objs[0]

    sample_from_search = test.get_sample(first_found_obj["id"])
    assert sample_from_search["id"] == sample["id"]


def test_wildcard_search(admin_session):
    test = admin_session

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


def test_search_tag(admin_session):
    test = admin_session

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


def test_search_size(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = b"a"*1337

    test.add_sample(filename, file_content)
    found_objs = test.search(f'file.size:1337')
    assert len(found_objs) > 0
    found_objs = test.search(f'file.size:[1336 TO 1337]')
    assert len(found_objs) > 0
    found_objs = test.search(f'file.size:[1.30kb TO 1.31kb]')
    assert len(found_objs) > 0



def test_search_comment(admin_session):
    test = admin_session

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


def test_search_bin_op(admin_session):
    test = admin_session

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


def test_search_metakey(admin_session):
    test = admin_session

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


def test_search_json(admin_session):
    test = admin_session

    value = base62uuid().lower()

    test.add_config(None, "malwarex", {
        "plain": value,
        "list": [
            {"dict_in_list": value}
        ],
        "dict": {
            "field": value
        },
        "array": [
            1, 2, 3
        ],
        "array*array": [
            1, [2, 3]
        ]
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

    found_objs = test.search(f'config.cfg.array*:1')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.array:"*1, 2*"')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.list.dict_in_list*:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg:"*\\"dict_in_list\\": \\"{value}\\"*"')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg:"*\\"dict_in_list\\": \\"xxx\\"*"')
    assert len(found_objs) == 0

    found_objs = test.search('config.cfg.array\\*array*:1')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg.array\\*array*:2')
    assert len(found_objs) == 0

    found_objs = test.search('config.cfg.array\\*array**:2')
    assert len(found_objs) == 1


def test_search_json_special_chars(admin_session):
    test = admin_session

    value = base62uuid().lower()

    test.add_config(None, "malwarex", {
        r"array*with*stars\*": [1, 2, 3, value],
        r"key\with\slashes": value,
        r"key.with spaces": value,
        r'key"with:quote': value,
        r'key"with\"quotes': value,
    })

    found_objs = test.search(f'config.cfg.array\\*with\\*stars\\\\\\**:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.key\\\\with\\\\slashes:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.key\\.with\\ spaces:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.key\\"with\\:quote:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.key"with\\\\"quotes:{value}')
    assert len(found_objs) == 1


def test_search_file_size_unbounded(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = b"a" * 1338
    file2name = base62uuid()
    file2_content = b"a" * 2000
    file3name = base62uuid()
    file3_content = b"a" * 1000
    tag = "file_size_unbounded_search"

    sample = test.add_sample(filename, file_content)
    test.add_tag(sample["id"], tag)
    sample2 = test.add_sample(file2name, file2_content)
    test.add_tag(sample2["id"], tag)
    sample3 = test.add_sample(file3name, file3_content)
    test.add_tag(sample3["id"], tag)

    found_objs = test.search(f'file.size:[* TO *] AND tag:{tag}')
    assert len(found_objs) == 3
    found_objs = test.search(f'file.size:[1338 TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = test.search(f'file.size:>=1338 AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = test.search(f'file.size:[* TO 1338}} AND tag:{tag}')
    assert len(found_objs) == 1
    found_objs = test.search(f'file.size:[* TO 1000}} AND tag:{tag}')
    assert len(found_objs) == 0


def test_search_date_time_unbounded(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = b"a" * 5000
    file2name = base62uuid()
    file2_content = b"a" * 5100
    tag = "date_time_unbounded_search"

    now = datetime.datetime.now()
    now = now.strftime("%Y-%m-%d %H:%M:%S")
    sample = test.add_sample(filename, file_content)
    test.add_tag(sample["id"], tag)
    time.sleep(1)
    sample2 = test.add_sample(file2name, file2_content)
    test.add_tag(sample2["id"], tag)

    found_objs = test.search(f'upload_time:["{now}" TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = test.search(f'upload_time:">={now}" AND tag:{tag}')
    assert len(found_objs) == 2
    with ShouldRaise(status_code=400):
        found_objs = test.search(f'upload_time:"<{now}" AND tag:{tag}')


def test_search_no_access_to_parent(admin_session):
    filename = base62uuid()
    file_content = b"a" * 5000
    file2name = base62uuid()
    file2_content = b"a" * 5100
    tag = "no_access_to_parent"

    sample = admin_session.add_sample(filename, file_content)
    admin_session.add_tag(sample["id"], tag)
    sample2 = admin_session.add_sample(file2name, file2_content, sample["sha256"])
    admin_session.add_tag(sample2["id"], tag)

    admin_session.register_user("test1", "testpass", ["adding_tags"])
    test = MwdbTest()
    test.login_as("test1", "testpass")

    sample2 = test.add_sample(file2name, file2_content)
    test.add_tag(sample2["id"], tag)

    found_objs = test.search(f'parent:(file.size:5000) AND tag:{tag}')
    assert len(found_objs) == 0


def test_child_mixed(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = b"a" * 7000
    tag = "child_mixed"

    sample = test.add_sample(filename, file_content)
    test.add_tag(sample["id"], tag)

    cfg = {
        "config": {
            "field": "test",
        },
    }

    config = test.add_config(sample["sha256"], "malwarex", cfg)

    filename2 = base62uuid()
    file_content2 = b"a" * 7500
    tag = "child_mixed"

    sample2 = test.add_sample(filename2, file_content2, config["id"])
    test.add_tag(sample2["id"], tag)

    found_objs = test.search(f'child:(config.cfg.config.field:test AND child:(file.size:7500 AND tag:{tag}))')
    assert len(found_objs) == 1 and found_objs[0]["id"] == sample["id"]


def test_uploader_query(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")

    Workgroup = testCase.new_group("Workgroup")

    # Alice and Bob are in Workgroup
    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    # FileA is created by Alice and shared with nobody else
    FileA = testCase.new_sample("File")
    FileA.create(Alice, upload_as=Alice.identity)
    # FileB is created by Bob and shared with nobody else
    FileB = testCase.new_sample("File")
    FileB.create(Bob, upload_as=Bob.identity)
    # FileC is created by Alice and shared with Public
    FileC = testCase.new_sample("File")
    FileC.create(Alice, upload_as="public")

    # Alice looks for own files
    results = [
        result["id"] for result in
        Alice.session.search(f"uploader:{Alice.identity}")
    ]
    assert sorted(results) == sorted([FileA.dhash, FileC.dhash])
    # Bob looks for own files
    results = [
        result["id"] for result in
        Bob.session.search(f"uploader:{Bob.identity}")
    ]
    assert sorted(results) == sorted([FileB.dhash])
    # Alice looks for files uploaded by Bob
    results = Alice.session.search(f"uploader:{Bob.identity}")
    assert len(results) == 0
    # Bob looks for files uploaded by Alice
    results = [
        result["id"] for result in
        Bob.session.search(f"uploader:{Alice.identity}")
    ]
    assert sorted(results) == sorted([FileC.dhash])
