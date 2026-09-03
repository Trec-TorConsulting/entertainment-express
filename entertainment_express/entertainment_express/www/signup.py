from entertainment_express.control_plane.tenant_urls import tenant_base_domain


def get_context(context):
    context.tenant_domain = tenant_base_domain()
