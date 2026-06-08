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

