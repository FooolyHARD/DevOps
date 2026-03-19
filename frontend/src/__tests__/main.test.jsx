import { vi } from "vitest";

describe("main", () => {
  it("renders app into root", async () => {
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));

    vi.resetModules();
    vi.doMock("react-dom/client", () => ({ default: { createRoot }, createRoot }));

    document.body.innerHTML = '<div id="root"></div>';

    await import("../main.jsx");

    expect(createRoot).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
  });
});
