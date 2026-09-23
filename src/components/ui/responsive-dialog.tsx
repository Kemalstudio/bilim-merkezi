"use client";

import * as React from "react";
import { Drawer } from "vaul";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * One dialog API, two presentations: a centred modal on tablets and desktops, a bottom sheet
 * (vaul) on phones — reachable with a thumb, dragged down to dismiss, and pushed up above the
 * keyboard while a field is focused. Screens below `sm` (640 px) get the sheet.
 */
const PHONE_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** False on the server and until the browser answers, so the modal is the safe default. */
function useIsPhone() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
}

const PhoneContext = React.createContext(false);

function ResponsiveDialog(props: React.ComponentProps<typeof Dialog>) {
  const isPhone = useIsPhone();
  return (
    <PhoneContext.Provider value={isPhone}>
      {isPhone ? <Drawer.Root {...props} /> : <Dialog {...props} />}
    </PhoneContext.Provider>
  );
}

function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  return React.useContext(PhoneContext) ? <Drawer.Trigger {...props} /> : <DialogTrigger {...props} />;
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  return React.useContext(PhoneContext) ? <Drawer.Close {...props} /> : <DialogClose {...props} />;
}

function ResponsiveDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  if (!React.useContext(PhoneContext)) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
      <Drawer.Content
        // Description is optional on some dialogs; the sheet should not warn about it.
        aria-describedby={undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.6rem] border border-b-0 border-border bg-surface shadow-glow-lg outline-none",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <Drawer.Handle className="mx-auto mt-3 mb-1 !h-1.5 !w-12 shrink-0 !bg-border" />
        <div className="grid gap-4 overflow-y-auto overscroll-contain p-5 pt-3">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

function ResponsiveDialogHeader(props: React.ComponentProps<typeof DialogHeader>) {
  return <DialogHeader {...props} />;
}

function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  return <DialogFooter {...props} />;
}

function ResponsiveDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  if (React.useContext(PhoneContext)) {
    return <Drawer.Title className={cn("font-display text-lg font-bold text-ink", className)} {...props} />;
  }
  return <DialogTitle className={className} {...props} />;
}

function ResponsiveDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  if (React.useContext(PhoneContext)) {
    return <Drawer.Description className={cn("text-sm text-muted", className)} {...props} />;
  }
  return <DialogDescription className={className} {...props} />;
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
