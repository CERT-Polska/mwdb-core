from io import BytesIO

import pytest
import pyzipper
import requests

from .utils import rand_string, ShouldRaise

@pytest.fixture(scope="session")
def sample_for_download(admin_session):
    # 5 x 128kB + 1
    content = rand_string(size=655361)
    sample = admin_session.add_sample(filename="sample.bin", content=content)
    return sample, content


def test_download_sample(admin_session, sample_for_download):
    sample, expected = sample_for_download

    downloaded = admin_session.download_file(sample['id'])
    assert downloaded.decode() == expected


def test_download_sample_with_token(admin_session, sample_for_download):
    sample, expected = sample_for_download

    token = admin_session.get_download_token(sample['id'])
    r = requests.get(
        admin_session.mwdb_url + f'/file/{sample["id"]}/download',
        params={
            "token": token
        }
    )
    r.raise_for_status()
    downloaded = r.text
    assert downloaded == expected


def test_download_sample_with_incorrect_token(admin_session, sample_for_download):
    sample, expected = sample_for_download

    token = admin_session.get_download_token(sample['id'])
    with ShouldRaise(403):
        r = requests.get(
            admin_session.mwdb_url + f'/file/{sample["id"]}/download',
            params={
                "token": token[:-16]
            }
        )
        r.raise_for_status()


def test_download_zipped_sample(admin_session, sample_for_download):
    sample, expected = sample_for_download
    token = admin_session.get_download_token(sample['id'])
    r = requests.get(
        admin_session.mwdb_url + f'/file/{sample["id"]}/download/zip',
        params={
            "token": token
        }
    )
    r.raise_for_status()
    with pyzipper.AESZipFile(BytesIO(r.content)) as zipped_file:
        zipped_file.setpassword(b"infected")
        assert zipped_file.read("sample.bin") == expected.encode()


def test_download_range_sample(admin_session, sample_for_download):
    sample, expected = sample_for_download
    downloaded = admin_session.download_file(sample['id'], range_header="bytes=0-512")
    assert downloaded.decode() == expected[:513]

    downloaded = admin_session.download_file(sample['id'], range_header="bytes=512-1024")
    assert downloaded.decode() == expected[512:1025]

    downloaded = admin_session.download_file(sample['id'], range_header="bytes=130048-132096")
    assert downloaded.decode() == expected[130048:132097]

    downloaded = admin_session.download_file(sample['id'], range_header="bytes=130048-")
    assert downloaded.decode() == expected[130048:]

    downloaded = admin_session.download_file(sample['id'], range_header="bytes=-512")
    assert downloaded.decode() == expected[-512:]


def test_download_invalid_range(admin_session, sample_for_download):
    sample, expected = sample_for_download
    too_big_size = len(expected) + 1024
    downloaded = admin_session.download_file(sample['id'], range_header=f"bytes=0-{too_big_size}")
    assert downloaded.decode() == expected

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes={too_big_size}-")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes=-100-")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes=100000-100")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes=-{too_big_size}")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes={too_big_size}-{too_big_size}")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"words=0-100")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes=0-100,100-200")