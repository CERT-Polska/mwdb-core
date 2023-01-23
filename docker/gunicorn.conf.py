import os

wsgi_app = "mwdb.app:app"
bind = "0.0.0.0:8080"
user = "nobody"
reload = bool(int(os.getenv("HOT_RELOAD", "0")))
workers = int(os.getenv("GUNICORN_WORKERS", "4"))
