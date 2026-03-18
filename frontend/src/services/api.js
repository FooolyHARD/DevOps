const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getErrorMessage(data) {
  if (!data) {
    return "Ошибка запроса";
  }
  const detail = data.detail ?? data;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          if (item.msg) {
            if (Array.isArray(item.loc) && item.loc.length > 0) {
              const field = item.loc[item.loc.length - 1];
              return `${field}: ${item.msg}`;
            }
            return item.msg;
          }
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join(", ");
  }
  if (detail && typeof detail === "object") {
    if (detail.msg) {
      return detail.msg;
    }
    return JSON.stringify(detail);
  }
  return "Ошибка запроса";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (token) => request("/auth/me", { token }),
  getOrganisms: () => request("/reference/organisms"),
  getDamageCategories: () => request("/reference/damage-categories"),
  getBodyLocations: () => request("/reference/body-locations"),
  getRiskLevels: () => request("/reference/risk-levels"),
  listScenarios: (token) => request("/scenarios", { token }),
  createScenario: (token, body) => request("/scenarios", { method: "POST", token, body }),
  calculateScenario: (token, body) => request("/scenarios/calculate", { method: "POST", token, body }),
  deleteScenario: (token, id) => request(`/scenarios/${id}`, { method: "DELETE", token }),
  updateScenario: (token, id, body) => request(`/scenarios/${id}`, { method: "PUT", token, body }),
  listToxins: (token) => request("/toxins", { token }),
  createToxin: (token, body) => request("/admin/toxins", { method: "POST", token, body }),
  updateToxin: (token, id, body) => request(`/admin/toxins/${id}`, { method: "PUT", token, body }),
  deleteToxin: (token, id) => request(`/admin/toxins/${id}`, { method: "DELETE", token }),
};
