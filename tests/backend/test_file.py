import pytest

from .utils import MwdbTest, random_name, rand_string

@pytest.fixture()
def mwdb():
    mwdb = MwdbTest()
    mwdb.login()
    return mwdb

def test_stream(mwdb):
    expected = rand_string(1024 * 256)
    sample = mwdb.add_sample(content=expected)
    
    data = ""
    for c in sample.iterate(1024):
        data += c

    assert data == expected

def test_read(mwdb):
    expected = rand_string(256)
    sample = mwdb.add_sample(content=expected)    
    sample.open()
    a = sample.read(32)
    b = sample.read(32)
    sample.close()
    assert a == expected[0:31]
    assert b == expected[32:63]
