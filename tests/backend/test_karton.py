from .utils import random_name, rand_string, ShouldRaise


def test_karton_analyses_after_adding_blob(admin_session):
    test = admin_session
    blob_name = rand_string(15)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    analyses = test.get_analyses(blob_dhash)["analyses"]
    assert len(analyses) == 1


def test_karton_analysis_after_adding_config(admin_session):
    test = admin_session
    blob_name = rand_string(15)
    content = rand_string(15)
    config_json = {
        "cnc": [1, 2, 3],
        "raw_cfg": {
            "in-blob": {
                "blob_name": blob_name,
                "blob_type": "Blob type",
                "content": content
            }
        }
    }
    config = test.add_config(None, "malwarex", config_json)
    config_dhash = config["id"]
    analyses = test.get_analyses(config_dhash)["analyses"]
    assert len(analyses) == 1


def test_karton_analysis_after_adding_sample(admin_session):
    test = admin_session
    file_name = rand_string(15)
    file_content = rand_string() 
    sample = test.add_sample(file_name, file_content)
    sample_dhash = sample["id"]
    analyses = test.get_analyses(sample_dhash)["analyses"]
    assert len(analyses) == 1


def test_karton_reanalyze_object_with_args(admin_session):
    test = admin_session
    blob_name = rand_string(15)
    argument_key = rand_string(5)
    argument_value = rand_string(5)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    new_analysis = test.reanalyze_object(blob_dhash, arguments={argument_key: argument_value})
    analyses = test.get_analyses(blob_dhash)["analyses"]
    assert new_analysis["arguments"] == {argument_key: argument_value}
    assert len(analyses) == 2
    
    incorrect_object_dhash = "abcdefghi"
    with ShouldRaise(status_code=404):
        test.reanalyze_object(incorrect_object_dhash)


def test_karton_reanalyze_object_without_args(admin_session):
    test = admin_session
    file_name = rand_string(15)
    file_content = rand_string() 
    sample = test.add_sample(file_name, file_content)
    sample_dhash = sample["id"]
    test.reanalyze_object(sample_dhash)
    analyses = test.get_analyses(sample_dhash)["analyses"]
    assert len(analyses) == 2
    

def test_get_karton_analysis_info(admin_session):
    test = admin_session
    blob_name = rand_string(15)
    argument_key = rand_string(5)
    argument_value = rand_string(5)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    new_analysis = test.reanalyze_object(blob_dhash, arguments={argument_key: argument_value})
    analysis_id = new_analysis["id"]
    analysis_info = test.get_analysis_info(blob_dhash, analysis_id)
    assert analysis_id == analysis_info["id"]
    assert analysis_info["arguments"] == {argument_key: argument_value}
    

def test_assign_analysis_to_object(admin_session):
    test = admin_session
    file_name = rand_string(15)
    file_content = rand_string() 
    sample = test.add_sample(file_name, file_content)
    sample_dhash = sample["id"]
    new_analysis = test.reanalyze_object(sample_dhash)
    analysis_id = new_analysis["id"]
    
    blob_name = rand_string(15)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    
    test.assign_analysis_to_object(blob_dhash, analysis_id)    
    analyses_ids = [analysis["id"] for analysis in test.get_analyses(blob_dhash)["analyses"]]
    assert analysis_id in analyses_ids
    
    incorrect_analysis_id = "b99249a0-ff33-4c93-a9f9-d854ab0ecb0"
    with ShouldRaise(status_code=400):
        test.assign_analysis_to_object(blob_dhash, incorrect_analysis_id)


def test_unassign_analysis_from_object(admin_session):
    test = admin_session
    blob_name = rand_string(15)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    
    new_analysis_id = test.reanalyze_object(blob_dhash)["id"]
    
    all_object_analyses = test.get_analyses(blob_dhash)["analyses"]
    assert len(all_object_analyses) == 2
    
    test.unassign_analysis_from_object(blob_dhash, new_analysis_id)
    all_object_analyses = test.get_analyses(blob_dhash)["analyses"]
    assert len(all_object_analyses) == 1
    
    analyses_ids = [analysis["id"] for analysis in all_object_analyses]
    assert new_analysis_id not in analyses_ids
    
    incorrect_analysis_id = "b99249a0-ff33-4c93-a9f9-d854ab0ecb0"
    with ShouldRaise(status_code=400):
        test.unassign_analysis_from_object(blob_dhash, incorrect_analysis_id)


def test_unassign_analysis_not_assigned_to_object(admin_session):
    test = admin_session
    file_name = rand_string(15)
    file_content = rand_string() 
    sample = test.add_sample(file_name, file_content)
    sample_dhash = sample["id"]
    sample_analysis = test.reanalyze_object(sample_dhash)
    sample_analysis_id = sample_analysis["id"]
    
    blob_name = rand_string(15)
    blob = test.add_blob(None, blobname=blob_name, blobtype="inject", content="""
    Binary junk: \x00\x01\x02\x03\x04\x05\x07
    HELLO WORLD!
    ========""" + random_name())
    blob_dhash = blob["id"]
    
    with ShouldRaise(status_code=404):
        test.unassign_analysis_from_object(blob_dhash, sample_analysis_id)
