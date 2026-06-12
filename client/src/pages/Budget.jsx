// src/pages/Budget.jsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import '../components/Budget.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const COLORS = ['#1e3a8a', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

const SliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function Budget() {
  const [chartData, setChartData] = useState([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBudget() {
      try {
        const [overviewRes, allocationsRes] = await Promise.all([
          fetch(`${API_BASE}/api/budget/overview`, { headers: { Accept: 'application/json' } }),
          fetch(`${API_BASE}/api/budget/allocations`, { headers: { Accept: 'application/json' } })
        ]);

        if (!overviewRes.ok) throw new Error(`Budget overview failed: ${overviewRes.status}`);
        if (!allocationsRes.ok) throw new Error(`Budget allocations failed: ${allocationsRes.status}`);

        const overview = await overviewRes.json();
        const allocations = await allocationsRes.json();

        setTotalAllocated(Number(overview.totalAllocated) || 0);
        setChartData(
          allocations.map(row => ({
            name: row.committeeName || `Committee ${row.committeeId}`,
            value: Number(row.allocated) || 0
          }))
        );
      } catch (err) {
        setError(err.message || 'Failed to load budget');
      } finally {
        setLoading(false);
      }
    }

    loadBudget();
  }, []);

  return (
    <Layout>
      <h1 className="budget-title">Budget</h1>

      <div className="budget-header-row">
        <div />
        <button className="btn-primary" disabled>Add Funds</button>
      </div>

      {loading && <p>Loading budget...</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {!loading && !error && chartData.length === 0 && <p>No budget allocations found.</p>}

      {!loading && !error && chartData.length > 0 && (
      <div className="budget-grid">
        {/* LEFT column: Pie Chart */}
        <div className="card">
          <h2 className="card-title">Budget Breakdown by Committee</h2>
          <div className="chart-flex">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={110}
                  innerRadius={70}
                  labelLine={false}
                  label={SliceLabel}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {chartData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <ul className="legend-list">
              {chartData.map((d, i) => (
                <li key={d.name}><span style={{ background: COLORS[i] }} />{d.name}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT column: Allocation Table */}
        <div className="card">
          <h2 className="card-title">Budget Allocation</h2>
          <p className="alloc-total">
            Total Allocated Budget: <strong>${totalAllocated.toLocaleString()}</strong>
          </p>

          <table className="alloc-table">
            <tbody>
              {chartData.map(row => (
                <tr key={row.name}>
                  <td className="alloc-name">{row.name}</td>
                  <td className="alloc-amount">${row.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </Layout>
  );
}
