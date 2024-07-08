from pytest import fixture
from .utils import ShouldRaise, random_name, rand_string


def test_attribute_add(admin_session):
    sample_id = admin_session.add_sample()["id"]
    attr_name = random_name().lower()
    with ShouldRaise(404):
        admin_session.add_attribute(sample_id, attr_name, "random_value")
    admin_session.add_attribute_definition(attr_name, "")
    admin_session.add_attribute(sample_id, attr_name, "random_value")
    attrs = admin_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 1
    assert attrs[0]["key"] == attr_name
    assert attrs[0]["value"] == "random_value"


def test_attribute_permissions(admin_session, attr_session):
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    with ShouldRaise(404):
        attr_session.add_attribute(sample_id, attr_name, "random_value")
    admin_session.add_attribute_definition(attr_name, "")
    with ShouldRaise(404):
        attr_session.add_attribute(sample_id, attr_name, "random_value")
    admin_session.add_attribute_permission(
        attr_name, group=attr_session.userinfo["login"], can_read=False, can_set=True
    )
    attr_session.add_attribute(sample_id, attr_name, "random_value")

    attrs = admin_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 1
    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0

    admin_session.add_attribute_permission(attr_name, group=attr_session.userinfo["login"], can_read=True, can_set=True)
    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 1

    admin_session.remove_attribute_permission(attr_name, group=attr_session.userinfo["login"])
    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0


def test_attribute_public_perm(admin_session, attr_session):
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    admin_session.add_attribute_definition(attr_name, "")
    admin_session.add_attribute_permission(
        attr_name, group="public", can_read=False, can_set=True
    )
    admin_session.add_attribute_permission(
        attr_name, group=attr_session.userinfo["login"], can_read=True, can_set=False
    )

    attr_session.add_attribute(sample_id, attr_name, "random_value")

    attrs = admin_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 1
    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 1

    admin_session.remove_attribute_permission(attr_name, group=attr_session.userinfo["login"])

    attr_session.add_attribute(sample_id, attr_name, "random_value")
    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0


def test_attribute_hidden(admin_session, attr_session):
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    admin_session.add_attribute_definition(attr_name, "", hidden=True)
    admin_session.add_attribute_permission(
        attr_name, group="public", can_read=True, can_set=False
    )

    admin_session.add_attribute(sample_id, attr_name, "random_value")
    # Admin should not see any attributes because all are hidden
    attrs = admin_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0
    # ... unless request to see them
    attrs = admin_session.get_attributes(sample_id, show_hidden=True)["attributes"]
    assert len(attrs) == 1

    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0
    with ShouldRaise(403):
        attr_session.get_attributes(sample_id, show_hidden=True)


def test_attribute_hidden_search(admin_session, attr_session):
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    admin_session.add_attribute_definition(attr_name, "", hidden=True)
    admin_session.add_attribute_permission(
        attr_name, group="public", can_read=True, can_set=False
    )

    admin_session.add_attribute(sample_id, attr_name, "random_value")
    # User can search hidden attribute values
    results = attr_session.search(f"file.meta.{attr_name}:random_value")
    assert len(results) == 1
    # but is not allowed to use wildcards
    with ShouldRaise(400):
        attr_session.search(f"file.meta.{attr_name}:random*")

    # Administrators (reading_all_attributes enabled) can do anything
    results = admin_session.search(f"file.meta.{attr_name}:random_value")
    assert len(results) == 1
    results = admin_session.search(f"file.meta.{attr_name}:random*")
    assert len(results) == 1


def test_attribute_definition_remove(admin_session, attr_session):
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    admin_session.add_attribute_definition(attr_name, "", hidden=False)
    admin_session.add_attribute_permission(attr_name, group=attr_session.userinfo["login"], can_read=True, can_set=True)
    attr_session.add_attribute(sample_id, attr_name, "random_value")

    admin_session.remove_attribute_definition(attr_name)

    attrs = attr_session.get_attributes(sample_id)["attributes"]
    assert len(attrs) == 0
    with ShouldRaise(404):
        admin_session.get_attribute(attr_name)


