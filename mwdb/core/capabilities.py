class Capabilities(object):
    manage_users = "manage_users"
    share_queried_objects = "share_queried_objects"
    access_all_objects = "access_all_objects"
    sharing_objects = "sharing_objects"
    adding_tags = "adding_tags"
    removing_tags = "removing_tags"
    adding_comments = "adding_comments"
    removing_comments = "removing_comments"
    adding_parents = "adding_parents"
    reading_all_attributes = "reading_all_attributes"
    adding_all_attributes = "adding_all_attributes"
    managing_attributes = "managing_attributes"
    removing_attributes = "removing_attributes"
    adding_configs = "adding_configs"
    adding_blobs = "adding_blobs"
    unlimited_requests = "unlimited_requests"
    removing_objects = "removing_objects"

    @classmethod
    def all(cls):
        return [
            k
            for k in cls.__dict__.keys()
            if not k.startswith("__") and type(cls.__dict__[k]) is str
        ]
