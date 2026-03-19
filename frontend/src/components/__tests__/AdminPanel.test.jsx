import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AdminPanel } from "../AdminPanel";

const baseProps = {
  toxins: [{ id: 1, name: "Токсин", description: "Описание" }],
  token: "token",
  user: { is_admin: true },
  onCreate: () => {},
  onDelete: () => {},
  onChange: () => {},
  toxinForm: {
    name: "Токсин",
    description: "Описание",
    organism_type: "jellyfish",
    neurotoxicity: 5,
    cytotoxicity: 5,
    pain_intensity: 5,
    systemic_factor: 5,
  },
};

describe("AdminPanel", () => {
  it("renders only for admin users", () => {
    const { rerender } = render(<AdminPanel {...baseProps} />);
    expect(screen.getByText("Справочник токсинов")).toBeInTheDocument();

    rerender(<AdminPanel {...baseProps} user={{ is_admin: false }} />);
    expect(screen.queryByText("Справочник токсинов")).toBeNull();
  });

  it("calls onCreate on submit", () => {
    const onCreate = vi.fn();
    render(<AdminPanel {...baseProps} onCreate={onCreate} />);

    fireEvent.submit(screen.getByRole("button", { name: "Добавить токсин" }).closest("form"));

    expect(onCreate).toHaveBeenCalled();
  });
});
