
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bell, CheckCircle2, ChevronDown,
  CircleHelp, Cloud, Cpu, Database, Gauge, HardDrive,
  LayoutDashboard, Menu, Plus, RefreshCw, Search, Server,
  Settings, ShieldCheck, Signal, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { api } from "./services/api";
import "./App.css";

const REFRESH_INTERVAL = 10000;

const initialForm = {
  hostname: "",
  environment: "Development",
  ipAddress: "",
  status: "ACTIVE",
};

const numeric = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isActive = (status) =>
  ["ACTIVE", "UP", "RUNNING", "ONLINE"].includes(
    String(status || "").toUpperCase()
  );

function MetricCard({ icon: Icon, title, value, unit, color, description }) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span>{title}</span>
        <span className={`metric-symbol ${color}`}><Icon size={19} /></span>
      </div>
      <div className="metric-number">
        {value}<small>{unit}</small>
      </div>
      <div className="metric-description">{description}</div>
    </article>
  );
}

function Progress({ value, color = "purple" }) {
  const safeValue = Math.min(100, Math.max(0, numeric(value)));
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${color}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function Status({ status }) {
  const active = isActive(status);
  return (
    <span className={`status ${active ? "online" : "offline"}`}>
      <span />{status || "UNKNOWN"}
    </span>
  );
}

function Modal({ server, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    server
      ? {
          cpu: numeric(server.cpuUsage),
          memory: numeric(server.memoryUsage),
          status: server.status || "ACTIVE",
        }
      : initialForm
  );

  const change = (key, value) =>
    setForm((old) => ({ ...old, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">INFRASTRUCTURE MANAGEMENT</span>
            <h2>{server ? "Update server metrics" : "Register new server"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X /></button>
        </div>

        <form onSubmit={submit}>
          {server ? (
            <>
              <label>CPU utilization (%)
                <input type="number" min="0" max="100" step="0.1"
                  required value={form.cpu}
                  onChange={(e) => change("cpu", e.target.value)} />
              </label>
              <label>Memory utilization (%)
                <input type="number" min="0" max="100" step="0.1"
                  required value={form.memory}
                  onChange={(e) => change("memory", e.target.value)} />
              </label>
              <label>Status
                <select value={form.status}
                  onChange={(e) => change("status", e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DOWN">DOWN</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label>Hostname
                <input required placeholder="app-server-01"
                  value={form.hostname}
                  onChange={(e) => change("hostname", e.target.value)} />
              </label>
              <label>IP address
                <input required placeholder="192.168.1.10"
                  value={form.ipAddress}
                  onChange={(e) => change("ipAddress", e.target.value)} />
              </label>
              <label>Environment
                <select value={form.environment}
                  onChange={(e) => change("environment", e.target.value)}>
                  <option>Development</option>
                  <option>Testing</option>
                  <option>Staging</option>
                  <option>Production</option>
                </select>
              </label>
              <label>Status
                <select value={form.status}
                  onChange={(e) => change("status", e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : server ? "Save metrics" : "Register server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [servers, setServers] = useState([]);
  const [health, setHealth] = useState("CHECKING");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [healthResult, serverResult] = await Promise.allSettled([
        api.getHealth(),
        api.getServers(),
      ]);

      setHealth(healthResult.status === "fulfilled" ? "UP" : "DOWN");

      if (serverResult.status === "fulfilled") {
        setServers(Array.isArray(serverResult.value) ? serverResult.value : []);
        setLastUpdated(new Date());
        setError("");
      } else {
        throw serverResult.reason;
      }
    } catch (err) {
      setError(err.message || "Could not load infrastructure data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => refresh(false), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [autoRefresh, refresh]);

  const stats = useMemo(() => {
    const active = servers.filter((s) => isActive(s.status)).length;
    const cpu = servers.length
      ? servers.reduce((sum, s) => sum + numeric(s.cpuUsage), 0) / servers.length
      : 0;
    const memory = servers.length
      ? servers.reduce((sum, s) => sum + numeric(s.memoryUsage), 0) / servers.length
      : 0;

    return {
      total: servers.length,
      active,
      inactive: servers.length - active,
      cpu,
      memory,
    };
  }, [servers]);

  const alerts = useMemo(() => {
    return servers.flatMap((server) => {
      const items = [];
      if (numeric(server.cpuUsage) >= 80) {
        items.push({
          id: `${server.id}-cpu`,
          hostname: server.hostname,
          message: `CPU utilization is ${numeric(server.cpuUsage).toFixed(1)}%`,
          level: "warning",
        });
      }
      if (numeric(server.memoryUsage) >= 85) {
        items.push({
          id: `${server.id}-memory`,
          hostname: server.hostname,
          message: `Memory utilization is ${numeric(server.memoryUsage).toFixed(1)}%`,
          level: "critical",
        });
      }
      if (!isActive(server.status)) {
        items.push({
          id: `${server.id}-status`,
          hostname: server.hostname,
          message: `Server status is ${server.status || "UNKNOWN"}`,
          level: "critical",
        });
      }
      return items;
    });
  }, [servers]);

  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const text = `${server.hostname} ${server.ipAddress} ${server.environment}`
        .toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? isActive(server.status) : !isActive(server.status));
      const matchesEnvironment =
        environmentFilter === "ALL" ||
        server.environment === environmentFilter;
      return matchesQuery && matchesStatus && matchesEnvironment;
    });
  }, [servers, query, statusFilter, environmentFilter]);

  const chartData = useMemo(
    () => servers.map((s) => ({
      name: s.hostname,
      cpu: numeric(s.cpuUsage),
      memory: numeric(s.memoryUsage),
    })),
    [servers]
  );

  const save = async (form) => {
    setSaving(true);
    try {
      if (modal.server) {
        await api.updateMetrics(modal.server.id, {
          cpu: numeric(form.cpu),
          memory: numeric(form.memory),
          status: form.status,
        });
      } else {
        await api.createServer(form);
      }
      setModal(null);
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Cloud size={24} /></div>
          <div><strong>CloudOps</strong><small>MONITORING PLATFORM</small></div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)}><X /></button>
        </div>

        <div className="nav-caption">MONITORING</div>
        <a className="nav-item selected" href="#overview"><LayoutDashboard /> Overview</a>
        <a className="nav-item" href="#servers"><Server /> Infrastructure</a>
        <a className="nav-item" href="#analytics"><Activity /> Analytics</a>
        <a className="nav-item" href="#alerts"><Bell /> Alerts <span className="nav-count">{alerts.length}</span></a>

        <div className="nav-caption second-caption">PLATFORM</div>
        <a className="nav-item" href="#health"><ShieldCheck /> System health</a>
        <a className="nav-item" href="#settings"><Settings /> Settings</a>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`pulse ${health === "UP" ? "" : "pulse-red"}`} />
            <div><strong>Backend API</strong><small>{health}</small></div>
          </div>
          <div className="version">CLOUDOPSMONITOR · v2.0</div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
          <div className="topbar-heading">
            <span>WORKSPACE / MONITORING</span>
            <h1>Infrastructure Overview</h1>
          </div>
          <div className="top-actions">
            <div className="live-indicator">
              <span className={`pulse ${health === "UP" ? "" : "pulse-red"}`} />
              {health === "UP" ? "System operational" : "API unavailable"}
            </div>
            <button className={`btn-secondary refresh-btn ${loading ? "spinning" : ""}`}
              onClick={() => refresh(true)} title="Refresh data">
              <RefreshCw size={16} />
            </button>
            <button className="btn-primary" onClick={() => setModal({ server: null })}>
              <Plus size={17} /> Add server
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} /> {error}
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        <section className="welcome-row">
          <div>
            <h2>Command Center <span className="live-tag">LIVE</span></h2>
            <p>Monitor, analyze and manage your cloud infrastructure.</p>
          </div>
          <div className="refresh-control">
            <label><input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto refresh</label>
            <span>Every 10 seconds</span>
          </div>
        </section>

        <section className="kpi-grid">
          <MetricCard icon={Server} title="Total servers" value={stats.total}
            color="violet" description="Registered infrastructure" />
          <MetricCard icon={CheckCircle2} title="Healthy servers" value={stats.active}
            color="green" description={`${stats.inactive} inactive or unavailable`} />
          <MetricCard icon={Cpu} title="Average CPU" value={stats.cpu.toFixed(1)}
            unit="%" color="blue" description="Current reported utilization" />
          <MetricCard icon={HardDrive} title="Average memory" value={stats.memory.toFixed(1)}
            unit="%" color="orange" description="Current reported utilization" />
        </section>

        <section className="content-grid" id="analytics">
          <article className="panel chart-panel">
            <div className="panel-header">
              <div><span className="eyebrow">RESOURCE ANALYTICS</span><h3>CPU utilization</h3></div>
              <span className="chart-unit">PERCENT (%)</span>
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={245}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#987cff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#987cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#263047" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#8792a8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#8792a8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#151e2e", border: "1px solid #39445b", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="cpu" stroke="#a28cff"
                    fill="url(#cpuFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="chart-empty">No CPU metrics available.</div>}
          </article>

          <article className="panel chart-panel">
            <div className="panel-header">
              <div><span className="eyebrow">RESOURCE ANALYTICS</span><h3>Memory utilization</h3></div>
              <span className="chart-unit">PERCENT (%)</span>
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={245}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ramFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38d5a4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38d5a4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#263047" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#8792a8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#8792a8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#151e2e", border: "1px solid #39445b", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="memory" stroke="#38d5a4"
                    fill="url(#ramFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="chart-empty">No memory metrics available.</div>}
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel inventory-panel" id="servers">
            <div className="panel-header inventory-header">
              <div><span className="eyebrow">RESOURCE MANAGEMENT</span><h3>Server inventory</h3></div>
              <span className="record-count">{filteredServers.length} RECORDS</span>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search size={16} />
                <input placeholder="Search hostname or IP..."
                  value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}>
                <option value="ALL">All environments</option>
                {[...new Set(servers.map((s) => s.environment).filter(Boolean))].map((env) =>
                  <option key={env} value={env}>{env}</option>
                )}
              </select>
            </div>

            <div className="table-scroll">
              <table>
                <thead><tr>
                  <th>SERVER</th><th>ENVIRONMENT</th><th>CPU</th>
                  <th>MEMORY</th><th>STATUS</th><th>ACTION</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="empty-row">Loading infrastructure...</td></tr>
                  ) : filteredServers.length ? filteredServers.map((server) => (
                    <tr key={server.id}>
                      <td><div className="host-cell">
                        <span className="host-icon"><Server size={16} /></span>
                        <div><strong>{server.hostname}</strong><small>{server.ipAddress}</small></div>
                      </div></td>
                      <td><span className="environment-chip">{server.environment}</span></td>
                      <td><div className="usage-cell">{numeric(server.cpuUsage).toFixed(1)}%<Progress value={server.cpuUsage} color="purple" /></div></td>
                      <td><div className="usage-cell">{numeric(server.memoryUsage).toFixed(1)}%<Progress value={server.memoryUsage} color="green" /></div></td>
                      <td><Status status={server.status} /></td>
                      <td><button className="edit-btn" onClick={() => setModal({ server })}>Manage</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="empty-row">
                      {servers.length ? "No servers match your filters." : "No servers registered yet."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="panel alert-panel" id="alerts">
            <div className="panel-header">
              <div><span className="eyebrow">OBSERVABILITY</span><h3>System alerts</h3></div>
              <span className="alert-count">{alerts.length}</span>
            </div>
            <div className="alert-list">
              {alerts.length ? alerts.slice(0, 8).map((alert) => (
                <div className="alert-item" key={alert.id}>
                  <span className={`alert-icon ${alert.level}`}>
                    <AlertTriangle size={16} />
                  </span>
                  <div><strong>{alert.hostname}</strong><p>{alert.message}</p></div>
                </div>
              )) : (
                <div className="no-alerts">
                  <CheckCircle2 size={28} />
                  <strong>All clear</strong>
                  <span>No threshold alerts detected.</span>
                </div>
              )}
            </div>
            <div className="alert-footnote">CPU threshold: 80% · Memory threshold: 85%</div>
          </aside>
        </section>

        <section className="system-footer" id="health">
          <div><Signal size={16} /><span>Backend service</span><strong>{health}</strong></div>
          <div><Database size={16} /><span>Data source</span><strong>PostgreSQL API</strong></div>
          <div><Gauge size={16} /><span>Refresh interval</span><strong>{autoRefresh ? "10 seconds" : "Paused"}</strong></div>
          <div><Zap size={16} /><span>Last sync</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Waiting..."}</strong></div>
        </section>

        <footer className="footer">
          <span>CloudOpsMonitor · Infrastructure observability platform</span>
          <span>React · Spring Boot · PostgreSQL</span>
        </footer>
      </main>

      {modal && <Modal server={modal.server} saving={saving}
        onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

