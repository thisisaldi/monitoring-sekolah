"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";

import { login } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {state.formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-destructive">
          <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="bold" />
          {state.formError}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required defaultValue={state.values?.username} className="h-10" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10" />
      </div>
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
