// src/pages/Budget.jsx
import React from 'react';
import Layout from '../components/Layout';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import '../components/Budget.css';

const CHART = [
  { name: 'Wellness Committee',                    value: 8000 },
  { name: 'Career Development Committee',          value: 7000 },
  { name: 'Reels Committee',                       value: 6000 },
  { name: 'Class Giving Committee',                value: 6500 },
  { name: 'Social Committee',                      value: 15000 },
  { name: 'Diversity, Equity & Inclusion Committee', value: 7500 },
];

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
  return (
    <Layout>
      <h1 className="budget-title">Budget</h1>

      <div className="budget-header-row">
        <div />
        <button className="btn-primary">Add Funds</button>
      </div>

      <div className="budget-grid">
        {/* LEFT column: Pie Chart */}
        <div className="card">
          <h2 className="card-title">Budget Breakdown by Committee</h2>
          <div className="chart-flex">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={CHART}
                  dataKey="value"
                  outerRadius={110}
                  innerRadius={70}
                  labelLine={false}
                  label={SliceLabel}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {CHART.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <ul className="legend-list">
              {CHART.map((d, i) => (
                <li key={d.name}><span style={{ background: COLORS[i] }} />{d.name}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT column: Allocation Table */}
        <div className="card">
          <h2 className="card-title">Budget Allocation</h2>
          <p className="alloc-total">Total Allocated Budget: <strong>$50,000</strong></p>

          <table className="alloc-table">
            <tbody>
              {CHART.map(row => (
                <tr key={row.name}>
                  <td className="alloc-name">{row.name}</td>
                  <td className="alloc-amount">${row.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}


// import React from 'react';
// import Layout from '../components/Layout';
// import {
//   PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
// } from 'recharts';
// import '../components/Budget.css';

// const CHART = [
//   { name: 'Used budget', value: 37000 },
//   { name: 'Unused budget', value: 13000 },
// ];
// const COLORS = ['#1e3a8a', '#93bbf9'];

// const SliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
//   const R = Math.PI / 180;
//   const r = innerRadius + (outerRadius - innerRadius) * 0.5;
//   const x = cx + r * Math.cos(-midAngle * R);
//   const y = cy + r * Math.sin(-midAngle * R);
//   return (
//     <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12">
//       {(percent * 100).toFixed(0)}%
//     </text>
//   );
// };

// export default function Budget() {
//   return (
//     <Layout>
//       <h1 className="budget-title">Budget</h1>

//       <div className="budget-header-row">
//         <div />
//         <button className="btn-primary">Add Funds</button>
//       </div>

//       <div className="budget-grid">
//         {/* LEFT column */}
//         <div className="left-col">
//           <div className="card">
//             <h2 className="card-title">Budget Overview</h2>
//             <div className="chart-flex">
//               <ResponsiveContainer width={260} height={260}>
//                 <PieChart>
//                   <Pie
//                     data={CHART}
//                     dataKey="value"
//                     outerRadius={110}
//                     innerRadius={70}
//                     labelLine={false}
//                     label={SliceLabel}
//                   >
//                     {CHART.map((_, i) => (
//                       <Cell key={i} fill={COLORS[i]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>

//               <ul className="legend-list">
//                 {CHART.map((d, i) => (
//                   <li key={d.name}><span style={{ background: COLORS[i] }} />{d.name}</li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT column – now contains Budget Allocation */}
//         <div className="card">
//           <h2 className="card-title">Budget Allocation</h2>
//           <p className="alloc-total">Total Allocated Budget: <strong>$50,000</strong></p>

//           <table className="alloc-table">
//             <tbody>
//               {[
//                 { committee: 'Wellness Committee', amount: '$8,000' },
//                 { committee: 'Career Development Committee', amount: '$7,000' },
//                 { committee: 'Reels Committee', amount: '$6,000' },
//                 { committee: 'Class Giving Committee', amount: '$6,500' },
//                 { committee: 'Social Committee', amount: '$15,000' },
//                 { committee: 'Diversity, Equity & Inclusion Committee', amount: '$7,500' }
//               ].map(row => (
//                 <tr key={row.committee}>
//                   <td className="alloc-name">{row.committee}</td>
//                   <td className="alloc-amount">{row.amount}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </Layout>
//   );
// }
