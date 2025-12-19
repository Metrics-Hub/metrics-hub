import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Shortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: "d",
      ctrlOrCmd: true,
      description: "Ir para Dashboard",
      action: () => navigate("/"),
    },
    {
      key: "l",
      ctrlOrCmd: true,
      description: "Ir para Leads",
      action: () => navigate("/leads"),
    },
    ...(isAdmin
      ? [
          {
            key: "a",
            ctrlOrCmd: true,
            shift: true,
            description: "Ir para Admin",
            action: () => navigate("/admin"),
          },
        ]
      : []),
    {
      key: "?",
      description: "Mostrar atalhos",
      action: () => setHelpModalOpen(true),
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if in input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlOrCmd ? ctrlOrCmd : !ctrlOrCmd;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    helpModalOpen,
    setHelpModalOpen,
  };
}
