import json
import pathlib
import requests

print("[+] Authenticating")

response = requests.post(
    "http://127.0.0.1:8080/realms/master/protocol/openid-connect/token",
    data={
        "client_id": "admin-cli",
        "username": "user",
        "password": "bitnami",
        "grant_type": "password",
    },
)
response.raise_for_status()
access_token = response.json()["access_token"]
session = requests.Session()
session.headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
}

print("[+] Registering realm")

realm_path = pathlib.Path(__file__).parent / "realm-export.json"
realm = realm_path.read_bytes()
response = session.post("http://127.0.0.1:8080/admin/realms/", data=realm)
if response.status_code != 409:
    response.raise_for_status()

print("[+] Registering user 'foo' with password 'foobar'")

user = {
    "id": "0eae7690-cedb-4afc-99bd-ed7e2a0267ed",
    "username": "foo",
    "enabled": True,
    "totp": False,
    "emailVerified": False,
    "firstName": "Foo",
    "lastName": "Bar",
    "email": "foo.bar@mwdb.dev",
    "disableableCredentialTypes": [],
    "requiredActions": [],
    "notBefore": 0,
    "access": {
        "manageGroupMembership": True,
        "view": True,
        "mapRoles": True,
        "impersonate": True,
        "manage": True,
    },
    "credentials": [{"type": "password", "temporary": False, "value": "foobar"}],
}
response = session.post(
    "http://127.0.0.1:8080/admin/realms/mwdb-oidc-dev/users", data=json.dumps(user)
)
if response.status_code != 409:
    response.raise_for_status()

response = session.get(
    "http://127.0.0.1:8080/admin/realms/mwdb-oidc-dev/users?username=foo"
)
user_id = response.json()[0]["id"]
print(f"'foo' => {user_id}")

print("[+] Logging to MWDB as admin")

mwdb_session = requests.Session()

mwdb_vars_path = pathlib.Path(__file__).parent.parent.parent / "mwdb-vars.env"
mwdb_vars = {
    key: value
    for key, value in [
        line.split("=", 1) for line in mwdb_vars_path.read_text().splitlines()
    ]
}

response = requests.post(
    "http://127.0.0.1/api/auth/login",
    json={"login": "admin", "password": mwdb_vars["MWDB_ADMIN_PASSWORD"]},
)
response.raise_for_status()
mwdb_token = response.json()["token"]
mwdb_session.headers = {
    "Authorization": f"Bearer {mwdb_token}",
    "Content-Type": "application/json",
}

print("[+] Registering new OIDC provider")

response = mwdb_session.post(
    "http://127.0.0.1/api/oauth",
    json={
        "name": "keycloak",
        "client_id": "mwdb",
        "client_secret": "",
        "authorization_endpoint": "http://127.0.0.1:8080/realms/mwdb-oidc-dev/protocol/openid-connect/auth",
        "userinfo_endpoint": "http://keycloak.:8080/realms/mwdb-oidc-dev/protocol/openid-connect/userinfo",
        "token_endpoint": "http://keycloak.:8080/realms/mwdb-oidc-dev/protocol/openid-connect/token",
        "jwks_endpoint": "http://keycloak.:8080/realms/mwdb-oidc-dev/protocol/openid-connect/certs",
    },
)
response.raise_for_status()
print("[+] Done!")
