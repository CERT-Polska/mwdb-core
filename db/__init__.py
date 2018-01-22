from db.base import DbBase

from sqlalchemy_searchable import make_searchable
make_searchable()

from db.object  import MixObject
from db.email   import MixEmail
from db.config  import MixConfig
from db.network import MixNetwork


## remove or add new mixins
class Database(DbBase,MixNetwork,MixObject,\
               MixConfig,MixEmail):
    pass


if __name__ == '__main__':
    from sqlalchemy.engine import reflection

    db = Database()
    db.set_user('mak')
    # from sqlalchemy.inspection import inspect
    # insp=reflection.Inspector.from_engine(db.engine)
    # print insp.get_table_names()
    # for idx in insp.get_indexes('malwares'):
    #     if idx['unique']:
    #         print idx
    # print insp.get_columns('configs')

    from sqlalchemy import desc,cast
    from db.object.models import Object

    print db.object_find_field('sha1','711d3ec6de3e1a747a24f0c344157eac23dcc61b')

    obj = db.object_get('711d3ec6de3e1a747a24f0c344157eac23dcc61b')
    print obj
    print str(obj._view[1])
    print 'eee',obj.config

    print obj.config.cncs
    c= db.config_get(5)
    print c.cncs
    
    # db.object_add_tag(obj,'dupa')
    # print db.tag_find_tagged('dupa')

    
#     from db.config.models import Config
#     from sqlalchemy.dialects.postgresql.json import JSONB
#     print 'asdf'
#     print db.config_find("harcoded_domain",'hshshshsussiiwuwyw.com')
#     print db.config_find_type('ramnit')
    

#     from db.network.models import IP,Domain
# #    lip = IP.to_int('127.0.0.1')
#     ip = IP('127.0.0.1')
#     print db.save_object(ip)
    
#     xip = db.session.query(IP).filter_by(_ip =  ip._ip).first()
#     print xip.__mapper__.primary_key
#     print xip
#     dd = db.network_domain_get('uggaverlo.ru')
#     print dd

#     print db.network_url_find_port('80')

#     print db.object_recent()
#     print db.config_recent()
#     print list(db.network_url_recent())
#     print list(db.network_domain_recent())

#     print db.email_search('Order')
#     print map(lambda x: x.subject,db.email_search('suspend'))
    
