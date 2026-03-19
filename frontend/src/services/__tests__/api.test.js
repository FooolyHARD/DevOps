import { api } from "../api";
import { vi } from "vitest";

const okResponse = (data) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });

const errorResponse = (data, status = 400) =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(data),
  });

describe("api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches auth header and parses json", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ ok: true })));

    await api.me("token-123");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
      }),
    );
  });

  it("returns null on 204 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(api.deleteScenario("token-1", 1)).resolves.toBeNull();
  });

  it("throws readable error from detail array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: [{ loc: ["body", "title"], msg: "String should have at least 3 characters" }],
        }),
      ),
    );

    await expect(api.createScenario("token-1", {})).rejects.toThrow("title: String should have at least 3 characters");
  });

  it("throws error from detail string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: "Неверный логин или пароль",
        }),
      ),
    );

    await expect(api.login({})).rejects.toThrow("Неверный логин или пароль");
  });

  it("sends JSON body for post", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ ok: true })));

    await api.register({ username: "user" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "user" }),
      }),
    );
  });

  it("formats detail object with msg", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: { msg: "Ошибка валидации" },
        }),
      ),
    );

    await expect(api.getOrganisms()).rejects.toThrow("Ошибка валидации");
  });

  it("formats mixed array detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: ["a", { msg: "b" }],
        }),
      ),
    );

    await expect(api.getDamageCategories()).rejects.toThrow("a, b");
  });

  it("formats unknown object detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: { foo: "bar" },
        }),
      ),
    );

    await expect(api.getBodyLocations()).rejects.toThrow('{"foo":"bar"}');
  });

  it("returns generic error when payload is null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(null)));

    await expect(api.getRiskLevels()).rejects.toThrow("Ошибка запроса");
  });

  it("formats detail array with loc field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse({
          detail: [{ loc: ["body", "field"], msg: "ошибка" }],
        }),
      ),
    );

    await expect(api.listScenarios("token")).rejects.toThrow("field: ошибка");
  });

  it("calls all api methods", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ ok: true })));

    await api.register({ username: "u" });
    await api.login({ username: "u" });
    await api.me("token");
    await api.getOrganisms();
    await api.getDamageCategories();
    await api.getBodyLocations();
    await api.getRiskLevels();
    await api.listScenarios("token");
    await api.createScenario("token", { title: "t" });
    await api.calculateScenario("token", { title: "t" });
    await api.deleteScenario("token", 1);
    await api.updateScenario("token", 1, { title: "t" });
    await api.listToxins("token");
    await api.createToxin("token", { name: "t" });
    await api.updateToxin("token", 1, { name: "t" });
    await api.deleteToxin("token", 1);
  });
});
