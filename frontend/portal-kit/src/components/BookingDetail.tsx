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
  weather_status?: string;
  weather_sensitive?: number | boolean;
};

type Props = {
  booking: BookingDetailData | null;
  emptyTitle?: string;
  emptyMessage?: string;
  weather?: {
    weather_status?: string;
    weather_sensitive?: boolean;
    rain_date_offer?: {
      id?: string;
      candidate_start?: string;
      can_accept?: boolean;
    } | null;
  } | null;
  onAcceptRainDate?: () => void;
};

export function BookingDetail({
  booking,
  emptyTitle = "No event selected",
  emptyMessage = "Pick an event to see details.",
  weather,
  onAcceptRainDate,
}: Props) {
  if (!booking) {
    return (
      <section style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", padding: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{emptyTitle}</h3>
        <p style={{ color: "var(--ee-muted)" }}>{emptyMessage}</p>
      </section>
    );
  }

  const wxStatus = weather?.weather_status || booking.weather_status;
  const sensitive = weather?.weather_sensitive || booking.weather_sensitive;
  const offer = weather?.rain_date_offer;

  return (
    <article style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", boxShadow: "var(--ee-shadow)", padding: "1rem", display: "grid", gap: "0.4rem" }}>
      <h3 style={{ margin: 0 }}>{booking.event_name || booking.name}</h3>
      <p style={{ margin: 0, color: "var(--ee-muted)" }}>
        {booking.event_date} {booking.start_time ? `· ${booking.start_time}` : ""} {booking.status ? `· ${booking.status}` : ""}
      </p>
      {booking.venue_address ? <p style={{ margin: 0 }}>{booking.venue_address}</p> : null}
      {sensitive && wxStatus ? (
        <p style={{ margin: 0, color: wxStatus === "block" || wxStatus === "warning" ? "var(--ee-danger)" : "var(--ee-muted)" }}>
          Weather: {wxStatus}
        </p>
      ) : null}
      {offer?.can_accept && onAcceptRainDate ? (
        <button type="button" className="ee-btn" onClick={onAcceptRainDate} style={{ width: "fit-content" }}>
          Accept rain date {offer.candidate_start ? `(${offer.candidate_start})` : ""}
        </button>
      ) : null}
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
