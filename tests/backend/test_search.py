import time
import datetime

from .relations import *
from .utils import base62uuid
from .utils import ShouldRaise
from .utils import rand_string
import random


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


def test_file_alternative_name_search(admin_session):
    test = admin_session

    filename_main = base62uuid()
    filename_alt_1 = base62uuid()
    filename_alt_2 = base62uuid()

    file_content = base62uuid()

    # upload the same sample with different names
    test.add_sample(filename_main, file_content)
    test.add_sample(filename_alt_1, file_content)
    test.add_sample(filename_alt_2, file_content)

    # simple search
    found_objs_1 = test.search(f'file.name:{filename_main}')
    found_objs_2 = test.search(f'file.name:{filename_alt_1}')
    found_objs_3 = test.search(f'file.name:{filename_alt_2}')

    assert len(found_objs_1) == 1
    assert len(found_objs_2) == 1
    assert len(found_objs_3) == 1
    assert found_objs_1[0]["id"] == found_objs_2[0]["id"]
    assert found_objs_1[0]["id"] == found_objs_3[0]["id"]

    # wildcard search
    found_objs_1_with_wildcard = test.search(f'file.name:{filename_main[:len(filename_main)// 2]}*')
    found_objs_2_with_wildcard = test.search(f'file.name:*{filename_alt_1[len(filename_alt_1) // 2:]}')
    found_objs_3_with_wildcard = test.search(f'file.name:*{filename_alt_2[1:len(filename_alt_2)-1]}*')
    assert len(found_objs_1_with_wildcard) == 1
    assert len(found_objs_2_with_wildcard) == 1
    assert len(found_objs_3_with_wildcard) == 1
    assert found_objs_1_with_wildcard[0]["id"] == found_objs_2_with_wildcard[0]["id"]
    assert found_objs_1_with_wildcard[0]["id"] == found_objs_3_with_wildcard[0]["id"]


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


