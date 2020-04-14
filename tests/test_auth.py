import pytest

from .utils import MwdbTest, ShouldRaise, admin_login


@pytest.fixture(scope="session", autouse=True)
def typical_user():
    test = MwdbTest()
    test.login()
    test.register_user("typical", "typical8")
    test.create_group("very_typical", capabilities=["adding_tags"])


def test_profile_change_invalidate():
    typical = MwdbTest()
    typical.login_as("typical", "typical8")
    typical.add_sample()

    admin = MwdbTest()
    admin.login()

    # "Typical" shouldn't be able to create api key for admin
    with ShouldRaise(status_code=403):
        typical.api_key_create(admin_login())
    api_key = typical.api_key_create("typical").json()

    typical_via_api = MwdbTest()
    typical_via_api.set_auth_token(api_key["token"])

    # All sessions OK
    typical.recent_samples(1)
    typical_via_api.recent_samples(1)

    admin.request("PUT", "/user/typical", json={
        "disabled": True
    })

    # Password-based session: invalidated, APIKey-based session: forbidden
    with ShouldRaise(status_code=403):
        typical_via_api.recent_samples(1)
    with ShouldRaise(status_code=401):
        typical.recent_samples(1)

    admin.request("PUT", "/user/typical", json={
        "disabled": False
    })

    # Password-based session: need to reauth, APIKey-based session: Ok
    typical_via_api.recent_samples(1)
    with ShouldRaise(status_code=401):
        typical.recent_samples(1)

    typical.login_as("typical", "typical8")
    typical.recent_samples(1)


def test_profile_password_change():
    typical = MwdbTest()
    typical.login_as("typical", "typical8")
    typical.add_sample()

    admin = MwdbTest()
    admin.login()

    set_pass_token = admin.request("GET", "/user/typical/change_password")["token"]

    # Shouldn't be able to use as session token
    typical.set_auth_token(set_pass_token)
    with ShouldRaise(status_code=401):
        typical.recent_samples(1)

    typical.request("POST", "/auth/change_password", json={
        "password": "very_new_password",
        "token": set_pass_token
    })

    typical.login_as("typical", "very_new_password")

    # Valid only once
    with ShouldRaise(status_code=403):
        typical.request("POST", "/auth/change_password", json={
            "password": "typical8",
            "token": set_pass_token
        })

    set_pass_token = admin.request("GET", "/user/typical/change_password")["token"]
    typical.request("POST", "/auth/change_password", json={
        "password": "typical8",
        "token": set_pass_token
    })
    typical.login_as("typical", "typical8")
    typical.recent_samples(1)


def test_api_key_management():
    typical = MwdbTest()

    admin = MwdbTest()
    admin.login()

    admin_key = admin.api_key_create(admin_login()).json()
    typical_key = admin.api_key_create("typical").json()
    typical_key_2 = admin.api_key_create("typical").json()

    typical.set_auth_token(typical_key["token"])
    typical.add_sample()

    with ShouldRaise(status_code=404):
        typical.api_key_delete(admin_key["id"])
    typical.api_key_delete(typical_key["id"])

    with ShouldRaise(status_code=401):
        typical.add_sample()

    typical.set_auth_token(typical_key_2["token"])
    typical.add_sample()

    admin.api_key_delete(admin_key["id"])
    admin.api_key_delete(typical_key_2["id"])

    with ShouldRaise(status_code=401):
        typical.add_sample()
