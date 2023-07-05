import os

wsgi_app = "mwdb.app:app"
bind = "0.0.0.0:8080"
user = "nobody"
preload_app = bool(int(os.getenv("PRELOAD_APP", "0")))
reload = bool(int(os.getenv("HOT_RELOAD", "0")))
workers = int(os.getenv("GUNICORN_WORKERS", "4"))
