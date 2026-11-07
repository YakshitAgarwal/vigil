"use client";

import { useState } from "react";
import { EDITOR_KEY_STORAGE } from "./EditorKey";

type Status = "idle" | "posting" | "posted" | "duplicate" | "error";

export function PostButton({
  articleId,
  alreadyPosted,
}: {
  articleId: string;
  alreadyPosted: boolean;
}) {
  const [status, setStatus] = useState<Status>(
    alreadyPosted ? "duplicate" : "idle",
  );
  const [message, setMessage] = useState("");

  async function post() {
    setStatus("posting");
    setMessage("");
    try {
      const res = await fetch("/api/editor/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-editor-key": sessionStorage.getItem(EDITOR_KEY_STORAGE) ?? "",
        },
        body: JSON.stringify({ articleId }),
      });
      const data: { error?: string; duplicate?: boolean } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus(data.duplicate ? "duplicate" : "posted");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "posted" || status === "duplicate") {
    return (
      <p role="status" className="mt-4 text-[14px] text-flame">
        {status === "posted"
          ? "Posted to Vigil. It shows in the feed within a minute."
          : "Already on Vigil."}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={post}
        disabled={status === "posting"}
        className="min-h-11 rounded-full bg-flame px-5 text-[15px] font-semibold text-night hover:bg-[#ffc064] disabled:opacity-60"
      >
        {status === "posting" ? "Posting" : "Post to Vigil"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-[14px] text-heat">
          {message}
        </p>
      )}
    </div>
  );
}
