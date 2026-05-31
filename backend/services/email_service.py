import os

from email.message import EmailMessage

import aiosmtplib

from dotenv import load_dotenv

load_dotenv()


async def send_email(
    to_email: str,
    subject: str,
    body: str
):

    sender_email = os.getenv(
        "SENDER_EMAIL"
    )

    sender_password = os.getenv(
        "SENDER_PASSWORD"
    )

    smtp_server = os.getenv(
        "SMTP_SERVER",
        "smtp.gmail.com"
    )

    smtp_port = int(
        os.getenv(
            "SMTP_PORT",
            "587"
        )
    )

    if (
        not sender_email
        or not sender_password
    ):

        raise Exception(
            "SMTP credentials missing"
        )

    message = EmailMessage()

    message["From"] = sender_email

    message["To"] = to_email

    message["Subject"] = subject

    message.set_content("Your email client does not support HTML.")

    message.add_alternative(
        body,
        subtype="html"
    )

    # use_tls and start_tls are mutually exclusive in aiosmtplib 5.x
    tls_kwargs: dict = (
        {"use_tls": True}
        if smtp_port == 465
        else {"start_tls": True}
    )

    try:

        await aiosmtplib.send(

            message,

            hostname=smtp_server,

            port=smtp_port,

            username=sender_email,

            password=sender_password,

            **tls_kwargs
        )

    except Exception as e:

        print(
            f"Email send failed: {e}"
        )

        raise Exception(
            "Failed to send email"
        )