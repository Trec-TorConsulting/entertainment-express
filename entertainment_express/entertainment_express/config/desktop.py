"""
Frappe desktop configuration for Entertainment Express.
Modules are registered here for the desk app list.
"""

from frappe import _


def get_data():
    return [
        {
            "module_name": "Entertainment Express Core",
            "color": "#1A73E8",
            "icon": "octicon octicon-broadcast",
            "type": "module",
            "label": _("Entertainment Express"),
        },
        {
            "module_name": "Service Catalog",
            "color": "#2196F3",
            "icon": "octicon octicon-list-unordered",
            "type": "module",
            "label": _("Service Catalog"),
        },
        {
            "module_name": "Booking",
            "color": "#4CAF50",
            "icon": "octicon octicon-calendar",
            "type": "module",
            "label": _("Booking"),
        },
        {
            "module_name": "Scheduling Dispatch",
            "color": "#FF9800",
            "icon": "octicon octicon-organization",
            "type": "module",
            "label": _("Scheduling & Dispatch"),
        },
        {
            "module_name": "HR Workforce",
            "color": "#9C27B0",
            "icon": "octicon octicon-person",
            "type": "module",
            "label": _("HR & Workforce"),
        },
        {
            "module_name": "Billing Payments",
            "color": "#F44336",
            "icon": "octicon octicon-credit-card",
            "type": "module",
            "label": _("Billing & Payments"),
        },
        {
            "module_name": "Control Plane",
            "color": "#795548",
            "icon": "octicon octicon-server",
            "type": "module",
            "label": _("Control Plane"),
        },
    ]
