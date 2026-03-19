import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ScenarioForm } from "../ScenarioForm";

const baseProps = {
  form: {
    title: "Новый сценарий",
    toxin_type_id: "",
    organism_type: "jellyfish",
    damage_category: "local",
    contact_area_cm2: 20,
    contact_duration_min: 10,
    victim_age: 30,
    has_allergy: false,
    body_location: "arm",
    notes: "",
  },
  toxins: [],
  organisms: [],
  damageCategories: [],
  bodyLocations: [],
  preview: null,
  onChange: () => {},
  onSubmit: () => {},
  onPreview: () => {},
};

describe("ScenarioForm", () => {
  it("renders error under submit button", () => {
    render(<ScenarioForm {...baseProps} error="Ошибка формы" />);
    expect(screen.getByText("Ошибка формы")).toBeInTheDocument();
  });

  it("filters toxins by organism type", () => {
    const toxins = [
      { id: 1, name: "Токсин медузы", organism_type: "jellyfish" },
      { id: 2, name: "Токсин рыбы", organism_type: "venomous_fish" },
    ];
    render(<ScenarioForm {...baseProps} toxins={toxins} />);

    const options = screen.getAllByRole("option").map((item) => item.textContent);
    expect(options).toContain("Токсин медузы");
    expect(options).not.toContain("Токсин рыбы");
  });

  it("calls onChange when organism switcher clicked", () => {
    const onChange = vi.fn();
    const organisms = [
      { value: "jellyfish", label: "Медуза" },
      { value: "venomous_fish", label: "Ядовитая рыба" },
    ];
    render(<ScenarioForm {...baseProps} organisms={organisms} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ядовитая рыба" }));

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].target).toMatchObject({ name: "organism_type", value: "venomous_fish" });
  });

  it("shows preview card when provided", () => {
    render(
      <ScenarioForm
        {...baseProps}
        preview={{
          risk_level: "low",
          risk_score: 12,
          summary: "summary",
          recommendations: "reco",
        }}
      />,
    );

    expect(screen.getByText("Результат")).toBeInTheDocument();
    expect(screen.getByText("12 баллов")).toBeInTheDocument();
    expect(screen.getByText("summary")).toBeInTheDocument();
  });

  it("calls onPreview and onSubmit", () => {
    const onPreview = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(<ScenarioForm {...baseProps} onPreview={onPreview} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Предварительный расчет" }));
    expect(onPreview).toHaveBeenCalled();

    fireEvent.submit(screen.getByRole("button", { name: "Сохранить сценарий" }).closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
