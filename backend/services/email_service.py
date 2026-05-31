import os

from dotenv import load_dotenv
import requests
load_dotenv()
import httpx

async def send_email(
    to_email: str,
    subject: str,
    body: str
):

    sender_email = os.getenv(
        "SENDER_EMAIL"
    )

    brevo_api= os.getenv(
        "BREVO_API"
    )
    
    if (
        not sender_email
        or not brevo_api
    ):

        raise Exception(
            "Email send failed"
        )


    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": brevo_api,
                "content-type": "application/json"
            },
            json={
                "sender": {
                    "name": "InferFlow",
                    "email": sender_email
                },
                "to": [
                    {
                        "email": to_email
                    }
                ],
                "subject": subject,
                "htmlContent": body
            }
        )
        response.raise_for_status()


        

    except Exception as e:

        print(
            f"Email send failed: {e}"
        )

        raise Exception(
            "Failed to send email"
        )