@fixture(scope="module")
def random_attribute(admin_session, attr_session):
    """
    Fixture with pre-created attribute key for value testing
    """
    sample_id = attr_session.add_sample()["id"]
    attr_name = random_name().lower()
    admin_session.add_attribute_definition(attr_name, "", hidden=False)
    admin_session.add_attribute_permission(attr_name, group=attr_session.userinfo["login"], can_read=True, can_set=True)
    return sample_id, attr_name


def test_huge_json_attributes(admin_session, attr_session, random_attribute):
    sample_id, attr_name = random_attribute
    attr_value = {
        "value": rand_string(128 * 1024),
        "nested": {
            "value": rand_string(128 * 1024)
        }
    }
    attr_session.add_attribute(sample_id, attr_name, attr_value)
    stored_attributes = [
        attr["value"]
        for attr in attr_session.get_attributes(sample_id)["attributes"]
        if attr["key"] == attr_name
        and isinstance(attr["value"], dict)
        and sorted(attr["value"].keys()) == sorted(["nested", "value"])
    ]
    assert any(stored_attr == attr_value for stored_attr in stored_attributes)


def test_basic_attribute_uniqueness(admin_session, attr_session, random_attribute):
    sample_id, attr_name = random_attribute
    attr_value = random_name()
    attr_session.add_attribute(sample_id, attr_name, attr_value)
    attr_session.add_attribute(sample_id, attr_name, attr_value)
    stored_attributes = [
        attr["value"]
        for attr in attr_session.get_attributes(sample_id)["attributes"]
        if attr["key"] == attr_name
        and attr["value"] == attr_value
    ]
    assert len(stored_attributes) == 1


def test_json_attribute_uniqueness(admin_session, attr_session, random_attribute):
    sample_id, attr_name = random_attribute
    unique_value = random_name()
    first_value = {
        "c": [3, 2, 1],
        "a": [1, 2, 3],
        "nested": {
            "nested_abc": unique_value,
            "abc_nested": unique_value
        }
    }
    second_value = {
        "nested": {
            "abc_nested": unique_value,
            "nested_abc": unique_value
        },
        "a": [1, 2, 3],
        "c": [3, 2, 1],
    }
    assert first_value == second_value
    attr_session.add_attribute(sample_id, attr_name, first_value)
    attr_session.add_attribute(sample_id, attr_name, second_value)
    stored_attributes = [
        attr["value"]
        for attr in attr_session.get_attributes(sample_id)["attributes"]
        if attr["key"] == attr_name
        and attr["value"] == first_value == second_value
    ]
    assert len(stored_attributes) == 1


def test_attribute_falsy_values(admin_session, random_attribute):
    sample_id, attr_name = random_attribute
    admin_session.add_attribute(sample_id, attr_name, 0)
    admin_session.add_attribute(sample_id, attr_name, False)
    with ShouldRaise(400):
        admin_session.add_attribute(sample_id, attr_name, [])
    with ShouldRaise(400):
        admin_session.add_attribute(sample_id, attr_name, {})
    with ShouldRaise(400):
        admin_session.add_attribute(sample_id, attr_name, None)
    with ShouldRaise(400):
        admin_session.add_attribute(sample_id, attr_name, "")
    admin_session.add_attribute(sample_id, attr_name, ["nonempty"])
    admin_session.add_attribute(sample_id, attr_name, {"nonempty": None})


def test_attribute_json_string_range(admin_session, random_attribute):
    sample_id, attr_name = random_attribute
    admin_session.add_attribute(sample_id, attr_name, {"creation-time": "2024-06-01 12:00:00"})
    assert len(admin_session.search(f'attribute.{attr_name}.creation-time:>="2024-05"')) == 1
    assert len(admin_session.search(f'attribute.{attr_name}.creation-time:>="2024-07"')) == 0
    assert len(admin_session.search(f'attribute.{attr_name}.creation-time:["2024-07" TO "2024-08"]')) == 0
    assert len(admin_session.search(f'attribute.{attr_name}.creation-time:["2024-06" TO "2024-07"]')) == 1
