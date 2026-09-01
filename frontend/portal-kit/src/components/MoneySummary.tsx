import React from "react";
import { Money } from "./Money";
import { StatCard } from "./StatCard";

type Props = {
  owed?: string;
  paid?: string;
  remaining?: string;
};

export function MoneySummary({ owed = "0.00", paid = "0.00", remaining = "0.00" }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
      <StatCard label="You owe" value={owed} />
      <StatCard label="Paid" value={paid} />
      <StatCard label="Left to pay" value={remaining} />
      <p style={{ gridColumn: "1 / -1", margin: 0, color: "var(--ee-muted)" }}>
        <Money amount={remaining} /> remaining
      </p>
    </div>
  );
}
