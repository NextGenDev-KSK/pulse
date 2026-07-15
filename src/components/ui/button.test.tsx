import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children as an accessible button", () => {
    render(<Button>Dispatch</Button>);
    expect(screen.getByRole("button", { name: "Dispatch" })).toBeInTheDocument();
  });

  it("fires onClick when activated", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges caller classes with the variant classes", () => {
    render(
      <Button variant="danger" className="custom-x">
        Delete
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("custom-x");
  });
});
