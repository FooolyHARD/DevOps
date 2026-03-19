import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ScenarioList } from "../ScenarioList";

const scenario = {
  id: 1,
  title: "Сценарий 1",
  toxin_type_name: "Нейротоксин",
  organism_type: "jellyfish",
  damage_category: "systemic",
  body_location: "arm",
  contact_area_cm2: 10,
  contact_duration_min: 5,
  victim_age: 30,
  has_allergy: false,
  recommendations: "Нужна очная консультация.",
  risk_level: "moderate",
  risk_score: 59.86,
};

describe("ScenarioList", () => {
  it("renders formatted params and recommendation", () => {
    render(<ScenarioList scenarios={[scenario]} onDelete={() => {}} />);

    expect(screen.getByText("Сценарий 1")).toBeInTheDocument();
    expect(screen.getByText(/Токсин: Нейротоксин/)).toBeInTheDocument();
    expect(screen.getByText(/Категория: Системное/)).toBeInTheDocument();
    expect(screen.getByText(/Зона: Рука/)).toBeInTheDocument();
    expect(screen.getByText(/Площадь: 10 см²/)).toBeInTheDocument();
    expect(screen.getByText(/Длительность: 5 мин/)).toBeInTheDocument();
    expect(screen.getByText(/Возраст: 30/)).toBeInTheDocument();
    expect(screen.getByText(/Аллергия: нет/)).toBeInTheDocument();
    expect(screen.getByText("Нужна очная консультация.")).toBeInTheDocument();
  });

  it("renders risk image for level", () => {
    render(<ScenarioList scenarios={[scenario]} onDelete={() => {}} />);

    const img = screen.getByRole("img", { name: /Иллюстрация риска: moderate/i });
    expect(img).toHaveAttribute("src", "/risk-images/moderate.jpg");
  });

  it("calls onDelete when delete clicked", () => {
    const onDelete = vi.fn();
    render(<ScenarioList scenarios={[scenario]} onDelete={onDelete} />);

    screen.getByRole("button", { name: "Удалить" }).click();
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows empty state when no scenarios", () => {
    render(<ScenarioList scenarios={[]} onDelete={() => {}} />);
    expect(screen.getByText("Пока нет сохраненных сценариев.")).toBeInTheDocument();
  });

  it("does not render image for unknown risk level", () => {
    render(
      <ScenarioList
        scenarios={[
          {
            ...scenario,
            id: 2,
            risk_level: "unknown",
          },
        ]}
        onDelete={() => {}}
      />,
    );

    expect(screen.queryByRole("img", { name: /Иллюстрация риска/i })).toBeNull();
  });
});
