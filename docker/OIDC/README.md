### Local setup
```
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt

# Disable SSL (only for development)
export AUTHLIB_INSECURE_TRANSPORT=1

export FLASK_APP=website/run.py
flask run


# to exit from venv
deactivate
```


http://127.0.0.1:5000/

## Useful Links

- https://github.com/authlib/example-oidc-server
- https://github.com/ameyrupji/python-flask-oauth2-server
- https://docs.authlib.org/en/latest/specs/rfc6749.html
