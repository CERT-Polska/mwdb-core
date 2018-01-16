 CREATE OR REPLACE FUNCTION get_xrefs(t0 character varying, t1 character varying, mlwr integer)
  RETURNS TABLE(mid integer)                                                                                                                                                                                        
  LANGUAGE plpgsql                                                                                                                                                                                                  
 AS $function$                                                                                                                                                                                                      
   DECLARE                                                                                                                                                                                                          
     p_sql TEXT;
                                                                                                                                                                                                                    
   BEGIN                                                                                                                                                                                                            
                                                                                                                                                                                                                    
     select ' WITH RECURSIVE xxrefs(trg) AS                                                                                                                                                                         
        (SELECT xrefs.'||t1 ||' AS trgt FROM xrefs                                                                                                                                                                  
        WHERE xrefs.'||t0||' = '||mlwr||'                                                                                                                                                                           
 UNION ALL SELECT xrefs_1.'||t1||' AS trg FROM xrefs AS xrefs_1, xxrefs AS anon_2                                                                                                                                   
 WHERE anon_2.trg = xrefs_1.'||t0||')                                                                                                                                                                               
         select trg from xxrefs'                                                                                                                                                                                    
     INTO p_sql;                                                                                                                                                                                                    
     RETURN QUERY EXECUTE p_sql;
 END
 $function$;
