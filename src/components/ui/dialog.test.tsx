import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "@/components/ui/dialog";

function Harness({
  open,
  onClose = () => {},
}: {
  open: boolean;
  onClose?: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <button>Alpha</button>
      <button>Omega</button>
    </Dialog>
  );
}

describe("Dialog accessibility", () => {
  it("exposes a modal dialog role when open", () => {
    render(<Harness open />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus into the dialog on open", () => {
    render(<Harness open />);
    // The built-in close button is the first focusable element.
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close dialog" }),
    );
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab focus within the dialog (wraps last → first)", () => {
    render(<Harness open />);
    const closeBtn = screen.getByRole("button", { name: "Close dialog" });
    const omega = screen.getByRole("button", { name: "Omega" });
    omega.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);
  });

  it("wraps Shift+Tab from first → last", () => {
    render(<Harness open />);
    const closeBtn = screen.getByRole("button", { name: "Close dialog" });
    const omega = screen.getByRole("button", { name: "Omega" });
    closeBtn.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(omega);
  });

  it("restores focus to the opener when closed", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { rerender } = render(<Harness open />);
    // Focus was pulled into the dialog.
    expect(document.activeElement).not.toBe(opener);

    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
