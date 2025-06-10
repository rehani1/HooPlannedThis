import React from 'react';
import Layout from '../components/Layout';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Used budget', value: 37000 },
  { name: 'Unused budget', value: 13000 },
];

const COLORS = ['#003366', '#7b9acc'];

const transactions = [
  { date: '4/14/2026', committee: 'Social', description: 'Venue', amount: '$2,500.00', type: 'Expense' },
  { date: '4/13/2026', committee: 'DEI', description: 'Snacks', amount: '$420.00', type: 'Expense' },
  { date: '4/12/2026', committee: 'Wellness', description: 'Speaker', amount: '$750.00', type: 'Expense' },
  { date: '4/11/2026', committee: 'DEI', description: 'Equipment', amount: '$610.00', type: 'Expense' },
  { date: '4/10/2026', committee: 'Career', description: 'Catering', amount: '$350.00', type: 'Expense' },
];

const Budget = () => {
  return (
    <Layout>
      <div className="p-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">Budget</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Budget Overview Chart */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Budget Overview</h2>
            <PieChart width={300} height={300}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Transactions Table */}
          <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Recent Transactions</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Committee</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Amount ($)</th>
                  <th className="py-2 px-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{t.date}</td>
                    <td className="py-2 px-3">{t.committee}</td>
                    <td className="py-2 px-3">{t.description}</td>
                    <td className="py-2 px-3">{t.amount}</td>
                    <td className="py-2 px-3">{t.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocation Summary */}
        <div className="bg-white p-6 rounded-xl shadow max-w-xl">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Budget Allocation</h2>
          <p>Total Allocated Budget: <strong>$50,000</strong></p>
          <p className="mt-3 font-medium text-gray-700">By Committee:</p>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-800">
            <li>Wellness Committee: $8,000</li>
            <li>Career Development Committee: $7,000</li>
            <li>Reels Committee: $6,000</li>
            <li>Class Giving Committee: $6,500</li>
            <li>Social Committee: $15,000</li>
            <li>Diversity, Equity, and Inclusion Committee: $7,500</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Budget;
