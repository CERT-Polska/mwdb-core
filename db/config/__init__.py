import bson
import gridfs
import pymongo

from libs.objects import Singleton, Config


def is_int(x):
    try:
        return int(x) or True
    except:
        return False


def clean_tm(r):
    tm = r.get('timestamp', 'unknown')
    if tm.__class__ != str:
        tm = str(tm)
    return (str(r['_id']), tm)


class Database:
    __metaclass__ = Singleton

    def __init__(self, connect=True, cfg='api.conf'):
        self.database = Config(cfg).configs.database
        self.dbname   = Config(cfg).configs.dbname
        self.connection = getattr(pymongo.MongoClient(self.database), self.dbname)

    def __del__(self):
        self.connection.close()

    def config(self, v):
        r = self.connection.config.find({'_id': bson.ObjectId(v)}).next()
        r['_id'] = str(r['_id'])

        if 'timestamp' in r:
            r['timestamp'] = str(r['timestamp'])

        return r

    def recent(self):
        for r in self.connection.config.find({'binary': {'$exists': 1}}).sort([('timestamp', -1)]).limit(100):

            t = r.get('family', r.get('type', None))
            if not t:
                continue

            yield (t,) + clean_tm(r)

    def from_gridfs(self, id):
        gr = gridfs.GridFS(self.connection)
        return gr.get(bson.ObjectId(id))

    def stats(self):

        ret = self.connection.config.aggregate(
            [{'$group': {'_id': {'type': "$type", 'fam': "$family"}, 'count': {'$sum': 1}}}])
        ret = [(x['count'], x['_id'].get('type', x['_id'].get('fam', ''))) for x in ret]
        return ret

    def search(self, k, v):

        print k, v
        if k == 'binary':
            q = {'binary': v}
        elif is_int(v) and len(v) < 20:
            q = {'$or': [{k: v}, {k: int(v)}]}

        elif k == 'cnc':
            src_list = map(lambda k: {k: v}, ['cfg', 'cnc', 'domains.cnc', 'urls.url', 'url', 'urls.cnc'])
            q = {'$or': src_list}
        else:
            q = {k: v, 'binary': {'$exists': 1}}
        for r in self.connection.config.find(q).sort([('timestamp', -1)]):
            yield clean_tm(r)
