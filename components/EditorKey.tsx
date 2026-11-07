"use client";

import { useEffect, useState } from "react";

export const EDITOR_KEY_STORAGE = "vigil-editor-key";

export function EditorKey() {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(sessionStorage.getItem(EDITOR_KEY_STORAGE) ?? "");
  }, []);

  return (
    <div className="mt-8 max-w-[360px]">
      <label htmlFor="editor-key" className="text-[14px] text-smoke">
        Editor key
      </label>
      <input
        id="editor-key"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          sessionStorage.setItem(EDITOR_KEY_STORAGE, e.target.value);
        }}
        className="mt-1 min-h-11 w-full rounded-md border border-wick bg-dusk px-3 text-[15px] text-tallow"
      />
    </div>
  );
}
