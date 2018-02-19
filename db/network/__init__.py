from db.network.models import *
from db.decorators import searchable,time_sorted,has_cuckoo

@time_sorted(module='network')
class MixIP:
    def network_ip_add(self,ip):
        d = IP(ip)
        return self.save_object(d)

    def network_ip_get(self,ip):
        pass

@time_sorted(module='network')
@searchable('domain',module='network')
class MixDomain:

    def network_domain_add(self,domain):
        d = Domain(domain)
        return self.save_object(d)
    
    def network_domain_get(self,d):
        return self.network_domain_find_domain(d)


@time_sorted(module='network')
@searchable({'port':'multi'},module='network')
@has_cuckoo(module='network')
class MixURL:

    def network_url_add(self,url):
        url = URL(url)
        url.hostname = self.network_domain_add(url._hostname)[1].id
        return self.save_object(url)



class MixNetwork(MixDomain,MixURL):
    pass
    
        
    

        
