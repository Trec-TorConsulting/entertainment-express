import frappe
from frappe.model.document import Document


class EEEquipmentReservation(Document):
    pass


def ensure_reservation_index():
    """Ensure composite DB index exists for fast temporal range queries."""
    if frappe.db.table_exists("EE Equipment Reservation"):
        try:
            indexes = frappe.db.sql(
                "SHOW INDEX FROM `tabEE Equipment Reservation` WHERE Key_name = 'idx_item_buffer_status'",
                as_dict=True,
            )
            if not indexes:
                frappe.db.sql("""
                    CREATE INDEX `idx_item_buffer_status`
                    ON `tabEE Equipment Reservation` (`item_code`, `buffer_start`, `buffer_end`, `status`)
                """)
        except Exception:
            pass
