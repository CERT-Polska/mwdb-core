from flask import Flask

# static files are disabled as this is more of an api
app = Flask(__name__, static_folder=None)

from website import models, oauth2, settings, views
