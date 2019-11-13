from .relations import *
from .utils import ShouldRaise


def test_submit_public():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe")

    all_users = [Alice, Bob, Joe]

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")

    SampleA([
        SampleB(),
        SampleC()
    ]).create()

    SampleA.create(Alice, upload_as='public')

    SampleA([
        SampleB(should_access=all_users),
        SampleC(should_access=all_users)
    ], should_access=all_users).test()


def test_submit_default_workgroups():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe")

    Workgroup = testCase.new_group("Workgroup")
    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    Homegroup = testCase.new_group("Homegroup")
    Homegroup.add_member(Bob)
    Homegroup.add_member(Joe)

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    SampleA([
        SampleB([
            SampleC()
        ])
    ]).create()

    SampleA.create(Alice)
    SampleD.create(Joe)

    SampleA([
        SampleB([
            SampleC(should_access=[Alice, Bob])
        ], should_access=[Alice, Bob])
    ], should_access=[Alice, Bob]).test()

    SampleD(should_access=[Bob, Joe]).test()


def test_submit_private():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe")

    Workgroup = testCase.new_group("Workgroup")
    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    Homegroup = testCase.new_group("Homegroup")
    Homegroup.add_member(Bob)
    Homegroup.add_member(Joe)

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    SampleA([
        SampleB([
            SampleC()
        ])
    ]).create()

    SampleA.create(Alice, upload_as=Alice.identity)
    SampleD.create(Joe, upload_as=Joe.identity)

    SampleA([
        SampleB([
            SampleC(should_access=[Alice])
        ], should_access=[Alice])
    ], should_access=[Alice]).test()

    SampleD(should_access=[Joe]).test()


def test_submit_foreign_workgroup():
    testCase = RelationTestCase()

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe")

    Workgroup = testCase.new_group("Workgroup")
    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    Homegroup = testCase.new_group("Homegroup")
    Homegroup.add_member(Bob)
    Homegroup.add_member(Joe)

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    SampleA([
        SampleB([
            SampleC()
        ])
    ]).create()

    SampleD.create()

    SampleA.create(Alice, upload_as=Workgroup.identity)

    with ShouldRaise(status_code=404):
        SampleD.create(Joe, upload_as=Workgroup.identity)

    SampleD(should_access=[]).test()

    SampleD.create(Bob, upload_as=Homegroup.identity)

    SampleA([
        SampleB([
            SampleC(should_access=[Alice, Bob])
        ], should_access=[Alice, Bob])
    ], should_access=[Alice, Bob]).test()

    SampleD(should_access=[Bob, Joe]).test()
