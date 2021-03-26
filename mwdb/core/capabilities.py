class Capabilities(object):
    # MWDB administration
    manage_users = "manage_users"
    # Accessed object is automatically shared when there is no access
    share_queried_objects = "share_queried_objects"
    # All uploaded objects are automatically added to this group
    access_all_objects = "access_all_objects"
    # Sharing objects with everyone + access to list of all users and groups
    sharing_objects = "sharing_objects"
    # Adding tags
    adding_tags = "adding_tags"
    # Removing all tags
    removing_tags = "removing_tags"
    # Adding comments
    adding_comments = "adding_comments"
    # Removing all comments
    removing_comments = "removing_comments"
    # Adding parents
    adding_parents = "adding_parents"
    # Ignore attribute ACL when reading
    reading_all_attributes = "reading_all_attributes"
    # Ignore attribute ACL when adding
    adding_all_attributes = "adding_all_attributes"
    # Adding and removing attribute keys
    managing_attributes = "managing_attributes"
    # Uploading files
    adding_files = "adding_files"
    # Uploading configs
    adding_configs = "adding_configs"
    # Uploading blobs
    adding_blobs = "adding_blobs"
    # Managing API keys, set password request etc.
    manage_profile = "manage_profile"
    # Adding quick queries, marking objects as favorite
    personalize = "personalize"
    # Rate limit is not applied for that group
    unlimited_requests = "unlimited_requests"
    # Removing objects
    removing_objects = "removing_objects"

    @classmethod
    def all(cls):
        return [
            k
            for k in cls.__dict__.keys()
            if not k.startswith("__") and type(cls.__dict__[k]) is str
        ]
