import { render, screen } from "@testing-library/react";
import { AuthPanel } from "../AuthPanel";

const baseProps = {
  authForm: { username: "", email: "", password: "" },
  authError: "",
  setAuthMode: () => {},
  onChange: () => {},
  onSubmit: () => {},
};

describe("AuthPanel", () => {
  it("shows email input only for register mode", () => {
    const { rerender } = render(<AuthPanel {...baseProps} authMode="register" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();

    rerender(<AuthPanel {...baseProps} authMode="login" />);
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("renders error text when provided", () => {
    render(<AuthPanel {...baseProps} authMode="login" authError="Ошибка" />);
    expect(screen.getByText("Ошибка")).toBeInTheDocument();
  });
});
