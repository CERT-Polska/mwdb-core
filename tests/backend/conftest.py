import pytest

from .utils import MwdbTest, random_name


@pytest.fixture(scope="session", autouse=True)
def check_operational(request):
    test = MwdbTest()
    test.check_operational()


@pytest.fixture(scope="session")
def admin_session():
    admin = MwdbTest()
    admin.login()
    return admin


@pytest.fixture(scope="session")
def attr_session(admin_session):
    username = random_name()
    admin_session.register_user(username, username)
    user = MwdbTest()
    user.login_as(username, username)
    return user


@pytest.fixture(scope="session")
def typical_session(admin_session):
    username = random_name()
    admin_session.register_user(username, username)
    admin_session.create_group(username + "-group", capabilities=["adding_tags"])
    typical = MwdbTest()
    typical.login_as(username, username)
    return typical
