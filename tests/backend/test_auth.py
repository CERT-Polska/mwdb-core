import os
import jwt
from .utils import MwdbTest, ShouldRaise, admin_login


def test_profile_change_invalidate(typical_session, admin_session):
    typical_login = typical_session.userinfo["login"]
    typical_session.add_sample()

    # "Typical" shouldn't be able to create api key for admin
    with ShouldRaise(status_code=403):
        typical_session.api_key_create(admin_login(), "test key")
    api_key = typical_session.api_key_create(typical_login, "test key").json()

    typical_via_api = MwdbTest()
    typical_via_api.set_auth_token(api_key["token"])

    # All sessions OK
    typical_session.recent_samples(1)
    typical_via_api.recent_samples(1)

    admin_session.request("PUT", "/user/" + typical_login, json={
        "disabled": True
    })

    # Password-based session: invalidated, APIKey-based session: forbidden
    with ShouldRaise(status_code=403):
        typical_via_api.recent_samples(1)
    with ShouldRaise(status_code=401):
        typical_session.recent_samples(1)

    admin_session.request("PUT", "/user/" + typical_login, json={
        "disabled": False
    })

    # Password-based session: need to reauth, APIKey-based session: Ok
    typical_via_api.recent_samples(1)
    with ShouldRaise(status_code=401):
        typical_session.recent_samples(1)

    typical_session.login_as(typical_login, typical_login)
    typical_session.recent_samples(1)


def test_profile_password_change(typical_session, admin_session):
    typical_login = typical_session.userinfo["login"]
    typical_session.add_sample()

    set_pass_token = admin_session.request("GET", f"/user/{typical_login}/change_password")["token"]

    # Shouldn't be able to use as session token
    typical_session.set_auth_token(set_pass_token)
    with ShouldRaise(status_code=401):
        typical_session.recent_samples(1)

    typical_session.request("POST", "/auth/change_password", json={
        "password": "very_new_password",
        "token": set_pass_token
    })

    typical_session.login_as(typical_login, "very_new_password")

    # Valid only once
    with ShouldRaise(status_code=403):
        typical_session.request("POST", "/auth/change_password", json={
            "password": typical_login,
            "token": set_pass_token
        })

    set_pass_token = admin_session.request("GET", f"/user/{typical_login}/change_password")["token"]
    typical_session.request("POST", "/auth/change_password", json={
        "password": typical_login,
        "token": set_pass_token
    })
    typical_session.login_as(typical_login, typical_login)
    typical_session.recent_samples(1)


def test_api_key_management(typical_session, admin_session):
    typical = typical_session.clone_session()
    typical_login = typical_session.userinfo["login"]
    admin_key = admin_session.api_key_create(admin_login(), "admin key").json()
    typical_key = admin_session.api_key_create(typical_login, "typical key 1").json()
    typical_key_2 = admin_session.api_key_create(typical_login, "typical key 2").json()

    # It should be possible to create API key without sending any payload
    # Should fall back to empty name
    res = admin_session.session.post(admin_session.mwdb_url + f"/user/{typical_login}/api_key")
    res.raise_for_status()
    assert res.json()["name"] == ""

    typical.set_auth_token(typical_key["token"])
    typical.add_sample()

    with ShouldRaise(status_code=404):
        typical.api_key_delete(admin_key["id"])
    typical.api_key_delete(typical_key["id"])

    with ShouldRaise(status_code=401):
        typical.add_sample()

    typical.set_auth_token(typical_key_2["token"])
    typical.add_sample()

    admin_session.api_key_delete(admin_key["id"])
    admin_session.api_key_delete(typical_key_2["id"])

    with ShouldRaise(status_code=401):
        typical.add_sample()


def test_jwt_api_keys(admin_session):
    secret_key = "e2e-testing-key"
    api_key_id = admin_session.api_key_create("admin", "testing-key").json()["id"]

    pre2_0_payload = {"login": "admin", "version_uid": None}
    pre2_7_payload = {"login": "admin", "api_key_id": api_key_id}

    pre2_0_token = jwt.encode(pre2_0_payload, secret_key, algorithm="HS512")
    pre2_7_token = jwt.encode(pre2_7_payload, secret_key, algorithm="HS512")

    session = MwdbTest()
    response = session.request("get", "/server")
    assert not response["is_authenticated"]

    session.set_auth_token(pre2_0_token)
    response = session.request("get", "/server")
    assert response["is_authenticated"]

    session.set_auth_token(pre2_7_token)
    response = session.request("get", "/server")
    assert response["is_authenticated"]


def test_jwt_legacy_api_keys():
    pass
