
const API_BASE_URL = "http://localhost:8080";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export const api = {
  getHealth: () => request("/api/health"),

  getServers: () => request("/api/servers"),

  createServer: (server) =>
    request("/api/servers", {
      method: "POST",
      body: JSON.stringify(server),
    }),

  updateMetrics: (id, metrics) => {
    const params = new URLSearchParams({
      cpu: String(metrics.cpu),
      memory: String(metrics.memory),
      status: metrics.status,
    });

    return request(`/api/servers/${id}/metrics?${params}`, {
      method: "PUT",
    });
  },
};
