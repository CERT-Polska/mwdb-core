from db.config.models import *

from sqlalchemy import cast,and_, or_, func, desc, asc
from sqlalchemy.dialects.postgresql.json import JSONB

from db.base import InsertRet
from db.decorators import searchable,time_sorted

def get_cncs(cfg):

    for k in ('cfg','cnc','url'):
        if k in cfg:
            yield cfg[k]

    for k in ('urls','domains','cncs'):
        for itm in cfg.get(k,[]):
            if 'url' in itm:
                yield itm['url']
            elif 'cnc' in itm and 'port' in itm:
                yield 'unknown://%s:%d' %  (itm['cnc'],itm['port'])
            elif 'cnc' in itm:
                pref = 'http://'
                if itm['cnc'].startswith('http'):
                    pref = ''
                
                yield pref + itm['cnc']
                
            elif issubclass(type(itm), basestring):
                yield itm
    
@time_sorted
@searchable('id',{'type':'multi'})
class MixConfig:
    
    def config_add(self,cfg,hash=None):
        cfg = Config(cfg)
        ret, cfg = self.save_object(cfg)

        if hash:
            o = self.object_get(hash)
            if o not in cfg.objects:
                cfg.objects.append(o)
                self.session.commit()
                
        if ret == InsertRet.ok:
            for cnc in get_cncs(cfg.cfg):
                ret,cnc = self.network_url_add(cnc)
                cfg._cncs.append(cnc)
            
        self.session.commit()
        return cfg

    def config_samples(self,id):
        cfg = self.config_get(id)
        return cfg.objects

        
    def config_find(self,key,val):
        try:
            val2 = int(val)
            val2 = cast(val2,JSONB)
            f = Config.cfg[key]==val2
        except:
            val2 = None
            f = True

        val = cast(val,JSONB)
        q=self.session.query(Config)
        q=q.filter(Config.is_sharable(self.user))
        q=q.filter(or_(Config.cfg[key]==val,f))
        return q.all()
    
    config_search = config_find
    
    def config_get(self,id):
        return self.config_find_id(id)

    def config_stats(self):
        q = self.session.query(func.count(Config.type),Config.type)
        q = q.group_by(Config.type)
        return q.all()
