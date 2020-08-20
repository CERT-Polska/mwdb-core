from .relations import *


def test_adding_config_with_inblobs():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice", capabilities=["reading_blobs", "adding_blobs"])

    config_json = {
            "cnc": [1,2,3],
            "raw_cfg": {
            "in-blob": {
            "blob_name": "In blob name",
            "blob_type": "Blob type",
            "content": "Blob content"
            }
            },
            "peers": {
            "in-blob": {
            "description": "Desc",
            "blob_name": "Peers blob name",
            "blob_type": "Peers blob type",
            "content": "Hello"
            }
            }
    }

    config = Alice.session().add_config(None, "malwarex", config_json)

    assert isinstance(config["cfg"]["raw_cfg"]["in-blob"], str) \
           and isinstance(config["cfg"]["peers"]["in-blob"], str) \
           and (config["cfg"]["raw_cfg"]["in-blob"] == config["children"][0]["id"]
                or config["children"][1]["id"]) \
           and (config["cfg"]["peers"]["in-blob"] == config["children"][0]["id"]
                or config["children"][1]["id"])

    blobs = Alice.session().recent_blobs(1)

    assert blobs["blobs"][0]["blob_name"] == "In blob name" or "Peers blob name" and \
           blobs["blobs"][1]["blob_name"] == "In blob name" or "Peers blob name"