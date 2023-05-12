import requests

from .utils import MwdbTest, random_name


class RelationTestEntity(object):
    def __init__(self, context, name):
        self.context = context
        self.dhash = ""
        self.identity = random_name()
        self.name = name

    def __eq__(self, other):
        return self.identity == other.identity

    def __hash__(self):
        return hash(self.identity)

    def __str__(self):
        return self.name


class RelationTestUser(RelationTestEntity):
    def __init__(self, context, name, capabilities):
        super().__init__(context, name)
        session = context.session
        session.register_user(self.identity, self.identity, capabilities)
        self.session = MwdbTest()
        self.session.login_as(self.identity, self.identity)


class RelationTestGroup(RelationTestEntity):
    def __init__(self, context, name, capabilities):
        super().__init__(context, name)
        session = context.session
        session.create_group(self.identity, capabilities)

    def add_member(self, user):
        session = self.context.session
        session.add_member(self.identity, user.identity)

    def remove_member(self, user):
        session = self.context.session
        session.remove_member(self.identity, user.identity)


class RelationTestObject(RelationTestEntity):
    def __init__(self, context, name):
        super().__init__(context, name)
        session = context.session
        self.dhash = self._create_object(session, self.identity)["id"]

    def _create_object(self, session, identity, parent=None, upload_as=None, share_3rd_party=None):
        raise NotImplementedError()

    def _access_object(self, session):
        raise NotImplementedError()

    def __call__(self, children=None, should_access=None, should_not_access=None):
        children = children or []
        should_access = should_access or []
        should_not_access = should_not_access or []

        class BoundTestSample(object):
            def __init__(self, sample, children, should_access):
                self.context = sample.context
                self.sample = sample
                self.parent = None
                self.children = children
                self.should_access = should_access
                for child in children:
                    child.parent = self

            @property
            def identity(self):
                return self.sample.identity

            @property
            def dhash(self):
                return self.sample.dhash

            def create(self, group=None, upload_as=None):
                self.sample.create(group, self.parent, upload_as=upload_as)
                for child in self.children:
                    child.create(group)

            def test(self):
                for user in self.context.users:
                    if user in should_access:
                        self.sample.should_access(user)
                    elif user in should_not_access:
                        self.sample.should_not_access(user)
                    else:
                        self.sample.should_not_access(user)
                for child in self.children:
                    child.test()

            def __str__(self):
                return self.sample.name

        return BoundTestSample(self, children, should_access)

    def create(self, group=None, parent=None, upload_as=None, share_3rd_party=None):
        if group is None:
            session = self.context.session
        else:
            session = group.session

        self._create_object(
            session,
            self.identity,
            parent=parent and parent.dhash,
            upload_as=upload_as,
            share_3rd_party=share_3rd_party
        )

    def should_access(self, group):
        try:
            self._access_object(group.session)
        except requests.exceptions.HTTPError as e:
            raise Exception(
                "{}.should_access({}) failed with {}".format(
                    str(self), str(group), str(e)
                )
            )

    def should_not_access(self, group):
        try:
            self._access_object(group.session)
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return True
        raise Exception("{}.should_not_access({}) failed".format(str(self), str(group)))


class RelationTestSample(RelationTestObject):
    def _create_object(self, session, identity, parent=None, upload_as=None, share_3rd_party=None):
        return session.add_sample(
            identity,
            identity,
            parent=parent,
            upload_as=upload_as,
            share_3rd_party=share_3rd_party,
        )

    def _access_object(self, session):
        session.get_sample(self.dhash)


class RelationTestConfig(RelationTestObject):
    def _create_object(self, session, identity, parent=None, upload_as=None, share_3rd_party=None):
        return session.add_config(
            parent,
            "malwarex",
            {
                "key1": identity,
                "key2": identity,
                "array": [identity, identity],
                "nested": {"nestedkey": identity},
            },
            share_3rd_party=share_3rd_party,
        )

    def _access_object(self, session):
        session.get_config(self.dhash)


class RelationTestBlob(RelationTestObject):
    def _create_object(self, session, identity, parent=None, upload_as=None, share_3rd_party=None):
        return session.add_blob(
            parent,
            blobname="malwarex.inject",
            blobtype="inject",
            content=identity,
            share_3rd_party=share_3rd_party,
        )

    def _access_object(self, session):
        session.get_blob(self.dhash)


class RelationTestCase(object):
    def __init__(self, session):
        self.session = session
        self.users = []
        self.groups = []
        self.samples = []
        self.configs = []
        self.blobs = []

    def new_user(self, name, capabilities=None):
        capabilities = capabilities or []
        user = RelationTestUser(self, name, capabilities)
        self.users.append(user)
        return user

    def new_group(self, name, capabilities=None):
        capabilities = capabilities or []
        user = RelationTestGroup(self, name, capabilities)
        self.groups.append(user)
        return user

    def new_sample(self, name):
        sample = RelationTestSample(self, name)
        self.samples.append(sample)
        return sample

    def new_config(self, name):
        config = RelationTestConfig(self, name)
        self.configs.append(config)
        return config

    def new_blob(self, name):
        blob = RelationTestBlob(self, name)
        self.blobs.append(blob)
        return blob
