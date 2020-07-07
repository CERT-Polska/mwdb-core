from tests.backend.relations import *
import logging


def main():
    testCase = RelationTestCase()
    Chris = testCase.new_user("Chris", capabilities=["reading_blobs", "adding_blobs"])
    blob = Chris.session().add_blob(None, blobname="some.blob", blobtype="inject", content="""
        TESTTESTTESTTESTTESTTESTTESTTESTTESTTEST
        Binary junk: \x00\x01\x02\x03\x04\x05\x07

        HELLO WORLD!
        ========""")

    logging.info(f"Blob: {blob}")


if __name__ == '__main__':
    main()