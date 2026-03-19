import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
  getOrganisms: vi.fn(),
  getDamageCategories: vi.fn(),
  getBodyLocations: vi.fn(),
  getRiskLevels: vi.fn(),
  listScenarios: vi.fn(),
  createScenario: vi.fn(),
  calculateScenario: vi.fn(),
  deleteScenario: vi.fn(),
  updateScenario: vi.fn(),
  listToxins: vi.fn(),
  createToxin: vi.fn(),
  updateToxin: vi.fn(),
  deleteToxin: vi.fn(),
}));

vi.mock("../services/api", () => ({
  api: apiMock,
}));

import App from "../App";

const baseRefs = {
  organisms: [
    { value: "jellyfish", label: "Медуза" },
    { value: "venomous_fish", label: "Ядовитая рыба" },
  ],
  damageCategories: [{ value: "local", label: "Локальное" }],
  bodyLocations: [{ value: "arm", label: "Рука" }],
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    apiMock.getOrganisms.mockResolvedValue(baseRefs.organisms);
    apiMock.getDamageCategories.mockResolvedValue(baseRefs.damageCategories);
    apiMock.getBodyLocations.mockResolvedValue(baseRefs.bodyLocations);
  });

  it("shows auth panel when not authenticated", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Вход" })).toBeInTheDocument();
  });

  it("shows admin switch and admin panel for admin user", async () => {
    localStorage.setItem("token", "token-1");
    apiMock.me.mockResolvedValue({ username: "admin", is_admin: true });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    expect(screen.getByText("Администратор")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Админ-панель" }));
    expect(await screen.findByText("Справочник токсинов")).toBeInTheDocument();
  });

  it("does not show admin switch for regular user", async () => {
    localStorage.setItem("token", "token-2");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Админ-панель" })).toBeNull();
  });

  it("registers and logs in", async () => {
    apiMock.register.mockResolvedValue({});
    apiMock.login.mockResolvedValue({ access_token: "token-1" });
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Регистрация" }));
    fireEvent.change(screen.getByLabelText("Логин"), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    await waitFor(() => expect(apiMock.register).toHaveBeenCalled());
    expect(apiMock.login).toHaveBeenCalledWith({ username: "user", password: "password123" });
  });

  it("previews and submits scenario", async () => {
    localStorage.setItem("token", "token-1");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([{ id: 1, name: "Токсин", organism_type: "jellyfish" }]);
    apiMock.calculateScenario.mockResolvedValue({
      risk_level: "low",
      risk_score: 12,
      summary: "summary",
      recommendations: "reco",
    });
    apiMock.createScenario.mockResolvedValue({});

    render(<App />);

    await waitFor(() => expect(apiMock.listToxins).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Тип токсина"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Ядовитая рыба" }));
    fireEvent.click(screen.getByRole("button", { name: "Предварительный расчет" }));

    expect(await screen.findByText("Результат")).toBeInTheDocument();

    fireEvent.submit(screen.getByRole("button", { name: "Сохранить сценарий" }).closest("form"));
    await waitFor(() => expect(apiMock.createScenario).toHaveBeenCalled());
  });

  it("creates toxin in admin panel", async () => {
    localStorage.setItem("token", "token-2");
    apiMock.me.mockResolvedValue({ username: "admin", is_admin: true });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);
    apiMock.createToxin.mockResolvedValue({});

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Админ-панель" }));

    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Тестовый токсин" } });
    fireEvent.change(screen.getByLabelText("Нейротоксичность"), { target: { value: "6" } });
    fireEvent.submit(screen.getByRole("button", { name: "Добавить токсин" }).closest("form"));

    await waitFor(() => expect(apiMock.createToxin).toHaveBeenCalled());
  });

  it("clears token on auth me error", async () => {
    localStorage.setItem("token", "token-3");
    apiMock.me.mockRejectedValue(new Error("Boom"));

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("shows auth error on login failure", async () => {
    apiMock.login.mockRejectedValue(new Error("Ошибка логина"));

    render(<App />);

    fireEvent.change(screen.getByLabelText("Логин"), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Ошибка логина")).toBeInTheDocument();
  });

  it("shows scenario error when preview fails", async () => {
    localStorage.setItem("token", "token-4");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([{ id: 1, name: "Токсин", organism_type: "jellyfish" }]);
    apiMock.calculateScenario.mockRejectedValue(new Error("Ошибка расчета"));

    render(<App />);

    await waitFor(() => expect(apiMock.listToxins).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Предварительный расчет" }));

    expect(await screen.findByText("Ошибка расчета")).toBeInTheDocument();
  });

  it("shows scenario error when delete fails", async () => {
    localStorage.setItem("token", "token-5");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([
      {
        id: 10,
        title: "Сценарий",
        toxin_type_name: "Токсин",
        organism_type: "jellyfish",
        damage_category: "local",
        body_location: "arm",
        contact_area_cm2: 1,
        contact_duration_min: 1,
        victim_age: 20,
        has_allergy: false,
        recommendations: "ok",
        risk_level: "low",
        risk_score: 10,
      },
    ]);
    apiMock.listToxins.mockResolvedValue([]);
    apiMock.deleteScenario.mockRejectedValue(new Error("Ошибка удаления"));

    render(<App />);

    await waitFor(() => expect(apiMock.listScenarios).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByText("Ошибка удаления")).toBeInTheDocument();
  });

  it("logs out from user card", async () => {
    localStorage.setItem("token", "token-6");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(await screen.findByRole("heading", { name: "Вход" })).toBeInTheDocument();
  });

  it("shows scenario error on submit failure", async () => {
    localStorage.setItem("token", "token-7");
    apiMock.me.mockResolvedValue({ username: "user", is_admin: false });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([{ id: 1, name: "Токсин", organism_type: "jellyfish" }]);
    apiMock.createScenario.mockRejectedValue(new Error("Ошибка сохранения"));

    render(<App />);

    await waitFor(() => expect(apiMock.listToxins).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Тип токсина"), { target: { value: "1" } });
    fireEvent.submit(screen.getByRole("button", { name: "Сохранить сценарий" }).closest("form"));

    expect(await screen.findByText("Ошибка сохранения")).toBeInTheDocument();
  });

  it("shows admin error on toxin create failure", async () => {
    localStorage.setItem("token", "token-8");
    apiMock.me.mockResolvedValue({ username: "admin", is_admin: true });
    apiMock.listScenarios.mockResolvedValue([]);
    apiMock.listToxins.mockResolvedValue([]);
    apiMock.createToxin.mockRejectedValue(new Error("Ошибка админа"));

    render(<App />);

    await waitFor(() => expect(apiMock.me).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Админ-панель" }));
    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Тестовый токсин" } });
    fireEvent.submit(screen.getByRole("button", { name: "Добавить токсин" }).closest("form"));
    fireEvent.click(screen.getByRole("button", { name: "Пользователь" }));

    expect(await screen.findByText("Ошибка админа")).toBeInTheDocument();
  });
});
