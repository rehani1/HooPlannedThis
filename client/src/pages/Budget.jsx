import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';
import '../components/Budget.css';

// Placeholder static transactions (replace with API-driven data as needed)
const TRANSACTIONS = [
  { date: '4/14/2026', committee: 'Social', description: 'Venue', amount: '$2,500.00', type: 'Expense' },
  { date: '4/13/2026', committee: 'DEI', description: 'Snacks', amount: '$420.00', type: 'Expense' },
  { date: '4/12/2026', committee: 'Wellness', description: 'Speaker', amount: '$750.00', type: 'Expense' },
  { date: '4/11/2026', committee: 'DEI', description: 'Equipment', amount: '$610.00', type: 'Expense' },
  { date: '4/10/2026', committee: 'Career', description: 'Catering', amount: '$350.00', type: 'Expense' },
  { date: '4/10/2026', committee: 'Reels', description: 'Software', amount: '$60.00', type: 'Expense' },
  { date: '4/09/2026', committee: 'Giving', description: 'Banner', amount: '$100.00', type: 'Expense' },
  { date: '4/06/2026', committee: 'Reels', description: 'Camera', amount: '$300.00', type: 'Expense' },
  { date: '4/01/2026', committee: 'Giving', description: 'Ads', amount: '$300.00', type: 'Expense' },
  { date: '3/29/2026', committee: 'Social', description: 'Decor', amount: '$890.00', type: 'Expense' },
  { date: '3/29/2026', committee: 'Wellness', description: 'Supplies', amount: '$200.00', type: 'Expense' },
  { date: '3/27/2026', committee: 'DEI', description: 'Venue', amount: '$1,200.00', type: 'Expense' },
];

// Label renderer for pie slices
const SliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Separate component for the chart
function PieChartSection({ data }) {
  const COLORS = ['#1e3a8a', '#93bbf9'];
  return (
    <div className="card">
      <h2 className="card-title">Budget Overview</h2>
      <div className="chart-flex">
        <ResponsiveContainer width={260} height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={110}
              innerRadius={70}
              labelLine={false}
              label={SliceLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <ul className="legend-list">
          {data.map((d, i) => (
            <li key={d.name}>
              <span style={{ background: COLORS[i] }} />
              {d.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Budget() {
  // pagination state
  const [rows, setRows] = useState(5);
  const [page, setPage] = useState(1);

  // real budget state
  const [chartData, setChartData] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const pages = Math.ceil(TRANSACTIONS.length / rows);
  const slice = TRANSACTIONS.slice((page - 1) * rows, page * rows);

  useEffect(() => {
    async function fetchBudget() {
      try {
        // overview endpoint
        const ov = await fetch('/api/budget/overview');
        const { budget_total, budget_used } = await ov.json();
        setChartData([
          { name: 'Used budget', value: Number(budget_used) },
          { name: 'Unused budget', value: Number(budget_total) - Number(budget_used) },
        ]);

        // allocations endpoint
        const al = await fetch('/api/budget/allocations');
        const data = await al.json();
        setAllocations(data);
      } catch (e) {
        console.error('Failed to load budget data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchBudget();
  }, []);

  if (loading) {
    return (
      <Layout>
        <p>Loading budget...</p>
      </Layout>
    );
  }

  // compute total allocated for display
  const totalAllocated = allocations.reduce((sum, c) => sum + Number(c.committee_budget), 0);

  return (
    <Layout>
      <h1 className="budget-title">Budget</h1>
      <div className="budget-header-row">
        <div />
        <button className="btn-primary">Add Funds</button>
      </div>

      <div className="budget-grid">
        <div className="left-col">
          {/* live chart */}
          {chartData && <PieChartSection data={chartData} />}

          {/* live allocations */}
          <div className="card">
            <h2 className="card-title">Budget Allocation</h2>
            <p className="alloc-total">
              Total Allocated Budget: <strong>${totalAllocated.toLocaleString()}</strong>
            </p>
            <table className="alloc-table">
              <tbody>
                {allocations.map(c => (
                  <tr key={c.committee_id}>
                    <td className="alloc-name">{c.committee_name}</td>
                    <td className="alloc-amount">
                      ${Number(c.committee_budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* transactions & pager (unchanged) */}
        <div className="card">
          <h2 className="card-title">Recent Transactions</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Committee</th>
                  <th>Description</th>
                  <th>Amount ($)</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>{t.committee}</td>
                    <td>{t.description}</td>
                    <td>{t.amount}</td>
                    <td>{t.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <select
              value={rows}
              onChange={e => {
                setRows(+e.target.value);
                setPage(1);
              }}
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
            </select>

            <div className="pager-buttons">
              <span>
                {(page - 1) * rows + 1}-{Math.min(page * rows, TRANSACTIONS.length)} of {TRANSACTIONS.length}
              </span>
              <button disabled={page === 1} onClick={() => setPage(1)}>
                <ChevronFirst size={16} />
              </button>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </button>
              <button disabled={page === pages} onClick={() => setPage(pages)}>
                <ChevronLast size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
