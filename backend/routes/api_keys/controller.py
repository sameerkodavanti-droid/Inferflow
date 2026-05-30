from .service import create_api_key_service, revoke_api_key_service, get_my_api_keys_service


async def create_api_key_controller(
    request,
    db,
    curr_user
):

    return await create_api_key_service(
        request,
        db,
        curr_user
    )



async def revoke_api_key_controller(
    request,
    db,
    curr_user
):

    return await revoke_api_key_service(
        request,
        db,
        curr_user
    )

async def get_my_api_keys_controller(
    db,
    curr_user
):

    return await get_my_api_keys_service(
        db,
        curr_user
    )
