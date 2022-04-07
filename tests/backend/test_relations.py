from .relations import *
from .utils import ShouldRaise, base62uuid


def test_inheritance(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    # Alice->  [A]
    #         /   \
    # Bob ->[B]   [C]
    #       /
    #     [D]

    SampleA([SampleB([SampleD()]), SampleC()]).create()

    SampleA.create(Alice)
    SampleB.create(Bob)

    SampleA(
        [
            SampleB([SampleD(should_access=[Alice, Bob])], should_access=[Alice, Bob]),
            SampleC(should_access=[Alice]),
        ],
        should_access=[Alice],
    ).test()


def test_mixed_types(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    ConfigD = testCase.new_config("ConfigD")
    ConfigE = testCase.new_config("ConfigE")
    SampleF = testCase.new_sample("SampleF")
    SampleG = testCase.new_sample("SampleG")

    SampleA([SampleB(), SampleC([ConfigD(), ConfigE([SampleF(), SampleG()])])]).create()

    SampleA.create(Alice)

    SampleA(
        [
            SampleB(should_access=[Alice]),
            SampleC(
                [
                    ConfigD(should_access=[Alice]),
                    ConfigE(
                        [
                            SampleF(should_access=[Alice]),
                            SampleG(should_access=[Alice]),
                        ],
                        should_access=[Alice],
                    ),
                ],
                should_access=[Alice],
            ),
        ],
        should_access=[Alice],
    ).test()


def test_existing_parent(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["adding_parents"])
    Bob = testCase.new_user("Bob", capabilities=["adding_parents"])

    SampleAA = testCase.new_sample("SampleAA")
    SampleAB = testCase.new_sample("SampleAB")
    SampleAC = testCase.new_sample("SampleAC")
    SampleBA = testCase.new_sample("SampleBA")
    SampleBB = testCase.new_sample("SampleBB")
    SampleBC = testCase.new_sample("SampleBC")

    #          [AA] <- Alice
    #            \
    #            [AB]
    #              \
    #               [AC]
    #                ||   <- added relation
    #               [BA]  <- Bob
    #              /    \
    #            [BB]   [BC]

    SampleAA([SampleAB([SampleAC()])]).create(Alice)

    SampleBA([SampleBB(), SampleBC()]).create(Bob)

    SampleAC.create(Bob)
    SampleBA.create(Bob, SampleAC)

    SampleAA(
        [
            SampleAB(
                [
                    SampleAC(
                        [
                            SampleBA(
                                [
                                    SampleBB(should_access=[Alice, Bob]),
                                    SampleBC(should_access=[Alice, Bob]),
                                ],
                                should_access=[Alice, Bob],
                            )
                        ],
                        should_access=[Alice, Bob],
                    )
                ],
                should_access=[Alice],
            )
        ],
        should_access=[Alice],
    )


def test_cycle_relations(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["adding_parents"])
    Bob = testCase.new_user("Bob", capabilities=["adding_parents"])

    SampleA = testCase.new_sample("SampleA")
    SampleAA = testCase.new_sample("SampleAA")
    SampleAB = testCase.new_sample("SampleAB")
    SampleAAA = testCase.new_sample("SampleAAA")
    SampleABA = testCase.new_sample("SampleABA")

    #                [A]   <--------
    #               /   \           \
    #            [AA]   [AB]         \
    #           /           \        /
    #        [AAA]          [ABA] ---

    SampleA([SampleAA([SampleAAA()]), SampleAB([SampleABA()])]).create(Alice)

    SampleABA.create(Bob)
    SampleA.create(Bob, SampleABA)

    session = MwdbTest()
    session.login()

    SampleA(
        [
            SampleAA(
                [SampleAAA(should_access=[Alice, Bob])], should_access=[Alice, Bob]
            ),
            SampleAB(
                [SampleABA(should_access=[Alice, Bob])], should_access=[Alice, Bob]
            ),
        ],
        should_access=[Alice, Bob],
    ).test()


def test_multiparent_visibility(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["adding_parents"])
    Bob = testCase.new_user("Bob")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleX = testCase.new_sample("SampleX")
    SampleY = testCase.new_sample("SampleY")
    SampleZ = testCase.new_sample("SampleZ")

    #            A L I C E
    #         [A]   [B]   [C] <- Bob
    #           \    |    /
    #            [   X   ]
    #              /   \
    #            [Y]   [Z]

    SampleA([SampleX([SampleY(), SampleZ()])]).create(Alice)

    SampleB.create(Alice)
    SampleC.create(Alice)
    SampleX.create(Alice, SampleB)
    SampleX.create(Alice, SampleC)

    SampleC.create(Bob)

    sample_x = Bob.session.get_sample(SampleX.dhash)
    parents = list(map(lambda d: d["id"], sample_x["parents"]))
    assert parents == [SampleC.dhash]

    sample_x = Alice.session.get_sample(SampleX.dhash)
    parents = list(map(lambda d: d["id"], sample_x["parents"]))
    assert sorted(parents) == sorted([SampleA.dhash, SampleB.dhash, SampleC.dhash])

    subtree = SampleX(
        [SampleY(should_access=[Alice, Bob]), SampleZ(should_access=[Alice, Bob])],
        should_access=[Alice, Bob],
    )

    SampleA([subtree], should_access=[Alice]).test()

    SampleB([subtree], should_access=[Alice]).test()

    SampleC([subtree], should_access=[Alice, Bob]).test()


def test_recent_samples(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    # Alice->  [A]
    #         /   \
    # Bob ->[B]   [C]
    #       /
    #     [D]

    SampleA([SampleB([SampleD()]), SampleC()]).create()

    SampleA.create(Alice)
    SampleB.create(Bob)

    def recent_filter(l):
        return sorted(
            list(
                filter(
                    lambda d: d
                    in [SampleA.dhash, SampleB.dhash, SampleC.dhash, SampleD.dhash],
                    l,
                )
            )
        )

    alice_recent = recent_filter(
        map(lambda d: d["id"], Alice.session.recent_samples(1)["files"])
    )
    bob_recent = recent_filter(
        map(lambda d: d["id"], Bob.session.recent_samples(1)["files"])
    )

    assert alice_recent == sorted(
        [SampleA.dhash, SampleB.dhash, SampleC.dhash, SampleD.dhash]
    )
    assert bob_recent == sorted([SampleB.dhash, SampleD.dhash])


def test_xref_adding(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["adding_parents"])
    Bob = testCase.new_user("Bob", capabilities=["adding_parents"])

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")

    # Alice->  [A]
    #         /   \
    # Bob ->[B]   [C]
    #       /
    #     [D]
    SampleA.create(Alice)
    SampleB.create(Alice)
    SampleB.create(Bob)
    SampleC.create(Alice)
    SampleD.create(Bob)

    SampleA(
        [
            SampleB([SampleD(should_access=[Bob])], should_access=[Alice, Bob]),
            SampleC(should_access=[Alice]),
        ],
        should_access=[Alice],
    ).test()

    Bob.session.add_xref(SampleB.dhash, SampleD.dhash)

    SampleA(
        [
            SampleB([SampleD(should_access=[Alice, Bob])], should_access=[Alice, Bob]),
            SampleC(should_access=[Alice]),
        ],
        should_access=[Alice],
    ).test()


def test_uploader_share(admin_session):
    """
    We check if uploader share is added directly instead of
    being inherited from the parent
    """
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["adding_parents"])
    Bob = testCase.new_user("Bob", capabilities=["adding_parents"])

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleA.create(Alice)
    SampleB.create(Alice, parent=SampleA)

    a_shares = Alice.session.get_shares(SampleA.dhash)["shares"]
    b_shares = Alice.session.get_shares(SampleB.dhash)["shares"]

    # Look for uploader entry in SampleA shares
    assert any(
        [
            (
                share["group_name"] == Alice.identity
                and share["related_user_login"] == Alice.identity
                and share["related_object_dhash"] == SampleA.dhash
                and share["reason_type"] == "added"
            )
            for share in a_shares
        ]
    )
    # Look for uploader entry in SampleB shares
    assert any(
        [
            (
                share["group_name"] == Alice.identity
                and share["related_user_login"] == Alice.identity
                and share["related_object_dhash"] == SampleB.dhash
                and share["reason_type"] == "added"
            )
            for share in b_shares
        ]
    )


def test_removing_relations(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice", capabilities=["removing_parents"])
    Bob = testCase.new_user("Bob")

    SampleA = testCase.new_sample("SampleA")
    SampleB = testCase.new_sample("SampleB")
    SampleC = testCase.new_sample("SampleC")
    SampleD = testCase.new_sample("SampleD")
    SampleE = testCase.new_sample("SampleE")
    SampleF = testCase.new_sample("SampleF")
    SampleG = testCase.new_sample("SampleG")

    #
    # Alice & Bob -> [A]     [G] <- Alice
    #               /   \   /
    #               \    [B]   [F] <- Alice & Bob
    #                \     \   /
    #                 \     [C]
    #                  \   /   \
    #                   [D]     [E]

    SampleA(
        [
            SampleB(
                [
                    SampleC([SampleD(), SampleE()]),
                ]
            ),
            SampleD(),
        ]
    ).create()

    SampleG(
        [
            SampleB(
                [
                    SampleC([SampleD(), SampleE()]),
                ]
            ),
        ]
    ).create()

    SampleF(
        [
            SampleC([SampleD(), SampleE()]),
        ]
    ).create()

    SampleA.create(Alice)

    SampleA(
        [
            SampleB(
                [
                    SampleC(
                        [
                            SampleD(should_access=[Alice]),
                            SampleE(should_access=[Alice]),
                        ],
                        should_access=[Alice],
                    ),
                ],
                should_access=[Alice],
            ),
            SampleD(should_access=[Alice]),
        ],
        should_access=[Alice],
    ).test()

    # Check access for SampleD after removing C -> D relation
    Alice.session.remove_parent(SampleC.dhash, SampleD.dhash)
    d_shares = Alice.session.get_shares(SampleD.dhash)["shares"]
    assert any(
        [
            (
                share["group_name"] == Alice.identity
                and share["related_user_login"] == Alice.identity
                and share["related_object_dhash"] == SampleA.dhash
                and share["reason_type"] == "added"
            )
            for share in d_shares
        ]
    )

    SampleA.create(Bob)
    SampleF.create(Bob)
    SampleF.create(Alice)
    SampleG.create(Alice)

    # Check access for every children after removing A -> B relation
    Alice.session.remove_parent(SampleA.dhash, SampleB.dhash)
    SampleG(
        [
            SampleB(
                [
                    SampleC(
                        [
                            SampleD(should_access=[Alice, Bob]),
                            SampleE(should_access=[Alice, Bob]),
                        ],
                        should_access=[Alice, Bob],
                    ),
                ],
                should_access=[Alice],
                should_not_access=[Bob],
            ),
        ],
        should_access=[Alice],
    ).test()

    # Check access for every children after removing F -> C relation
    Alice.session.remove_parent(SampleF.dhash, SampleC.dhash)
    SampleC(
        [
            SampleD(should_access=[Alice, Bob]),
            SampleE(should_access=[Alice], should_not_access=[Bob]),
        ],
        should_access=[Alice],
        should_not_access=[Bob],
    ).test()


def test_remove_cycle_relation(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")

    SampleA = testCase.new_sample("SampleA")

    SampleA.create(Alice)

    SampleA.create(parent=SampleA)

    a_shares = Alice.session.get_shares(SampleA.dhash)["shares"]

    Alice.session.remove_parent(SampleA.dhash, SampleA)

    a_shares_remove = Alice.session.get_shares(SampleA.dhash)["shares"]

    assert a_shares == a_shares_remove
