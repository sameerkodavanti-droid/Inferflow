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
            587
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

    try:

        await aiosmtplib.send(

            message,

            hostname=smtp_server,

            port=smtp_port,

            start_tls=True,

            username=sender_email,

            password=sender_password
        )

    except Exception as e:

        print(
            f"Email send failed: {e}"
        )

        raise Exception(
            "Failed to send email"
        )