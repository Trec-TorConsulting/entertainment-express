from entertainment_express.security.request_guards import require_client_login
from entertainment_express.www.portal_spa import apply_spa_context

no_cache = 1
base_template_path = ""


def get_context(context):
    require_client_login()
    apply_spa_context(context, title="Your events", portal="client")
