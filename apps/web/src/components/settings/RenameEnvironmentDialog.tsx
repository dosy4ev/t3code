import type { EnvironmentId } from "@t3tools/contracts";
import * as Cause from "effect/Cause";
import { AsyncResult } from "effect/reactivity";
import { useId, useState } from "react";

import { environmentCatalog } from "~/connection/catalog";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function RenameEnvironmentDialog({
  environmentId,
  label,
  onClose,
}: {
  readonly environmentId: EnvironmentId;
  readonly label: string;
  readonly onClose: () => void;
}) {
  const id = useId();
  const setLabel = useAtomCommand(environmentCatalog.setLabel, { reportFailure: false });
  const [draft, setDraft] = useState(label);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = draft.trim();

  const save = async () => {
    if (trimmed === label) return onClose();
    setSaving(true);
    const result = await setLabel({ environmentId, label: trimmed });
    setSaving(false);
    if (AsyncResult.isSuccess(result)) return onClose();
    const cause = Cause.squash(result.cause);
    setError(cause instanceof Error ? cause.message : "The environment could not be renamed.");
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename environment</DialogTitle>
            <DialogDescription>The new name is only shown on this device.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-label`}>Name</Label>
              <Input
                id={`${id}-label`}
                autoFocus
                value={draft}
                disabled={saving}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </DialogPanel>
          <DialogFooter>
            <DialogClose disabled={saving} render={<Button variant="outline" disabled={saving} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving || trimmed === ""}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
