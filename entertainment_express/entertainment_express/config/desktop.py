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
            "module_name": "Workforce",
            "color": "#9C27B0",
            "icon": "octicon octicon-person",
            "type": "module",
            "label": _("Workforce"),
        },
        {
            "module_name": "Billing Payments",
            "color": "#F44336",
            "icon": "octicon octicon-credit-card",
            "type": "module",
            "label": _("Billing & Payments"),
        },
        {
            "module_name": "Marketing",
            "color": "#E91E63",
            "icon": "octicon octicon-megaphone",
            "type": "module",
            "label": _("Marketing"),
        },
        {
            "module_name": "Integrations",
            "color": "#607D8B",
            "icon": "octicon octicon-plug",
            "type": "module",
            "label": _("Integrations"),
        },
        {
            "module_name": "AI Assistant",
            "color": "#00BCD4",
            "icon": "octicon octicon-hubot",
            "type": "module",
            "label": _("AI Assistant"),
        },
        {
            "module_name": "Control Plane",
            "color": "#795548",
            "icon": "octicon octicon-server",
            "type": "module",
            "label": _("Control Plane"),
        },
        {
            "module_name": "Event Planning",
            "color": "#8BC34A",
            "icon": "octicon octicon-checklist",
            "type": "module",
            "label": _("Event Planning"),
        },
        {
            "module_name": "Music",
            "color": "#3F51B5",
            "icon": "octicon octicon-unmute",
            "type": "module",
            "label": _("Music"),
        },
        {
            "module_name": "Appointments",
            "color": "#009688",
            "icon": "octicon octicon-clock",
            "type": "module",
            "label": _("Appointments"),
        },
        {
            "module_name": "Venues Vendors",
            "color": "#FF5722",
            "icon": "octicon octicon-location",
            "type": "module",
            "label": _("Venues & Vendors"),
        },
        {
            "module_name": "Data Migration",
            "color": "#9E9E9E",
            "icon": "octicon octicon-database",
            "type": "module",
            "label": _("Data Migration"),
        },
    ]
