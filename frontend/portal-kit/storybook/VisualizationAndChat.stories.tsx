import React, { useState } from "react";
import { Sparkline } from "../src/patterns/Sparkline";
import { DonutProgress } from "../src/patterns/DonutProgress";
import { PlanningProgress } from "../src/patterns/PlanningProgress";
import { ChatThread, ChatMessage } from "../src/patterns/ChatThread";
import { MetricCard } from "../src/patterns/MetricCard";

export default {
  title: "Patterns/Data Visualization & Chat",
};

export const Visualizations = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderName: "Marcus Vance",
      senderRole: "Lead DJ",
      content: "Sound check complete at Grand Ballroom. Acoustic damping is ready.",
      timestamp: "14:15",
      isOutgoing: false
    },
    {
      id: "2",
      senderName: "Tobey Rector",
      senderRole: "Admin",
      content: "Great Marcus. Client requested the first dance song start right at 19:15.",
      timestamp: "14:22",
      isOutgoing: true
    }
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 font-body">
      <div>
        <h2 className="text-2xl font-bold mb-1">Data Visualization & Chat (3.5)</h2>
        <p className="text-sm text-[var(--ee-muted)]">
          Sparkline (pure SVG, no Chart.js), DonutProgress, PlanningProgress, ChatThread shell
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Revenue (30d)"
          value="$48,920.00"
          trend="+18.4%"
          trendDirection="up"
          sparkline={<Sparkline data={[12, 19, 15, 27, 24, 32, 45, 48]} width={90} height={26} color="var(--ee-success)" />}
        />
        <MetricCard
          title="Inquiries"
          value="34"
          trend="+4"
          trendDirection="up"
          sparkline={<Sparkline data={[8, 12, 9, 14, 18, 22, 28, 34]} width={90} height={26} color="var(--ee-brand)" />}
        />
        <MetricCard
          title="Talent Utilization"
          value="92.5%"
          trend="-1.2%"
          trendDirection="down"
          sparkline={<Sparkline data={[98, 96, 94, 91, 95, 93, 92]} width={90} height={26} color="var(--ee-danger)" />}
        />
      </div>

      <div className="flex items-center gap-6 p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl">
        <div className="flex items-center gap-3">
          <DonutProgress percentage={85} size={56} variant="brand" />
          <span className="text-xs font-medium">85% Pipeline Closed</span>
        </div>
        <div className="flex items-center gap-3">
          <DonutProgress percentage={100} size={56} variant="success" />
          <span className="text-xs font-medium">100% Contracts Signed</span>
        </div>
        <div className="flex items-center gap-3">
          <DonutProgress percentage={40} size={56} variant="warning" />
          <span className="text-xs font-medium">40% Deposit Retained</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <PlanningProgress
          sections={[
            { id: "timeline", title: "Timeline / Run-of-Show", description: "Grand entrance and toast times", completed: true },
            { id: "music", title: "Must-Play & Do-Not-Play List", description: "Top 20 song preferences", completed: true },
            { id: "vip", title: "Pronunciations & Special Guests", description: "Wedding party introduction details", completed: false, required: true },
            { id: "venue", title: "Load-In & Curfew Restrictions", description: "Access gate and power requirements", completed: false },
          ]}
          onOpenSection={(id) => console.log("Open", id)}
        />

        <ChatThread
          messages={messages}
          onSendMessage={(content) => {
            setMessages((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                senderName: "Tobey Rector",
                senderRole: "Admin",
                content,
                timestamp: "Just now",
                isOutgoing: true
              }
            ]);
          }}
        />
      </div>
    </div>
  );
};
