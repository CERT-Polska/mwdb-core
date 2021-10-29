from .relations import *
from .utils import rand_string


def test_adding_config_with_inblobs(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["reading_blobs", "adding_blobs", "adding_configs"])

    config_json = {
        "cnc": [1, 2, 3],
        "raw_cfg": {
            "in-blob": {
                "blob_name": "In blob name",
                "blob_type": "Blob type",
                "content": "Blob content"
            }
        },
        "peers": {
            "in-blob": {
                "blob_name": "Peers blob name",
                "blob_type": "Peers blob type",
                "content": "Hello"
            }
        }
    }

    config = Alice.session.add_config(None, "malwarex", config_json)

    assert sorted([config["cfg"]["raw_cfg"]["in-blob"], config["cfg"]["peers"]["in-blob"]]) == \
           sorted([config["children"][0]["id"], config["children"][1]["id"]])

    blob1 = Alice.session.get_blob(config["children"][0]["id"])
    blob2 = Alice.session.get_blob(config["children"][1]["id"])

    assert blob1["blob_name"] in ["In blob name", "Peers blob name"] and \
           blob2["blob_name"] in ["In blob name", "Peers blob name"]


def test_config_search_by_tags_transactional_added(admin_session):
    test = admin_session

    config_json = {
        "cnc": [1, 2, 3],
        "raw_cfg": {
            "in-blob": {
                "blob_name": "In blob name",
                "blob_type": "Blob type",
                "content": "Blob content"
            }
        },
        "peers": {
            "in-blob": {
                "blob_name": "Peers blob name",
                "blob_type": "Peers blob type",
                "content": "Hello"
            }
        }
    }

    tag_1 = rand_string(15)
    tag_2 = rand_string(15)
    tags = [{"tag": tag_1}, {"tag": tag_2}]

    config = test.add_config(None, "malwarex", config_json, tags)

    config_found_by_tag_1 = test.search(f'tag:{tag_1}')
    config_found_by_tag_2 = test.search(f'tag:{tag_2}')
    assert len(config_found_by_tag_1) > 0
    assert len(config_found_by_tag_2) > 0

    first_found_obj = config_found_by_tag_1[0]
    second_found_obj = config_found_by_tag_2[0]

    config_search_1 = test.get_config(first_found_obj["id"])
    config_search_2 = test.get_config(second_found_obj["id"])

    assert config_search_1["id"] == config["id"]
    assert config_search_2["id"] == config["id"]


def test_config_search_multi(admin_session):
    test = admin_session

    config_json_insert_1 = rand_string(15)
    config_json_1 = {
        "cnc": [1, 2, config_json_insert_1],
        "raw_cfg": {
            "in-blob": {
                "blob_name": "In blob name",
                "blob_type": "Blob type",
                "content": "Blob content"
            }
        },
        "peers": {
            "in-blob": {
                           "blob_name": "Peers blob name",
                           "blob_type": "Peers blob type",
                            "content": "Hello"
            }
        }
    }

    config_json_insert_2 = rand_string(15)
    config_json_2 = {
        "cnc": [1, 3, config_json_insert_2],
        "raw_cfg": {
            "in-blob": {
                "blob_name": "In blob name",
                "blob_type": "Blob type",
                "content": "Blob content"
            }
        },
        "peers": {
            "in-blob": {
                "blob_name": "Peers blob name",
                "blob_type": "Peers blob type",
                "content": "Hello world"
            }
        }
    }

    config_1 = test.add_config(None, "malwarex", config_json_1)
    config_2 = test.add_config(None, "malwarex", config_json_2)

    # config cfg and dhash search
    query = f'config.multi:"{config_json_insert_1} {config_2["id"]}"'
    found_objs = test.search(query)
    assert len(found_objs) == 2

    # only cfg content search in multi field
    query = f'config.multi:"{config_json_insert_1}"'
    found_obj = test.search(query)[0]
    assert found_obj["id"] == config_1["id"]

    # only blog dhash search in multi field
    query = f'config.multi:"{config_2["id"]}"'
    found_obj = test.search(query)[0]
    assert config_2["id"] == found_obj["id"]


def test_config_search_upload_count(admin_session):
    value_1 = rand_string()
    value_2 = rand_string()
    config_json = {
        "cnc": [1, 2, 3],
        "raw_cfg": {
            "in-blob": {
                "blob_name": value_1,
                "blob_type": "Blob type",
                "content": "Blob content"
            }
        },
        "peers": {
            "in-blob": {
                "blob_name": "Peers blob name",
                "blob_type": "Peers blob type",
                "content": value_2
            }
        }
    }

    tag = rand_string(15)

    # create 2 test users
    test_users = []
    for _ in range(2):
        user_name = random_name()
        user_password = random_name()
        admin_session.register_user(user_name, user_password, ["adding_tags", "adding_configs", "adding_blobs"])
        test_users.append({'user_name': user_name, 'user_password': user_password})

    users_session = MwdbTest()
    for user in test_users:
        users_session.login_as(user['user_name'], user['user_password'])
        config = users_session.add_config(None, "malwarex", config_json)
        users_session.add_tag(config["id"], tag)

    found_configs = admin_session.search(f'tag:{tag} AND config.upload_count:{len(test_users)}')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND config.upload_count:[{len(test_users)} TO *]')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND config.upload_count:[* TO {len(test_users)}]')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND config.upload_count:{{{len(test_users)} TO *]')
    assert len(found_configs) == 0

    found_configs = users_session.search(f'tag:{tag} AND config.upload_count:[* TO {len(test_users)}}}')
    assert len(found_configs) == 0

