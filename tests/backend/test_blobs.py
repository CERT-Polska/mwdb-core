from .relations import *
from .utils import random_name, rand_string


def test_adding_blobs(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["reading_blobs", "adding_blobs"])
    blob = Alice.session.add_blob(None, blobname="malwarex.blob", blobtype="inject", content="""
    TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST
    Binary junk: \x00\x01\x02\x03\x04\x05\x07

    HELLO WORLD!
    ========""" + random_name() + "XPADDINGX" * 60)

    assert "\x00\x01" in Alice.session.get_blob(blob["id"])["content"]


def test_blob_permissions(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["reading_blobs", "adding_blobs"])
    Bob = testCase.new_user("Blob")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    BlobA = testCase.new_blob("BlobA")
    BlobB = testCase.new_blob("BlobB")
    BlobC = testCase.new_blob("BlobC")

    SampleA([
        SampleB(),
        BlobA(),
        BlobB(),
        BlobC()
    ]).create()

    SampleA.create(Alice)
    SampleA.create(Bob)

    SampleA([
        SampleB(should_access=[Alice, Bob]),
        BlobA(should_access=[Alice, Bob]),
        BlobB(should_access=[Alice, Bob]),
        BlobC(should_access=[Alice, Bob])
    ], should_access=[Alice, Bob]).test()


def test_blog_search_by_tags_transactional_added(admin_session):
    test = admin_session

    blob_name = rand_string(15)
    tag_1 = rand_string(15)
    tag_2 = rand_string(15)
    tags = [{"tag": tag_1}, {"tag": tag_2}]

    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name(), tags=tags)

    blobs_found_by_tag_1 = test.search(f'tag:{tag_1}')
    blobs_found_by_tag_2 = test.search(f'tag:{tag_2}')
    assert len(blobs_found_by_tag_1) > 0
    assert len(blobs_found_by_tag_2) > 0

    first_found_obj = blobs_found_by_tag_1[0]
    second_found_obj = blobs_found_by_tag_2[0]

    blob_search_1 = test.get_blob(first_found_obj["id"])
    blob_search_2 = test.get_blob(second_found_obj["id"])

    assert blob_search_1["id"] == blob["id"]
    assert blob_search_2["id"] == blob["id"]


def test_blob_search_upload_count(admin_session):
    blob_name = rand_string(15)
    blob_content = """
    TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST
    Binary junk: \x00\x01\x02\x03\x04\x05\x07

    HELLO WORLD!
    ========""" + rand_string(10)
    
    tag = rand_string(15)

    # create 2 test users
    test_users = []
    for _ in range(2):
        user_name = random_name()
        user_password = random_name()
        admin_session.register_user(user_name, user_password, ["adding_tags", "reading_blobs", "adding_blobs"])
        test_users.append({'user_name': user_name, 'user_password': user_password})

    users_session = MwdbTest()
    for user in test_users:
        users_session.login_as(user['user_name'], user['user_password'])
        blob = users_session.add_blob(None, blobname=blob_name, blobtype="inject", content=blob_content)
        users_session.add_tag(blob["id"], tag)

    found_configs = admin_session.search(f'tag:{tag} AND blob.upload_count:{len(test_users)}')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND blob.upload_count:[{len(test_users)} TO *]')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND blob.upload_count:[* TO {len(test_users)}]')
    assert len(found_configs) == 1

    found_configs = users_session.search(f'tag:{tag} AND blob.upload_count:{{{len(test_users)} TO *]')
    assert len(found_configs) == 0

    found_configs = users_session.search(f'tag:{tag} AND blob.upload_count:[* TO {len(test_users)}}}')
    assert len(found_configs) == 0
