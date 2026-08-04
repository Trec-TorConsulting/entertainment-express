from entertainment_express.security.request_guards import require_client_login

no_cache = 1


def get_context(context):
    require_client_login()
