from website import app

app.config['DEBUG'] = True
app.config['SECRET_KEY'] = '!secret' # TODO: this will have to change

# Flask-SQLAlchemy settings
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'  # File-based SQL database
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# OAuth 2.0
app.config['OAUTH2_REFRESH_TOKEN_GENERATOR'] = True