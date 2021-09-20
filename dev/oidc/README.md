# OpenID Connect feature development environment

Based on `bitnami/keycloak` Docker image.

**The easy way**

1. `docker-compose -f docker-compose-oidc-dev.yml up`

   Keycloak startup may take a bit longer than MWDB, so wait until you see:

   ```
   keycloak_1           | 11:49:23,938 INFO  [org.jboss.as.server] (Controller Boot Thread) WFLYSRV0212: Resuming server
   keycloak_1           | 11:49:23,942 INFO  [org.jboss.as] (Controller Boot Thread) WFLYSRV0025: Keycloak 15.0.2 (WildFly Core 15.0.1.Final) started in 17207ms - Started 736 of 1022 services (689 services are lazy, passive or on-demand)
   keycloak_1           | 11:49:23,944 INFO  [org.jboss.as] (Controller Boot Thread) WFLYSRV0060: Http management interface listening on http://127.0.0.1:9990/management
   keycloak_1           | 11:49:23,944 INFO  [org.jboss.as] (Controller Boot Thread) WFLYSRV0051: Admin console listening on http://127.0.0.1:9990
   ```

2. Go to the http://127.0.0.1:8080. Choose Administration Console. Admin creds are `user` / `bitnami`.

3. If everything works, run `python dev/oidc/init.py` script that will import:
   - `mwdb-oidc-dev` realm
   - `mwdb` Relying Party client
   - `foo` OP user
   - registers `keycloak` provider in MWDB   

   ```
    $ python dev/oidc/init.py 
    [+] Authenticating
    [+] Registering realm
    [+] Registering user 'foo' with password 'foobar'
    'foo' => 02830f1d-1051-40d5-959f-74ab7e6c8e76
    [+] Logging to MWDB as admin
    [+] Registering new OIDC provider
    [+] Done!
   ```

4. Now you should see `mwdb-oidc-dev` realm in Keycloak panel: http://127.0.0.1:8080/auth/admin/master/console/#/realms/mwdb-oidc-dev
5. Go to the MWDB Core and log in as admin: http://127.0.0.1/login
6. http://127.0.0.1/profile/oauth and press Connect with external identity
7. Login using the following credentials: login `foo`, password `foobar`
8. External provider should be successfully added.

**The hard way: How to setup Keycloak realm manually?**

Start Keycloak tournée with logging into Keycloak admin panel

1. Hover `master` and press `Add realm`
2. Provide name for realm (`mwdb-oidc-dev`)
3. Go to Clients and press `Create`
4. Provide Client ID (`mwdb`) with Root URL: `http://127.0.0.1/`
5. Turn off `Direct Access Grants Enabled`.
6. Set `Valid Redirect URIs` to `http://127.0.0.1/oauth/callback`
7. Press `Save`
8. Go to `Users`
9. Fill the form to add new user (`foo`)
10. Go to `Credentials`, provide password and turn `Temporary` off
11. Go back to `Realm Settings` and press `Endpoints / OpenID Endpoint Configuration`

Based on `/.well-known/openid-configuration`, send proper registration request to MWDB Core

```python
response = mwdb_session.post(
    "http://127.0.0.1/api/oauth",
    json={
        "name": "keycloak",
        "client_id": "mwdb",
        "client_secret": "",
        "authorization_endpoint": "http://127.0.0.1:8080/auth/realms/mwdb-oidc-dev/protocol/openid-connect/auth",
        "userinfo_endpoint": "http://keycloak.:8080/auth/realms/mwdb-oidc-dev/protocol/openid-connect/userinfo",
        "token_endpoint": "http://keycloak.:8080/auth/realms/mwdb-oidc-dev/protocol/openid-connect/token",
        "jwks_endpoint": "http://keycloak.:8080/auth/realms/mwdb-oidc-dev/protocol/openid-connect/certs",
    },
)
```
