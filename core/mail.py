import os
import socket
import smtplib

from email.message import EmailMessage

from flask import current_app
from core.util import is_true


class MailError(RuntimeError):
    pass


def create_message(kind, subject, recipient_email, **params) -> EmailMessage:
    template_path = f"mail_templates/{kind}.txt"

    if not os.path.exists(template_path):
        raise MailError("Text template file not found: {}".format(template_path))

    with open(template_path, "r") as f:
        template = f.read()

    html_template_path = f"mail_templates/{kind}.html"

    if os.path.exists(html_template_path):
        with open(html_template_path, "r") as f:
            html_template = f.read()
    else:
        html_template = None

    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = current_app.config["MAIL_FROM"]
    message['To'] = recipient_email
    message.set_content(template.format(**params))
    if html_template:
        message.add_alternative(html_template.format(**params), subtype='html')
    return message


def send_email_notification(kind, subject, recipient_email, **params):
    """
    Sends e-mail to provided recipient
    :param kind: Type of notification
    :param subject: Subject of notification
    :param recipient_email: Recipient e-mail address
    :param params: Additional message parameters
    """
    if "MAIL_SMTP" not in current_app.config:
        raise MailError("Missing MAIL_SMTP in config.py")
    if "MAIL_FROM" not in current_app.config:
        raise MailError("Missing MAIL_FROM in config.py")
    message = create_message(kind, subject, recipient_email, **params)
    if ":" in current_app.config["MAIL_SMTP"]:
        smtp_host, smtp_port = current_app.config["MAIL_SMTP"].split(":")
    else:
        smtp_host = current_app.config["MAIL_SMTP"]
        smtp_port = 25
    try:
        with smtplib.SMTP(smtp_host, int(smtp_port), timeout=3) as s:
            s.send_message(message)
    except Exception as e:
        raise MailError("Sending mail notification failed") from e
