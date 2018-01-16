from libs.objects import File

import plugins


def is_eml(filename, data):
    obj = File(file_data=data)
    file_type = obj.get_type()

    if filename.endswith('.eml'):
        return True

    if file_type.startswith('SMTP') and not filename.endswith('.eml'):
        return True

    elif file_type == 'UTF-8 Unicode text, with very long lines, with CRLF line terminators' and \
            not filename.endswith('.eml') and \
                    'From: ' in data and 'Subject:' in data and 'Received: ' in data:
        return True

    elif file_type.startswith('ASCII text') and \
            not filename.endswith('.eml') and \
                    'From: ' in data and 'Subject:' in data and 'Received: ' in data:
        return True

    elif file_type.startswith('RFC 822 mail') and not filename.endswith('.eml'):
        return True
    return False


def check_and_process_email(filename, data):
    have_eml = is_eml(filename, data)
    if have_eml:
        analyze_email(data)
    return have_eml


@plugins.from_plugin("analysis")
def analyze_email(data, **_):
    """
    Plugin method (should be implemented in plugins.analysis.analyze_email).
    Provides e-mail analysis
    :param data: Data from file recognized as .eml
    :return: None
    """
    pass


@plugins.from_plugin("analysis")
def analyze_sample(ctx, **_):
    """
    Plugin method (should be implemented in plugins.analysis.analyze_sample).
    Sends sample to sandbox for further analysis
    :param data: Analysis context (look at libs.analysis.submit_md5)
    :return: Analysis task id
    """
    return None


@plugins.from_plugin("analysis")
def get_analysis_status(task_id, **_):
    """
    Plugin method (should be implemented in plugins.analysis.get_analysis_status).
    Checks status of sandbox analysis (started using analyze_sample)
    :param task_id: Task id from analyze_sample
    :return: Task status
    """
    return None