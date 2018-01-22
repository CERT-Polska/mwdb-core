## here will be dragons
import sys
from functools import partial
from copy import deepcopy
from sqlalchemy import desc

class partialmethod(partial):
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return partial(self.func, instance,
                       *(self.args or ()), **(self.keywords or {}))

def get_base_class_from_mixin(cls,fpath=None):
    kname = cls if issubclass(type(cls),basestring) else cls.__name__[3:]
    m=sys.modules.get('db.%s.models'%(fpath or kname.lower()))
    if not m:
        base_cls = globals()[kname]
    else:
        base_cls = getattr(m,kname)
            
    return kname,base_cls

def make_bname(kname,module,suf):
    bname = module
    if bname:
        bname += '_'
    bname += '%s_%s'% (kname.lower(),suf)
    return bname    

def searchable(*args,**kwargs):
    def do_search(self,base_cls,f,v):
        f0 = getattr(base_cls,'is_sharable',lambda x: True)(self.user)
        q  = self.session.query(base_cls)
        q  = q.filter(getattr(base_cls, f) == v)
        return q.filter(f0)
    
    def make_class(cls,_fields=[]):
        kname,base_cls =get_base_class_from_mixin(cls,kwargs.get('module'))
        _fields = _fields or getattr(base_cls,'__searchable__',None)
        if not _fields:
            tn = str(base_cls.__table__)
            _fields = [str(f)[len(tn)+1:] for f in base_cls.__table__.c]
        bname =make_bname(kname,kwargs.get('module',''),'find_')
        base_f = do_search
        if not hasattr(cls,bname + 'field'):
            setattr(cls,bname + 'field',partialmethod(base_f,base_cls))
        base_fx_one   = lambda s,bc,f,v: base_f(s,bc,f,v).first()
        base_fx_multi = lambda s,bc,f,v: base_f(s,bc,f,v).all()
        for f in _fields:
            
            is_multi = False
            if type(f) == dict:
                f  = f.items()[0] 

            if type(f) in (tuple,list):
                is_multi = f[1] == 'multi'
                f = f[0]
                
            if is_multi:
                fx = partialmethod(base_fx_multi,base_cls,f)
            else:
                fx = partialmethod(base_fx_one,base_cls,f)
            setattr(cls,bname + f,fx)
        return cls
    
    def wrap(cls):
        return make_class(cls,args)
    
    a0 = args[0]
    return make_class(a0) if type(a0).__name__ == 'classobj' else wrap

def taggable(arg,**kwargs):

    def add_tag(self,base_cls,key,tag):
        ## use primary_key if there is os `self.get()` method
        f = getattr(self,base_cls.__name__.lower() + '_get',
                    self.session.query(base_cls).get)
        o = f(key)
        self.add_tag(o,tag)
        
    def make_class(cls,arg=None):
        kname,base_cls =get_base_class_from_mixin(arg or cls,kwargs.get('module'))
        bname =make_bname(kname,kwargs.get('module',''),'add_tag')
        fx = partialmethod(add_tag,base_cls)
        setattr(cls,bname,fx)
        return cls
    
    def wrap(cls):
        return make_class(cls,arg)
    a0=arg
    return make_class(a0) if type(a0).__name__ == 'classobj' else wrap

def viewable(arg):
    def wraper(cls):
        pk_name = cls.__mapper__.primary_key[0].name
        f = lambda self: (getattr(self,pk_name),getattr(self,'timestamp',-1),getattr(self,arg))
        f = property(f)
        if hasattr(cls,'_'+pk_name):
            pk_name = '_'+pk_name
        
        setattr(cls,'_view',f)
        setattr(cls,'__str__',lambda s: '%s(%s,%s,%s)' % (cls.__name__,s._view[0],str(s._view[1]),s._view[2]))
        setattr(cls,'__repr__',lambda s: s.__str__())
        
        return cls
    return wraper


def time_sorted(*args,**kwargs):

    def do_recent(self,base_cls,cnt=100):
        f = getattr(base_cls,'is_sharable',lambda x: True)(self.user)
        q = self.session.query(base_cls).filter(f)
        q = q.order_by(desc(getattr(base_cls,'timestamp')))
        return q.limit(cnt)
    
    def wrap(cls):
        return make_class(cls)

    def make_class(cls):
        module = kwargs.get('module')
        kname,base_cls =get_base_class_from_mixin(cls,module)
        bname = make_bname(kname,module or '','recent')
        fx = partialmethod(do_recent,base_cls)
        setattr(cls,bname,fx)
        return cls

    if args and type(args[0]).__name__ == 'classobj':
        return make_class(args[0])
    
    return wrap
