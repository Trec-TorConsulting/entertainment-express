// Auto-loaded form script for Signup Application. Adds a one-click Approve that
// calls the control-plane approve_signup (creates Tenant + Provisioning Job).
frappe.ui.form.on("Signup Application", {
	refresh(frm) {
		if (frm.is_new() || frm.doc.status !== "new") {
			return;
		}

		frm
			.add_custom_button(__("Approve & Provision"), () => {
				const company = frappe.utils.escape_html(frm.doc.company_name || frm.doc.name);
				const slug = frappe.utils.escape_html(frm.doc.requested_slug || "");
				frappe.confirm(
					__("Approve <b>{0}</b> and provision tenant <b>{1}</b>? This creates a new isolated site.", [
						company,
						slug,
					]),
					() => {
						frappe.call({
							method: "entertainment_express.api.public.approve_signup",
							args: { application_name: frm.doc.name },
							freeze: true,
							freeze_message: __("Approving and enqueuing provisioning…"),
							callback: (r) => {
								if (r && r.message) {
									frappe.show_alert({
										message: __("Provisioning started — tenant {0} (job {1}).", [
											r.message.tenant,
											r.message.job,
										]),
										indicator: "green",
									});
									frm.reload_doc();
								}
							},
						});
					}
				);
			})
			.addClass("btn-primary");
	},
});
