"use client";

import { useState } from "react";

/**
 * Tag registry editor: create, rename (type in place, Enter/blur commits),
 * and delete. Renames and deletes ripple through every build's tags.
 */
export function TagManager({
  tags,
  usage,
  onCreate,
  onRename,
  onDelete,
  noun = "build",
}: {
  tags: string[];
  usage: (tag: string) => number;
  onCreate: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
  /** What these tags go on — builds and relics keep separate registries. */
  noun?: "build" | "relic";
}) {
  const [newTag, setNewTag] = useState("");
  const create = () => {
    if (newTag.trim()) {
      onCreate(newTag);
      setNewTag("");
    }
  };
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4">
      <h3 className="font-display text-sm font-semibold text-parchment">
        {noun === "build" ? "Build tags" : "Relic tags"}
      </h3>
      <p className="mt-0.5 font-body text-xs text-parchment-faint">
        Tag {noun === "build" ? "builds" : "relics"} from any {noun} card, then filter by tag
        with the advanced filter. Renaming or deleting a tag updates every {noun} that uses
        it. {noun === "build" ? "Relics" : "Builds"} keep their own separate tag list.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              create();
            }
          }}
          placeholder="New tag"
          className="frame w-40 rounded bg-night-900 px-2 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint"
        />
        <button
          type="button"
          onClick={create}
          disabled={!newTag.trim()}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      {tags.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {tags.map((t) => (
            <TagRow
              key={t}
              tag={t}
              count={usage(t)}
              noun={noun}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TagRow({
  tag,
  count,
  noun,
  onRename,
  onDelete,
}: {
  tag: string;
  count: number;
  noun: "build" | "relic";
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
}) {
  const [draft, setDraft] = useState(tag);
  const commit = () => {
    if (draft.trim() && draft.trim() !== tag) onRename(tag, draft);
    else setDraft(tag);
  };
  return (
    <li className="flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(tag);
        }}
        aria-label={`Rename tag ${tag}`}
        className="frame w-40 rounded bg-night-900 px-2 py-1 font-body text-sm text-parchment"
      />
      <span className="font-body text-xs text-parchment-faint">
        {count === 1 ? `1 ${noun}` : `${count} ${noun}s`}
      </span>
      <button
        type="button"
        onClick={() => onDelete(tag)}
        className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
      >
        Delete
      </button>
    </li>
  );
}
