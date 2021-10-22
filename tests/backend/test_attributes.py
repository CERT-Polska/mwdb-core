from .utils import ShouldRaise, random_name


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