def test_search_by_tags_transactional_added(admin_session):
    test = admin_session

    filename = base62uuid()
    file_content = base62uuid()
    tag_1 = rand_string(15)
    tag_2 = rand_string(15)
    tags = [{"tag": tag_1}, {"tag": tag_2}]

    sample = test.add_sample(filename, file_content, tags=tags)

    found_obj_by_tag_1 = test.search(f'tag:{tag_1}')
    found_obj_by_tag_2 = test.search(f'tag:{tag_2}')
    assert len(found_obj_by_tag_1) > 0
    assert len(found_obj_by_tag_2) > 0

    first_found_obj = found_obj_by_tag_1[0]
    second_found_obj = found_obj_by_tag_2[0]

    sample_search_1 = test.get_sample(first_found_obj["id"])
    sample_search_2 = test.get_sample(second_found_obj["id"])
    assert sample_search_1["id"] == sample["id"]
    assert sample_search_2["id"] == sample["id"]


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

    array_value_1 = random.randint(0, int(1e9))
    array_value_2 = array_value_1 + 1
    array_value_3 = array_value_1 + 2


    test.add_config(None, "malwarex", {
        "plain": value,
        "list": [
            {"dict_in_list": value}
        ],
        "dict": {
            "field": value
        },
        "array": [
            array_value_1, array_value_2, array_value_2
        ],
        "array*array": [
            array_value_1, [array_value_2, array_value_3]
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

    found_objs = test.search(f'config.cfg.array*:{array_value_1}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.array:"*{array_value_1}, {array_value_2}*"')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.list.dict_in_list*:{value}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg:"*\\"dict_in_list\\": \\"{value}\\"*"')
    assert len(found_objs) == 1

    found_objs = test.search('config.cfg:"*\\"dict_in_list\\": \\"xxx\\"*"')
    assert len(found_objs) == 0

    found_objs = test.search(f'config.cfg.array\\*array*:{array_value_1}')
    assert len(found_objs) == 1

    found_objs = test.search(f'config.cfg.array\\*array*:{array_value_2}')
    assert len(found_objs) == 0

    found_objs = test.search(f'config.cfg.array\\*array**:{array_value_2}')
    assert len(found_objs) == 1


def test_search_json_ranges(admin_session):
    test = admin_session

    value = base62uuid().lower()

    test.add_config(
        None,
        "malwarex",
        {"array": [1, 10, 30], "value": 100, "key": value},  # for deduplication
    )
    found_objs = test.search(f"config.cfg.array*:[10 TO 100]")
    assert len(found_objs) == 1

    found_objs = test.search(f"config.cfg.value:<100")
    assert len(found_objs) == 0

    found_objs = test.search(f"config.cfg.value:<=100")
    assert len(found_objs) == 1

    found_objs = test.search(f"config.cfg.value:>100")
    assert len(found_objs) == 0

    found_objs = test.search(f"config.cfg.value:>=100")
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
    file_content = b"a" * 5000 + rand_string(10).encode("utf-8")
    file2name = base62uuid()
    file2_content = b"a" * 5100 + rand_string(10).encode("utf-8")
    tag = "date_time_unbounded_search"

    now = datetime.datetime.utcnow()
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

        
def test_search_date_time_relative(admin_session):
    filename_1 = base62uuid()
    file_content_1 = b"abc" * 500 + rand_string(30).encode("utf-8")
    sample_1 = admin_session.add_sample(filename_1, file_content_1)
    time.sleep(1)
    filename_2 = base62uuid()
    file_content_2 = b"abc" * 500 + rand_string(30).encode("utf-8")
    sample_2 = admin_session.add_sample(filename_2, file_content_2)
    tag = rand_string(20)
    admin_session.add_tag(sample_1["id"], tag)
    admin_session.add_tag(sample_2["id"], tag)
    time.sleep(1)
    
    found_objs = admin_session.search(f'upload_time:>=1s AND tag:{tag}')
    assert len(found_objs) == 0
    found_objs = admin_session.search(f'upload_time:[1s TO *] AND tag:{tag}')
    assert len(found_objs) == 0
    found_objs = admin_session.search(f'upload_time:>=4s AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[4s TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=1M AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[1M TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=1h AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[1h TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=1d AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[1d TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=1w AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[1w TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=2m AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[2m TO *] AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:>=5y AND tag:{tag}')
    assert len(found_objs) == 2
    found_objs = admin_session.search(f'upload_time:[5y TO *] AND tag:{tag}')
    assert len(found_objs) == 2

    with ShouldRaise(status_code=400):
        found_objs = admin_session.search(f'upload_time:>=s1 AND tag:{tag}')
    with ShouldRaise(status_code=400):
        found_objs = admin_session.search(f'upload_time:>=1x AND tag:{tag}')


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

    test_user = random_name()
    admin_session.register_user(test_user, test_user, ["adding_tags"])

    test = MwdbTest()
    test.login_as(test_user, test_user)

    sample2 = test.add_sample(file2name, file2_content)
    test.add_tag(sample2["id"], tag)

    found_objs = test.search(f'parent:(file.size:5000) AND tag:{tag}')
    assert len(found_objs) == 0


def test_search_upload_count(admin_session):
    filename = base62uuid()
    file_content = b"a" * 10 + rand_string(10).encode("utf-8")
    tag = rand_string(15)

    # create 3 test users
    test_users = []
    for _ in range(3):
        user_name = random_name()
        user_password = random_name()
        admin_session.register_user(user_name, user_password, ["adding_tags"])
        test_users.append({'user_name': user_name, 'user_password': user_password})

    users_session = MwdbTest()
    for user in test_users:
        users_session.login_as(user['user_name'], user['user_password'])
        sample = users_session.add_sample(filename, file_content)
        users_session.add_tag(sample["id"], tag)

    found_samples = admin_session.search(f'tag:{tag} AND file.upload_count:{len(test_users)}')
    assert len(found_samples) == 1

    found_samples = users_session.search(f'tag:{tag} AND file.upload_count:[{len(test_users)} TO *]')
    assert len(found_samples) == 1

    found_samples = users_session.search(f'tag:{tag} AND file.upload_count:[* TO {len(test_users)}]')
    assert len(found_samples) == 1

    found_samples = users_session.search(f'tag:{tag} AND file.upload_count:{{{len(test_users)} TO *]')
    assert len(found_samples) == 0

    found_samples = users_session.search(f'tag:{tag} AND file.upload_count:[* TO {len(test_users)}}}')
    assert len(found_samples) == 0


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


def test_search_multi(admin_session):
    test = admin_session

    # multi hashes search
    samples = []
    for i in range(5):
        filename = base62uuid()
        file_content = base62uuid()
        sample = test.add_sample(filename, file_content)
        samples.append(sample)

    query = f'file.multi:"{samples[0].get("sha512")} {samples[1].get("md5")} {samples[2].get("sha1")} {samples[3].get("sha256")} {samples[4].get("crc32")}"'
    found_objs = test.search(query)
    assert len(found_objs) == 5

    # incorrect hash check
    incorrect_hash = samples[0].get("sha512")[:-2]
    with ShouldRaise(status_code=400):
        found_objs = test.search(f'file.multi:"{incorrect_hash}"')

    # wildcard in hash
    wildcard_hash = samples[0].get("sha512")[:-100] + "*"
    with ShouldRaise(status_code=400):
        found_objs = test.search(f'file.multi:"{wildcard_hash}"')
