import json
import os
import time
import uuid

import requests
import logging

import baseconv
from requests.exceptions import HTTPError


def base62uuid():
    ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    converter = baseconv.BaseConverter(ALPHABET)
    uuid4_as_hex = str(uuid.uuid4()).replace('-', '')
    uuid4_as_int = int(uuid4_as_hex, 16)
    return converter.encode(uuid4_as_int)


def random_name():
    return base62uuid()


def admin_login():
    return os.environ['MWDB_ADMIN_LOGIN']


class ShouldRaise(object):
    def __init__(self, status_code=None):
        self.status_code = status_code

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_val, traceback):
        if exc_type is None:
            raise Exception("Exception was expected")
        if not issubclass(exc_type, HTTPError):
            return
        if self.status_code and exc_val.response.status_code != self.status_code:
            return
        return True


class MwdbTest(object):
    def __init__(self):
        self.mwdb_url = os.environ.get('MWDB_URL')
        self.session = requests.session()

    def login_as(self, username, password):
        res = self.session.post(self.mwdb_url + "/auth/login", json={
            "login": username, "password": password
        })
        res.raise_for_status()
        self.session.headers.update({'Authorization': 'Bearer ' + res.json()['token']})
        return res.json()

    def set_auth_token(self, token):
        self.session.headers.update({'Authorization': 'Bearer ' + token})

    def request(self, method, endpoint, params=None, json=None):
        res = self.session.request(method, self.mwdb_url + endpoint, params=params, json=json)
        res.raise_for_status()
        return res.json()

    def login(self):
        return self.login_as(admin_login(),
                             os.environ['MWDB_ADMIN_PASSWORD'])

    def api_key_create(self, login):
        res = self.session.post(self.mwdb_url + '/user/' + login + '/api_key')
        res.raise_for_status()
        return res

    def api_key_get(self, api_key):
        res = self.session.get(self.mwdb_url + '/api_key/' + api_key)
        res.raise_for_status()
        return res

    def api_key_delete(self, api_key):
        res = self.session.delete(self.mwdb_url + '/api_key/' + api_key)
        res.raise_for_status()
        return res

    def create_group(self, name, capabilities=None):
        res = self.session.post(self.mwdb_url + '/group/' + name, json={
            'capabilities': capabilities or []
        })
        res.raise_for_status()

    def set_group(self, name, new_name=None, capabilities=None):
        res = self.session.put(self.mwdb_url + '/group/' + name, json={
            'name': new_name,
            'capabilities': capabilities
        })
        res.raise_for_status()

    def get_shares(self, identifier):
        res = self.session.get(self.mwdb_url + '/object/' + identifier + '/share')
        res.raise_for_status()
        return res.json()

    def get_sharing_groups(self):
        res = self.session.get(self.mwdb_url + '/share')
        res.raise_for_status()
        return res.json()["groups"]

    def share_with(self, identifier, name):
        res = self.session.put(self.mwdb_url + '/object/' + identifier + '/share', json={
            "group": name
        })
        res.raise_for_status()
        return res.json()

    def add_member(self, name, username):
        res = self.session.put(self.mwdb_url + '/group/' + name + '/member/' + username)
        res.raise_for_status()

    def remove_member(self, name, username):
        res = self.session.delete(self.mwdb_url + '/group/' + name + '/member/' + username)
        res.raise_for_status()

    def register_user(self, username, password, capabilities=None):
        capabilities = capabilities or []
        self.login()
        res = self.session.post(self.mwdb_url + '/user/' + username, json={
            'email': username + "@" + username + '.pl',
            'additional_info': 'Test user'
        })
        res.raise_for_status()
        res = self.session.get(self.mwdb_url + '/user/' + username + '/change_password')
        res.raise_for_status()
        setpasswdtoken = res.json()["token"]
        res = self.session.post(self.mwdb_url + '/auth/change_password', json={
            "token": setpasswdtoken,
            "password": password
        })
        res.raise_for_status()
        res = self.session.put(self.mwdb_url + '/group/' + username, json={
            'capabilities': capabilities
        })
        res.raise_for_status()
        return res.json()

    def add_sample_legacy(self, filename=None, content=None, parent=None, metakeys=None, upload_as=None):
        parent = parent or "root"

        if filename is None:
            filename = str(uuid.uuid4())

        if content is None:
            content = str(uuid.uuid4())

        params = {}
        if metakeys:
            params["metakeys"] = json.dumps(metakeys)
        if upload_as:
            params["upload_as"] = upload_as

        res = self.session.post(self.mwdb_url + '/file/' + parent, files={'file': (filename, content)}, data=params)
        res.raise_for_status()
        return res.json()

    def add_sample(self, filename=None, content=None, parent=None, metakeys=None, upload_as=None):
        if filename is None:
            filename = str(uuid.uuid4())

        if content is None:
            content = str(uuid.uuid4())

        res = self.session.post(self.mwdb_url + '/file', files={
            'file': (filename, content),
            'options': (None, json.dumps({
                "parent": parent,
                "metakeys": metakeys or [],
                "upload_as": upload_as or "*"
            }))
        })
        res.raise_for_status()
        return res.json()

    def get_sample(self, identifier):
        res = self.session.get(self.mwdb_url + '/file/' + identifier)
        res.raise_for_status()
        return res.json()

    def remove_object(self, identifier):
        res = self.session.delete(self.mwdb_url + '/object/' + identifier)
        res.raise_for_status()
        return res.json()

    def add_tag(self, identifier, tag):
        res = self.session.put(self.mwdb_url + '/object/' + identifier + '/tag', json={'tag': tag})
        res.raise_for_status()
        return res.json()

    def get_tags(self, identifier):
        res = self.session.get(self.mwdb_url + '/object/' + identifier + '/tag')
        res.raise_for_status()
        return res.json()

    def delete_tag(self, identifier, tag):
        res = self.session.delete(self.mwdb_url + '/object/' + identifier + '/tag', params={'tag': tag})
        res.raise_for_status()
        return res.json()

    def add_comment(self, identifier, content):
        res = self.session.post(self.mwdb_url + '/object/' + identifier + '/comment', json={'comment': content})
        res.raise_for_status()
        return res.json()

    def add_xref(self, parent, child):
        res = self.session.put(self.mwdb_url + '/object/' + parent + '/child/' + child)
        res.raise_for_status()
        return res.json()

    def delete_comment(self, identifier, comment_id):
        res = self.session.delete(self.mwdb_url + '/object/' + identifier + '/comment/' + str(comment_id))
        res.raise_for_status()
        return res.json()

    def get_comments(self, identifier):
        res = self.session.get(self.mwdb_url + '/object/' + identifier + '/comment')
        res.raise_for_status()
        return res.json()

    def add_attribute(self, identifier, key, value):
        res = self.session.post(self.mwdb_url + '/object/' + identifier + '/meta', json={'key': key, 'value': value})
        res.raise_for_status()
        return res.json()

    def get_attributes(self, identifier, show_hidden=False):
        res = self.session.get(self.mwdb_url + '/object/' + identifier + '/meta', params={
            "hidden": int(show_hidden)
        })
        res.raise_for_status()
        return res.json()

    def add_attribute_definition(self, key, template, hidden=False):
        res = self.session.put(self.mwdb_url + '/meta/manage/' + key,
                               json={
                                   'label': '',
                                   'description': '',
                                   'template': template,
                                   'hidden': hidden
                               })
        res.raise_for_status()
        return res.json()

    def get_attribute_definitions(self):
        res = self.session.get(self.mwdb_url + '/meta/manage')
        res.raise_for_status()
        return res.json()

    def add_attribute_permission(self, key, group, can_read, can_set):
        res = self.session.put(self.mwdb_url + '/meta/manage/' + key + '/permissions/' + group,
                               json={'can_read': can_read, 'can_set': can_set})
        res.raise_for_status()
        return res.json()

    def remove_attribute_permission(self, key, group):
        res = self.session.delete(self.mwdb_url + '/meta/manage/' + key + '/permissions/' + group)
        res.raise_for_status()
        return res.json()

    def get_readable_attributes(self):
        res = self.session.get(self.mwdb_url + '/meta/list/read')
        res.raise_for_status()
        return res.json()

    def get_settable_attributes(self):
        res = self.session.get(self.mwdb_url + '/meta/list/set')
        res.raise_for_status()
        return res.json()

    def get_download_url(self, identifier):
        res = self.session.post(self.mwdb_url + '/request/sample/' + identifier)
        res.raise_for_status()
        return res.json()

    def add_config(self, parent, family, config_json):
        res = self.session.post(self.mwdb_url + '/config', json={
            'family': family,
            'cfg': config_json,
            'parent': parent
        })
        res.raise_for_status()
        return res.json()

    def get_config(self, identifier):
        res = self.session.get(self.mwdb_url + '/config/' + identifier)
        res.raise_for_status()
        return res.json()

    def recent_samples(self, page):
        res = self.session.get(self.mwdb_url + '/file?page=' + str(page))
        res.raise_for_status()
        return res.json()

    def recent_configs(self, page):
        res = self.session.get(self.mwdb_url + '/config?page=' + str(page))
        res.raise_for_status()
        return res.json()

    def add_blob(self, parent, blobname=None, blobtype=None, content=None):
        res = self.session.post(self.mwdb_url + '/blob', json={
            'blob_name': blobname or str(uuid.uuid4()),
            'blob_type': blobtype or "inject",
            'content': content or str(uuid.uuid4()),
            'parent': parent
        })
        res.raise_for_status()
        return res.json()

    def get_blob(self, identifier):
        res = self.session.get(self.mwdb_url + '/blob/' + identifier)
        res.raise_for_status()
        return res.json()

    def recent_blobs(self, page):
        res = self.session.get(self.mwdb_url + '/blob?page=' + str(page))
        res.raise_for_status()
        return res.json()

    def search(self, query):
        res = self.session.post(self.mwdb_url + '/search', json={'query': query})
        res.raise_for_status()
        return res.json()

    def check_operational(self):
        for attempt in range(10):
            try:
                res = self.session.get(self.mwdb_url + '/ping', timeout=1)
                res.raise_for_status()
                return
            except requests.exceptions.ConnectionError:
                logging.getLogger().info("MWDB is not responding, waiting for it to become operational...")
            except requests.exceptions.RequestException:
                logging.getLogger().info("MWDB request failed, retrying...")

            time.sleep(5.0)

        raise RuntimeError("Failed to see MWDB operational")
