// src/pages/Budget.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import '../components/Budget.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const COLORS = ['#003e83', '#ff8937', '#2f855a', '#805ad5', '#0f766e', '#b7791f', '#475569', '#dc2626'];

function classLabel(value) {
  const labels = {
    first: 'First-Year Council',
    second: 'Second-Year Council',
    third: 'Third-Year Council',
    trustees: 'Trustees',
  };
  return labels[value] || value || 'Council';
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function getStatus(row) {
  const budget = Number(row.budgetAllocated || 0);
  const planned = Number(row.plannedEventBudget || 0);
  const actual = Number(row.actualSpent || 0);

  if (budget <= 0 && (planned > 0 || actual > 0)) return { label: 'Unbudgeted', tone: 'warn' };
  if (budget > 0 && actual > budget) return { label: 'Over spent', tone: 'danger' };
  if (budget > 0 && planned > budget) return { label: 'Over planned', tone: 'danger' };
  if (budget > 0 && planned >= budget * 0.85) return { label: 'Watch', tone: 'warn' };
  return { label: 'On track', tone: 'ok' };
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildSummary(overview) {
  return {
    totalBudget: Number(overview.totalBudget || 0),
    committeeAllocated: Number(overview.committeeAllocated || 0),
    eventPlanned: Number(overview.eventPlanned || 0),
    actualSpent: Number(overview.actualSpent || 0),
    unallocated: Number(overview.unallocated || 0),
    remainingAfterPlanned: Number(overview.remainingAfterPlanned || 0),
  };
}

function BudgetMetric({ label, value, detail, tone = '' }) {
  return (
    <article className={`budget-metric ${tone}`}>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function AllocationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="budget-tooltip">
      <strong>{data.name}</strong>
      <span>{formatCurrency(data.value)}</span>
    </div>
  );
}

export default function Budget() {
  const [overview, setOverview] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBudget = async () => {
    setLoading(true);
    setError('');

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        throw new Error('Login required to view your class budget');
      }

      const [overviewRes, allocationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/budget/overview`, { headers: { Accept: 'application/json', ...authHeaders } }),
        fetch(`${API_BASE}/api/budget/allocations`, { headers: { Accept: 'application/json', ...authHeaders } }),
      ]);

      const overviewData = await overviewRes.json().catch(() => ({}));
      const allocationsData = await allocationsRes.json().catch(() => ({}));
      if (!overviewRes.ok) throw new Error(overviewData.message || `Budget overview request failed ${overviewRes.status}`);
      if (!allocationsRes.ok) throw new Error(allocationsData.message || `Budget allocations request failed ${allocationsRes.status}`);

      setOverview(overviewData);
      setAllocations(Array.isArray(allocationsData) ? allocationsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const classScopeLabel = overview
    ? `${classLabel(overview.className)} (${overview.academicYear})`
    : 'Your Class Council';
  const summary = useMemo(() => buildSummary(overview || {}), [overview]);

  const chartData = useMemo(() => (
    allocations
      .map(row => ({
        name: row.committeeName,
        value: Number(row.budgetAllocated || 0),
      }))
      .filter(row => row.value > 0)
      .sort((a, b) => b.value - a.value)
  ), [allocations]);

  const tableRows = useMemo(() => (
    [...allocations].sort((a, b) =>
      Number(b.budgetAllocated || 0) - Number(a.budgetAllocated || 0)
    )
  ), [allocations]);
  const displayedEventCount = tableRows.reduce((sum, row) => sum + Number(row.eventCount || 0), 0);
  const displayedExpenseCount = tableRows.reduce((sum, row) => sum + Number(row.expenseCount || 0), 0);

  return (
    <Layout>
      <main className="budget-page">
        <header className="budget-topbar">
          <div>
            <h1 className="budget-title">Budget</h1>
            <p className="budget-subtitle">{classScopeLabel} budget, committee allocations, planned event budgets, and actual expenses.</p>
          </div>
          <div className="budget-actions">
            <span className="budget-scope">{classScopeLabel}</span>
            <button type="button" onClick={loadBudget} className="budget-refresh" disabled={loading}>
              <RefreshCw size={16} />
              {loading ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && <p className="budget-error">{error}</p>}

        <section className="budget-metrics">
          <BudgetMetric label="Council Budget" value={summary.totalBudget} detail="Your class council" />
          <BudgetMetric label="Allocated to Committees" value={summary.committeeAllocated} detail={`${tableRows.length} committees`} />
          <BudgetMetric label="Planned for Events" value={summary.eventPlanned} detail={`${displayedEventCount} event records`} tone={summary.remainingAfterPlanned < 0 ? 'danger' : ''} />
          <BudgetMetric label="Actual Expenses" value={summary.actualSpent} detail={`${displayedExpenseCount} expense rows`} />
          <BudgetMetric label="Unallocated" value={summary.unallocated} detail="Council budget not assigned to committees" tone={summary.unallocated < 0 ? 'danger' : ''} />
        </section>

        <div className="budget-main-grid">
          <section className="budget-card budget-chart-card">
            <div className="budget-card-header">
              <h2>Committee Allocation</h2>
              <span>{formatCurrency(summary.committeeAllocated)}</span>
            </div>

            {loading ? (
              <p className="budget-muted">Loading budget data...</p>
            ) : chartData.length ? (
              <div className="budget-chart-layout">
                <div className="budget-chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={78}
                        outerRadius={112}
                        paddingAngle={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<AllocationTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ol className="budget-legend">
                  {chartData.map((row, index) => (
                    <li key={row.name}>
                      <span className="budget-swatch" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{row.name}</span>
                      <strong>{formatCurrency(row.value)}</strong>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="budget-muted">No committee budget allocations have been configured yet.</p>
            )}
          </section>

          <section className="budget-card">
            <div className="budget-card-header">
              <h2>Budget Health</h2>
              <span>{formatCurrency(summary.remainingAfterPlanned)} remaining after planned events</span>
            </div>

            <div className="budget-health-list">
              {tableRows.slice(0, 6).map(row => {
                const budget = Number(row.budgetAllocated || 0);
                const planned = Number(row.plannedEventBudget || 0);
                const percent = budget > 0 ? (planned / budget) * 100 : (planned > 0 ? 100 : 0);
                const status = getStatus(row);

                return (
                  <article key={row.committeeId} className="budget-health-row">
                    <div>
                      <strong>{row.committeeName}</strong>
                      <span>{classLabel(row.className)} - {formatCurrency(planned)} planned</span>
                    </div>
                    <div className="budget-health-meter" aria-label={`${row.committeeName} planned budget use`}>
                      <span style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                    <span className={`budget-status ${status.tone}`}>{status.label}</span>
                  </article>
                );
              })}
              {!loading && !tableRows.length && <p className="budget-muted">No committees are available for your class yet.</p>}
            </div>
          </section>
        </div>

        <section className="budget-card">
          <div className="budget-card-header">
            <h2>Committee Budget Status</h2>
            <span>{tableRows.length} rows</span>
          </div>

          <div className="budget-table-wrap">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Committee</th>
                  <th>Council</th>
                  <th>Committee Budget</th>
                  <th>Planned Events</th>
                  <th>Actual Expenses</th>
                  <th>Remaining</th>
                  <th>Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => {
                  const budget = Number(row.budgetAllocated || 0);
                  const planned = Number(row.plannedEventBudget || 0);
                  const percent = budget > 0 ? (planned / budget) * 100 : 0;
                  const status = getStatus(row);

                  return (
                    <tr key={row.committeeId}>
                      <td>
                        <strong>{row.committeeName}</strong>
                        <span>{row.eventCount} events</span>
                      </td>
                      <td>{classLabel(row.className)}<span>{row.academicYear}</span></td>
                      <td>{formatCurrency(budget)}</td>
                      <td>{formatCurrency(planned)}</td>
                      <td>{formatCurrency(row.actualSpent)}</td>
                      <td className={Number(row.remainingPlanned || 0) < 0 ? 'negative' : ''}>
                        {formatCurrency(row.remainingPlanned)}
                      </td>
                      <td>{formatPercent(percent)}</td>
                      <td><span className={`budget-status ${status.tone}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
                {!loading && !tableRows.length && (
                  <tr>
                    <td colSpan="8" className="budget-empty">No budget rows found.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="8" className="budget-empty">Loading budget rows...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Layout>
  );
}
