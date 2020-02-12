import pytest

from .utils import MwdbTest, ShouldRaise, random_name


@pytest.fixture()
def admin():
    admin = MwdbTest()
    admin.login()
    return admin


@pytest.fixture(scope='session')
def attr_user():
    admin = MwdbTest()
    admin.login()
    admin.register_user("attr", "attrattr")
    user = MwdbTest()
    user.login_as("attr", "attrattr")
    return user


def test_metakey_add(admin):
    sample_id = admin.add_sample()["id"]
    attr_name = random_name().lower()
    with ShouldRaise(404):
        admin.add_attribute(sample_id, attr_name, 'random_value')
    admin.add_attribute_definition(attr_name, '')
    admin.add_attribute(sample_id, attr_name, 'random_value')
    attrs = admin.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 1
    assert attrs[0]['key'] == attr_name
    assert attrs[0]['value'] == 'random_value'


def test_metakey_permissions(admin, attr_user):
    sample_id = attr_user.add_sample()["id"]
    attr_name = random_name().lower()
    with ShouldRaise(404):
        attr_user.add_attribute(sample_id, attr_name, 'random_value')
    admin.add_attribute_definition(attr_name, '')
    with ShouldRaise(404):
        attr_user.add_attribute(sample_id, attr_name, 'random_value')
    admin.add_attribute_permission(attr_name, group='attr', can_read=False, can_set=True)
    attr_user.add_attribute(sample_id, attr_name, 'random_value')

    attrs = admin.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 1
    attrs = attr_user.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 0

    admin.add_attribute_permission(attr_name, group='attr', can_read=True, can_set=True)
    attrs = attr_user.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 1

    admin.remove_attribute_permission(attr_name, group='attr')
    attrs = attr_user.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 0


def test_metakey_public_perm(admin, attr_user):
    sample_id = attr_user.add_sample()["id"]
    attr_name = random_name().lower()
    admin.add_attribute_definition(attr_name, '')
    admin.add_attribute_permission(attr_name, group='public', can_read=False, can_set=True)
    admin.add_attribute_permission(attr_name, group='attr', can_read=True, can_set=False)

    attr_user.add_attribute(sample_id, attr_name, 'random_value')

    attrs = admin.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 1
    attrs = attr_user.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 1

    admin.remove_attribute_permission(attr_name, group='attr')

    attr_user.add_attribute(sample_id, attr_name, 'random_value')
    attrs = attr_user.get_attributes(sample_id)['metakeys']
    assert len(attrs) == 0