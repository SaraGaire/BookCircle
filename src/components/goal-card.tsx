"use client";

import { useActionState, useState, useTransition } from "react";
import { Target } from "lucide-react";
import {
  removeReadingGoal,
  setReadingGoal,
  type GoalFormState,
} from "@/app/diary/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_GOAL_TARGET } from "@/lib/goal-limits";

type GoalCardProps = {
  year: number;
  /** Books the reader wants to finish that year, or null if no goal. */
  target: number | null;
  /** Books finished that year so far. */
  finished: number;
};

const initialState: GoalFormState = {};

function books(count: number) {
  return `${count} ${count === 1 ? "book" : "books"}`;
}

export function GoalCard({ year, target, finished }: GoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, saving] = useActionState(setReadingGoal, initialState);
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Close the form once a save succeeds (same pattern as ReviewSection).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.saved) setEditing(false);
  }

  function handleRemove() {
    setRemoveError(null);
    startRemove(async () => {
      const result = await removeReadingGoal(year);
      if (result.error) setRemoveError(result.error);
    });
  }

  if (editing) {
    return (
      <form action={formAction} className="rounded-xl border p-5">
        <input type="hidden" name="year" value={year} />
        <label htmlFor="goal-target" className="text-sm font-medium">
          How many books do you want to read in {year}?
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            id="goal-target"
            name="target"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_GOAL_TARGET}
            defaultValue={target ?? 12}
            required
            autoFocus
            className="w-24"
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save goal"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
        {state.error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
      </form>
    );
  }

  if (target === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <p>
          You’ve read <span className="font-semibold">{books(finished)}</span> in{" "}
          {year}.
        </p>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Target aria-hidden="true" />
          Set a {year} goal
        </Button>
      </div>
    );
  }

  const percent = Math.min(Math.round((finished / target) * 100), 100);
  return (
    <div className="rounded-xl border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p>
          <span className="text-2xl font-semibold tabular-nums">{finished}</span>{" "}
          <span className="text-muted-foreground">
            of {books(target)} read in {year}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          {finished >= target ? "Goal reached!" : `${percent}%`}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`${year} reading goal`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(finished, target)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={removing}
          onClick={() => setEditing(true)}
        >
          Change goal
        </Button>
        <Button variant="ghost" size="sm" disabled={removing} onClick={handleRemove}>
          {removing ? "Removing…" : "Remove goal"}
        </Button>
      </div>
      {removeError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {removeError}
        </p>
      )}
    </div>
  );
}
