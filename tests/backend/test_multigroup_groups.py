from .relations import *
from .utils import ShouldRaise, admin_login


def test_member_public_groups(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")

    with ShouldRaise(status_code=403):
        admin_session.add_member("public", Alice.identity)

    with ShouldRaise(status_code=403):
        admin_session.remove_member("public", Alice.identity)


def test_existing_member_groups(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Group = testCase.new_group("Group")

    admin_session.add_member(Group.identity, Alice.identity)
    with ShouldRaise(status_code=409):
        admin_session.add_member(Group.identity, Alice.identity)

    admin_session.remove_member(Group.identity, Alice.identity)
    with ShouldRaise(status_code=409):
        admin_session.remove_member(Group.identity, Alice.identity)


def test_member_private_groups(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")

    with ShouldRaise(status_code=409):
        admin_session.create_group(Alice.identity)

    with ShouldRaise(status_code=403):
        admin_session.add_member(Alice.identity, Alice.identity)

    with ShouldRaise(status_code=403):
        admin_session.remove_member(Alice.identity, Alice.identity)


def test_rename_groups(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Workgroup = testCase.new_group("Workgroup")

    with ShouldRaise(status_code=403):
        admin_session.set_group(Alice.identity, new_name="random_name")

    admin_session.set_group(Workgroup.identity, new_name="random_name")
    admin_session.set_group("random_name", new_name=Workgroup.identity)


def test_remove_group_and_user(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Workgroup = testCase.new_group("Workgroup")

    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")

    SampleA(
        [
            SampleB(),
        ],
    ).create()

    SampleA.create(Bob)
    SampleB.create(Alice)

    admin_session.remove_group(Workgroup.identity)

    SampleA(
        [
            SampleB(
                should_access=[Alice, Bob],
            ),
        ],
        should_access=[Bob],
        should_not_access=[Alice],
    ).test()

    with ShouldRaise(status_code=404):
        admin_session.get_group(Workgroup.identity)

    a_shares = admin_session.get_shares(SampleA.dhash)["shares"]
    assert not any([(share["group_name"] == Workgroup.identity) for share in a_shares])

    b_shares = admin_session.get_shares(SampleB.dhash)["shares"]
    assert not any([(share["group_name"] == Workgroup.identity) for share in b_shares])
    assert any(
        [
            (
                share["group_name"] == Alice.identity
                and share["related_user_login"] == Alice.identity
                and share["related_object_dhash"] == SampleB.dhash
            )
            for share in b_shares
        ]
    )

    admin_session.remove_user(Alice.identity)

    with ShouldRaise(status_code=404):
        admin_session.get_group(Alice.identity)

    b_shares = admin_session.get_shares(SampleB.dhash)["shares"]
    assert not any(
        [
            (
                share["group_name"] == Alice.identity
                and share["related_user_login"] == Alice.identity
                and share["related_object_dhash"] == SampleB.dhash
            )
            for share in b_shares
        ]
    )


def test_multigroup_sharing(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe", capabilities=["sharing_objects"])

    File = testCase.new_sample("File")

    Workgroup = testCase.new_group("Workgroup")
    Workgroup.add_member(Alice)

    File.create(Alice)
    File.create(Bob)
    File.create(Joe)

    shares = Alice.session.get_shares(File.dhash)
    assert set(shares["groups"]) == {
        "public",
        "registered",
        Alice.identity,
        Workgroup.identity,
    }
    assert set(gr["group_name"] for gr in shares["shares"]) == {
        Alice.identity,
        Workgroup.identity,
    }

    shares = Bob.session.get_shares(File.dhash)
    assert set(shares["groups"]) == {"public", "registered", Bob.identity}
    assert set(gr["group_name"] for gr in shares["shares"]) == {Bob.identity}

    shares = Joe.session.get_shares(File.dhash)
    groups = {
        "public",
        "registered",
        Alice.identity,
        Bob.identity,
        Joe.identity,
        Workgroup.identity,
    }
    assert set(shares["groups"]).intersection(groups) == groups
    assert set(gr["group_name"] for gr in shares["shares"]).issuperset(
        {Alice.identity, Bob.identity, Joe.identity, Workgroup.identity, admin_login()}
    )
