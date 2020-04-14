from .relations import *
from .utils import *


def test_manage_users():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["manage_users"])

    def request(*args, **kwargs):
        with ShouldRaise(status_code=403):
            Alice.session().request(*args, **kwargs)
        Bob.session().request(*args, **kwargs)

    user_login = random_name()
    user_email = random_name() + "@" + random_name() + ".com"
    group_name = random_name()

    request("GET", "/user")
    request("GET", "/user/"+admin_login())
    request("POST", "/user/{}".format(user_login), json={"email": user_email, "group_name": admin_login()})
    request("PUT", "/user/{}".format(user_login), json={"email": user_email, "group_name": admin_login()})

    request("GET", "/user/{}/change_password".format(admin_login()))

    request("GET", "/group")
    request("GET", "/group/{}".format(admin_login()))
    request("POST", "/group/{}".format(group_name), json={"capabilities": []})
    request("PUT", "/group/{}".format(group_name), json={"capabilities": []})


def test_share_queried_objects():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["share_queried_objects"])

    Sample = testCase.new_sample("Sample")

    with ShouldRaise(status_code=404):
        Alice.session().get_sample(Sample.dhash)

    Bob.session().get_sample(Sample.dhash)

    Sample.should_not_access(Alice)
    Sample.should_access(Bob)


def test_access_all_objects():
    testCase = RelationTestCase()

    testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["access_all_objects"])

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")

    SampleA([
        SampleB(should_access=[Bob]),
        SampleC(should_access=[Bob])
    ], should_access=[Bob]).test()


def test_sharing_objects():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["sharing_objects"])

    Sample = testCase.new_sample("Sample")
    Sample.create(Bob)

    Bob.session().request("GET", "/object/{}/share".format(Sample.dhash))

    Sample.should_not_access(Alice)

    Bob.session().request("PUT", "/object/{}/share".format(Sample.dhash), json={"group": Alice.identity})

    Sample.should_access(Alice)


def test_adding_tags():
    session = MwdbTest()
    session.login()
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["adding_tags"])

    Sample = testCase.new_sample("Sample")
    Sample.create(Alice)
    Sample.create(Bob)

    with ShouldRaise(status_code=403):
        Alice.session().add_tag(Sample.dhash, "tag123")

    assert {"tag": "tag123"} not in session.get_tags(Sample.dhash)

    Bob.session().add_tag(Sample.dhash, "tag123")

    assert {"tag": "tag123"} in session.get_tags(Sample.dhash)


def test_removing_tags():
    session = MwdbTest()
    session.login()
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["removing_tags"])

    Sample = testCase.new_sample("Sample")
    Sample.create(Alice)
    Sample.create(Bob)

    session.add_tag(Sample.dhash, "tag123")

    with ShouldRaise(status_code=403):
        Alice.session().delete_tag(Sample.dhash, "tag123")

    assert {"tag": "tag123"} in session.get_tags(Sample.dhash)

    Bob.session().delete_tag(Sample.dhash, "tag123")

    assert {"tag": "tag123"} not in session.get_tags(Sample.dhash)


def test_adding_comments():
    session = MwdbTest()
    session.login()
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["adding_comments"])

    Sample = testCase.new_sample("Sample")
    Sample.create(Alice)
    Sample.create(Bob)

    with ShouldRaise(status_code=403):
        Alice.session().add_comment(Sample.dhash, "comment123")

    assert not list(filter(lambda c: c["comment"] == "comment123", session.get_comments(Sample.dhash)))

    Bob.session().add_comment(Sample.dhash, "comment123")

    assert list(filter(lambda c: c["comment"] == "comment123", session.get_comments(Sample.dhash)))


def test_removing_comments():
    session = MwdbTest()
    session.login()
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["removing_comments"])

    Sample = testCase.new_sample("Sample")
    Sample.create(Alice)
    Sample.create(Bob)

    comment_id = session.add_comment(Sample.dhash, "comment123")["id"]

    with ShouldRaise(status_code=403):
        Alice.session().delete_comment(Sample.dhash, comment_id)

    assert list(filter(lambda c: c["comment"] == "comment123", session.get_comments(Sample.dhash)))

    Bob.session().delete_comment(Sample.dhash, comment_id)

    assert not list(filter(lambda c: c["comment"] == "comment123", session.get_comments(Sample.dhash)))


def test_adding_parents():
    session = MwdbTest()
    session.login()
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob", capabilities=["adding_parents"])

    SampleA = testCase.new_sample("Sample")
    SampleB = testCase.new_sample("Sample")
    SampleA.create(Alice)
    SampleA.create(Bob)

    with ShouldRaise(status_code=403):
        SampleB.create(Alice, SampleA)

    assert session.get_sample(SampleB.dhash)["parents"] == []

    SampleB.create(Bob, SampleA)

    assert session.get_sample(SampleB.dhash)["parents"] != []
