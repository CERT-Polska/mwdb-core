from .relations import *
from .utils import random_name


def test_adding_blobs():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice", capabilities=["reading_blobs", "adding_blobs"])
    blob = Alice.session().add_blob(None, blobname="malwarex.blob", blobtype="inject", content="""
    TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST
    Binary junk: \x00\x01\x02\x03\x04\x05\x07

    HELLO WORLD!
    ========""" + random_name() + "XPADDINGX" * 60)

    assert "\x00\x01" in Alice.session().get_blob(blob["id"])["content"]


def test_blob_permissions():
    testCase = RelationTestCase()

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
