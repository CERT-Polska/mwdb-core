from .relations import *


def test_adding_config_with_inblobs():
    testCase = RelationTestCase()

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

    config = Alice.session().add_config(None, "malwarex", config_json)

    assert sorted([config["cfg"]["raw_cfg"]["in-blob"], config["cfg"]["peers"]["in-blob"]]) == \
           sorted([config["children"][0]["id"], config["children"][1]["id"]])

    blob1 = Alice.session().get_blob(config["children"][0]["id"])
    blob2 = Alice.session().get_blob(config["children"][1]["id"])

    assert blob1["blob_name"] in ["In blob name", "Peers blob name"] and \
           blob2["blob_name"] in ["In blob name", "Peers blob name"]
