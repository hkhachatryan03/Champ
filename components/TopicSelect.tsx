"use client";

import { useState } from "react";

export default function TopicSelect({ topics }: { topics: string[] }) {
  const [choice, setChoice] = useState(topics[0]);
  const isOther = choice === "Other";

  return (
    <div>
      <label className="text-xs font-medium text-muted">Topic</label>
      <select
        name="topicChoice"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
      >
        {topics.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      {isOther && (
        <input
          name="customTopic"
          placeholder="What's it about?"
          required
          className="w-full mt-2 px-3 py-2 rounded-lg border border-line text-sm outline-none"
        />
      )}
    </div>
  );
}
