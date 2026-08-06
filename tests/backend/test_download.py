from io import BytesIO

import pytest
import pyzipper
import requests

from .utils import MwdbTest, ShouldRaise, rand_string, random_name


@pytest.fixture(scope="session")
def sample_for_download(admin_session):
    # 5 x 128kB + 1
    content = rand_string(size=655361)
    sample = admin_session.add_sample(filename="sample.bin", content=content)
    return sample, content


@pytest.fixture
def download_sessions(admin_session, sample_for_download):
    sample, _ = sample_for_download
    public_capabilities = admin_session.get_group("public")["capabilities"]
    admin_session.set_group(
        "public",
        capabilities=[
            capability
            for capability in public_capabilities
            if capability
            not in {"downloading_files", "downloading_zipped_files"}
        ],
    )
    sessions = {}
    try:
        for name, capabilities in {
            "none": [],
            "raw": ["downloading_files"],
            "zip": ["downloading_zipped_files"],
        }.items():
            username = random_name()
            admin_session.register_user(username, username, capabilities=capabilities)
            admin_session.share_with(sample["id"], username)
            session = MwdbTest()
            session.login_as(username, username)
            sessions[name] = session
        yield sessions
    finally:
        admin_session.set_group("public", capabilities=public_capabilities)


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
    token = admin_session.get_download_token(sample['id'], zipped=True)
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


def test_download_capabilities_enabled_for_public(admin_session):
    capabilities = admin_session.get_group("public")["capabilities"]
    assert "downloading_files" in capabilities
    assert "downloading_zipped_files" in capabilities


def test_download_capabilities(sample_for_download, download_sessions):
    sample, expected = sample_for_download

    with ShouldRaise(403):
        download_sessions["none"].get_download_token(sample["id"])
    with ShouldRaise(403):
        download_sessions["none"].get_download_token(sample["id"], zipped=True)

    assert download_sessions["raw"].download_file(sample["id"]) == expected.encode()
    with ShouldRaise(403):
        download_sessions["raw"].get_download_token(sample["id"], zipped=True)

    with ShouldRaise(403):
        download_sessions["zip"].download_file(sample["id"])
    zip_token = download_sessions["zip"].get_download_token(
        sample["id"], zipped=True
    )
    response = requests.get(
        download_sessions["zip"].mwdb_url + f'/file/{sample["id"]}/download/zip',
        params={"token": zip_token},
    )
    response.raise_for_status()
    with pyzipper.AESZipFile(BytesIO(response.content)) as zipped_file:
        zipped_file.setpassword(b"infected")
        assert zipped_file.read("sample.bin") == expected.encode()


def test_download_tokens_are_format_specific(admin_session, sample_for_download):
    sample, _ = sample_for_download
    raw_token = admin_session.get_download_token(sample["id"])
    zip_token = admin_session.get_download_token(sample["id"], zipped=True)

    with ShouldRaise(403):
        response = requests.get(
            admin_session.mwdb_url + f'/file/{sample["id"]}/download/zip',
            params={"token": raw_token},
        )
        response.raise_for_status()

    with ShouldRaise(403):
        response = requests.get(
            admin_session.mwdb_url + f'/file/{sample["id"]}/download',
            params={"token": zip_token},
        )
        response.raise_for_status()


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
        admin_session.download_file(sample['id'], range_header=f"bytes={too_big_size}-{too_big_size}")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"words=0-100")

    with ShouldRaise(416):
        admin_session.download_file(sample['id'], range_header=f"bytes=0-100,100-200")
