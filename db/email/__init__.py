from db.email.models import *
from db.base import InsertRet
from db.decorators import taggable,time_sorted

import dateutil.parser as dp
from sqlalchemy_searchable import search


@taggable
@time_sorted
class MixEmail:


    def email_add(self,email):
        if type(email) != dict:
            raise Exception('please parse your email...')

        hdrs = email['headers']
        eml = Email(email['from'],email['subject'],email['data_hash'],email['headers'])
        if 'date' in email:
            eml.timestamp = dp.parse(email['date'])
        ret, eml = self.save_object(eml)

        if ret == InsertRet.ok:
            ## ips that saw this email.. but its tricky...
            #for url in ret['ips']:

            for url in email['urls']:
                ret, url = self.network_url_add(url)
                #self.add_tag('spam')
                eml._urls.append(url)

            for att in email['attachments']:
                ret,att = self.email_add_attachment(att)
                eml.attachments.append(att)
                self.session.commit()
                
        return ret,eml
                    
    def email_add_attachment(self,att):
        att_obj = Attachment()
        att_obj.content_type = att['content-type']
        att_obj.content_hash = att['hash']
        if 'content' in att:
            att_obj.content = att['content']
                               
        else:
            o = self.object_get(att['hash'])
            att_obj.obj_id = o.id
            
        return self.save_object(att_obj)

    def email_search(self,val):

        ## search through emails metadata
        q=self.session.query(Email)
        q=search(q,val)
        r=q.all()

        ## search through attachments
        q=self.session.query(Attachment)
        q=search(q,val)
        r1=list(set(sum(map(lambda a: a.emails,q.all()),[])))
        return r + r1
