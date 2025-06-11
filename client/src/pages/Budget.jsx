import React, { useState } from 'react';
import Layout from '../components/Layout';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';
import '../components/Budget.css';          /*  ← ADD THIS LINE */

const CHART = [
  { name: 'Used budget',   value: 37000 },
  { name: 'Unused budget', value: 13000 },
];
const COLORS = ['#1e3a8a', '#93bbf9'];

const TRANSACTIONS = [
  { date:'4/14/2026', committee:'Social',   description:'Venue',    amount:'$2,500.00', type:'Expense' },
  { date:'4/13/2026', committee:'DEI',      description:'Snacks',   amount:'$420.00',   type:'Expense' },
  { date:'4/12/2026', committee:'Wellness', description:'Speaker',  amount:'$750.00',   type:'Expense' },
  { date:'4/11/2026', committee:'DEI',      description:'Equipment',amount:'$610.00',   type:'Expense' },
  { date:'4/10/2026', committee:'Career',   description:'Catering', amount:'$350.00',   type:'Expense' },
  { date:'4/10/2026', committee:'Reels',    description:'Software', amount:'$60.00',    type:'Expense' },
  { date:'4/09/2026', committee:'Giving',   description:'Banner',   amount:'$100.00',   type:'Expense' },
  { date:'4/06/2026', committee:'Reels',    description:'Camera',   amount:'$300.00',   type:'Expense' },
  { date:'4/01/2026', committee:'Giving',   description:'Ads',      amount:'$300.00',   type:'Expense' },
  { date:'3/29/2026', committee:'Social',   description:'Decor',    amount:'$890.00',   type:'Expense' },
  { date:'3/29/2026', committee:'Wellness', description:'Supplies', amount:'$200.00',   type:'Expense' },
  { date:'3/27/2026', committee:'DEI',      description:'Venue',    amount:'$1,200.00', type:'Expense' },
];

const ALLOC_LINES = [
  'Wellness Committee: $8,000',
  'Career Development Committee: $7,000',
  'Reels Committee: $6,000',
  'Class Giving Committee: $6,500',
  'Social Committee: $15,000',
  'Diversity, Equity, and Inclusion Committee: $7,500',
];

const SliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function Budget() {
  /* pagination */
  const [rows, setRows] = useState(5);
  const [page, setPage] = useState(1);
  const pages = Math.ceil(TRANSACTIONS.length / rows);
  const slice = TRANSACTIONS.slice((page - 1) * rows, page * rows);

  return (
    <Layout>
      {/* everything below sits inside .page-content from your Layout */}
      <h1 className="budget-title">Budget</h1>

      {/* HEADER ROW (title + button) */}
      <div className="budget-header-row">
        <div />
        <button className="btn-primary">Add Funds</button>
      </div>

      {/* MAIN GRID */}
      <div className="budget-grid">
        {/* LEFT column */}
        <div className="left-col">
          {/* Chart card */}
          <div className="card">
            <h2 className="card-title">Budget Overview</h2>
            <div className="chart-flex">
              <ResponsiveContainer width={260} height={260}>
                <PieChart>
                  <Pie
                    data={CHART}
                    dataKey="value"
                    outerRadius={110}
                    innerRadius={70}
                    labelLine={false}
                    label={SliceLabel}
                  >
                    {CHART.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {/* <Legend /> */}
                </PieChart>
              </ResponsiveContainer>

              <ul className="legend-list">
                {CHART.map((d, i) => (
                  <li key={d.name}><span style={{ background: COLORS[i] }} />{d.name}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Allocation card */}
          {/* <div className="card">
            <h2 className="card-title">Budget Allocation</h2>
            <p className="bold">Total Allocated Budget: $50,000</p>
            <p className="subtitle">By Committee:</p>
            <ul className="alloc-list">
              {ALLOC_LINES.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div> */}
          <div className="card">
            <h2 className="card-title">Budget Allocation</h2>
            <p className="alloc-total">Total Allocated Budget: <strong>$50,000</strong></p>

             {/* allocation table */}
            <table className="alloc-table">
                <tbody>
                {[
                    { committee: 'Wellness Committee',                    amount: '$8,000' },
                    { committee: 'Career Development Committee',          amount: '$7,000' },
                    { committee: 'Reels Committee',                       amount: '$6,000' },
                    { committee: 'Class Giving Committee',                amount: '$6,500' },
                    { committee: 'Social Committee',                      amount: '$15,000'},
                    { committee: 'Diversity, Equity & Inclusion Committee', amount: '$7,500'}
                ].map(row => (
                    <tr key={row.committee}>
                    <td className="alloc-name">{row.committee}</td>
                    <td className="alloc-amount">{row.amount}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>

        {/* RIGHT column */}
        <div className="card">
          <h2 className="card-title">Recent Transactions</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Committee</th><th>Description</th>
                  <th>Amount ($)</th><th>Type</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td><td>{t.committee}</td><td>{t.description}</td>
                    <td>{t.amount}</td><td>{t.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="pager">
            <select value={rows} onChange={(e)=>{setRows(+e.target.value); setPage(1);}}>
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
            </select>

            <div className="pager-buttons">
              <span>{(page-1)*rows+1}-{Math.min(page*rows,TRANSACTIONS.length)} of {TRANSACTIONS.length}</span>
              <button disabled={page===1}  onClick={()=>setPage(1)}><ChevronFirst size={16}/></button>
              <button disabled={page===1}  onClick={()=>setPage(p=>p-1)}><ChevronLeft  size={16}/></button>
              <button disabled={page===pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button>
              <button disabled={page===pages} onClick={()=>setPage(pages)}><ChevronLast size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
