import React from "react";
import { Money } from "./Money";

export type BookingDetailData = {
  name?: string;
  event_name?: string;
  event_date?: string;
  start_time?: string;
  status?: string;
  venue_address?: string;
  grand_total?: string;
  balance_due?: string;
  deposit_status?: string;
};

type Props = {
  booking: BookingDetailData | null;
  emptyTitle?: string;
  emptyMessage?: string;
};

export function BookingDetail({ booking, emptyTitle = "No event selected", emptyMessage = "Pick an event to see details." }: Props) {
  if (!booking) {
    return (
      <section style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", padding: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{emptyTitle}</h3>
        <p style={{ color: "var(--ee-muted)" }}>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <article style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", boxShadow: "var(--ee-shadow)", padding: "1rem", display: "grid", gap: "0.4rem" }}>
      <h3 style={{ margin: 0 }}>{booking.event_name || booking.name}</h3>
      <p style={{ margin: 0, color: "var(--ee-muted)" }}>
        {booking.event_date} {booking.start_time ? `· ${booking.start_time}` : ""} {booking.status ? `· ${booking.status}` : ""}
      </p>
      {booking.venue_address ? <p style={{ margin: 0 }}>{booking.venue_address}</p> : null}
      {booking.grand_total ? (
        <p style={{ margin: 0 }}>
          Total <Money amount={String(booking.grand_total)} />
          {booking.balance_due ? (
            <>
              {" "}
              · Left <Money amount={String(booking.balance_due)} />
            </>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
