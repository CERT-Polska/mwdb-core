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

    # blob_name = rand_string(15)
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
