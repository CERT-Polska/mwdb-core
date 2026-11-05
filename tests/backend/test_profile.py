"""
Regression tests for user profile visibility (GET /profile/<login>).

In 2.20.0 ``UserProfileResource`` checked the target user's group membership
against ``Group.name != "public"`` instead of ``Group.workspace``. Because
every user is a member of non-workspace groups like ``public`` and
``registered``, any authenticated user could list profile details
(login, e-mail, registration and last-login time) of every other user.
"""

from .relations import RelationTestCase
from .utils import ShouldRaise


def test_profile_visible_only_within_common_workspace(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")
    Joe = testCase.new_user("Joe")

    # Alice and Bob share a workspace.
    # Joe, like every user, shares only the non-workspace
    # 'public' and 'registered' groups with Alice and Bob.
    Workgroup = testCase.new_group("Workgroup")
    Workgroup.add_member(Alice)
    Workgroup.add_member(Bob)

    # Same workspace: profiles are visible both ways
    profile = Alice.session.request("GET", "/profile/" + Bob.identity)
    assert profile["login"] == Bob.identity
    profile = Bob.session.request("GET", "/profile/" + Alice.identity)
    assert profile["login"] == Alice.identity

    # Only non-workspace groups in common: 404 both ways
    with ShouldRaise(status_code=404):
        Alice.session.request("GET", "/profile/" + Joe.identity)

    with ShouldRaise(status_code=404):
        Joe.session.request("GET", "/profile/" + Alice.identity)


def test_profile_not_visible_via_non_workspace_group(admin_session):
    testCase = RelationTestCase(admin_session)

    Alice = testCase.new_user("Alice")
    Bob = testCase.new_user("Bob")

    # The check must use the workspace flag itself, not a hardcoded
    # set of group names: a shared non-workspace group (e.g. one
    # synced from OIDC) must not reveal members to each other
    SyncGroup = testCase.new_group("SyncGroup")
    admin_session.request(
        "PUT", "/group/" + SyncGroup.identity, json={"workspace": False}
    )
    admin_session.add_member(SyncGroup.identity, Alice.identity)
    admin_session.add_member(SyncGroup.identity, Bob.identity)

    with ShouldRaise(status_code=404):
        Alice.session.request("GET", "/profile/" + Bob.identity)

    with ShouldRaise(status_code=404):
        Bob.session.request("GET", "/profile/" + Alice.identity)


def test_profile_own_profile_visible(admin_session):
    testCase = RelationTestCase(admin_session)

    # A user's private group is a workspace, so own profile lookup
    # must keep working even though the user belongs to no other
    # workspace
    Alice = testCase.new_user("Alice")

    profile = Alice.session.request("GET", "/profile/" + Alice.identity)
    assert profile["login"] == Alice.identity
