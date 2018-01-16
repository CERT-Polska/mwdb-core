import sflock
import gzip
from StringIO import StringIO


class ExtrObj(object):
    blacklist_pkg = ['apk', 'jar', 'doc', 'xls', 'ppt', 'pdf', 'pub']

    def __init__(self, f, p=False):
        self.f = f
        self.password = set()
        self._children = []
        self.tags = []

    @property
    def comment(self):
        if self.password:
            return 'password%s: %s' % (('s' if len(self.password) else ''), ','.join(self.password))

    @property
    def parent(self):
        return self.f.parent.sha256

    @property
    def sha256(self):
        return self.f.sha256

    @property
    def filename(self):
        return self.f.filename

    @property
    def data(self):
        return self.f.contents

    @property
    def blacklisted(self):
        r = False
        r |= self.f.duplicate
        r |= self.f.package in self.blacklist_pkg
        r |= self.f.filename.endswith('.apk')
        return r

    @property
    def children(self):
        if not self.f.children and self.f.magic.startswith('gzip compressed data'):

            fn_idx = self.f.magic.find('was "')
            if fn_idx != -1:
                fn = self.f.magic[fn_idx + 5:].split('"')[0]

            g = gzip.GzipFile(fileobj=StringIO(self.data))
            fl = sflock.unpack(None, contents=g.read(), filename=g.filename)
            if not fl.filename:
                fl.filename = fl.sha256
            fl.parent = self.f
            self.f.children.append(fl)
        return self.f.children

    def process(self):
        if self._children:
            return self._children

        is_arch = False
        #        self.ast = self.f.astree()
        for f in self.children:
            f = ExtrObj(f)
            self._children.append(f)
            if f.f.password:
                self.password.add(f.f.password)

            if f.blacklisted:
                continue

            self._children += f.process()
            is_arch = True
        if is_arch:
            self.tags.append('archive')

        ## merge mips style
        if len(self._children) == 2:
            idx = fname = None
            for i, f in enumerate(self._children):
                if f.filename.endswith('.filename.txt'):
                    fname = f.f.contents
                    idx = i
                    break
            if idx:
                f = self._children[2 - 1 - idx]
                f.f.filename = fname
                self._children = [f]
        return self._children


def extract(fn, data):
    f = sflock.unpack(None, contents=data, filename=fn)

    f = ExtrObj(f)
    if f.blacklisted:
        return []
    return f.process()
