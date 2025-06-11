// src/pages/ClassCouncil.jsx
import React from 'react';
import Layout from '../components/Layout';

/* ------------------------------------------------------------------
   1.  Dummy data ─ replace with real data / API fetch
   ------------------------------------------------------------------ */
const EXECUTIVE = [
  { role: 'President',      name: 'Jordan Lee',  phone: '(434) 555‑0120', email: 'jl4de@virginia.edu' },
  { role: 'Vice‑President', name: 'Priya Shah',  phone: '(434) 555‑0433', email: 'ps2ab@virginia.edu' },
  { role: 'Treasurer',      name: 'Alex Kim',    phone: '(434) 555‑0765', email: 'ak3cd@virginia.edu' },
  { role: 'Secretary',      name: 'Maria Lopez', phone: '(434) 555‑0998', email: 'ml7fg@virginia.edu' }
];

const COMMITTEES = [
  {
    name: 'Wellness Committee',
    members: [
      { name: 'Taylor Nguyen', chair: true,  phone: '(434) 555‑1122', email: 'tn9hh@virginia.edu' },
      { name: 'Chris Owens' },
      { name: 'Jamie Patel' }
    ]
  },
  {
    name: 'Career Development Committee',
    members: [
      { name: 'Carmen Zhao', chair: true, phone: '(434) 555‑2233', email: 'cz3in@virginia.edu' },
      { name: 'Omar Hassan' },
      { name: 'Riley Smith' },
      { name: 'Liam Davis' }
    ]
  },
  {
    name: 'Social Committee',
    members: [
      { name: 'Daniel Park', chair: true, phone: '(434) 555‑3344', email: 'dp2kl@virginia.edu' },
      { name: 'Avery Johnson' },
      { name: 'Sofia Garcia' },
      { name: 'Noah Brown' }
    ]
  }
];

/* ------------------------------------------------------------------
   2.  Shared inline‑styles
   ------------------------------------------------------------------ */
const card = {
  background   : '#fff',
  border       : '1px solid #ddd',
  borderRadius : 10,
  padding      : 20,
  marginBottom : 30,
  maxWidth     : 600          // limit width of each white box
};

/* tables: fill the card, no auto‑margins (so they’re left‑aligned) */
const tbl = {
  width          : '100%',
  borderCollapse : 'collapse'
};

const th = {
  textAlign   : 'left',
  fontWeight  : 600,
  padding     : '8px 6px',
  borderBottom: '1px solid #eee',
  color       : '#ff8937'
};

const td = {
  padding     : '8px 6px',
  borderBottom: '1px solid #eee'
};

/* ------------------------------------------------------------------
   3.  Helper for committee cards
   ------------------------------------------------------------------ */
function CommitteeCard({ committee }) {
  const sorted = [
    ...committee.members.filter(m => m.chair),
    ...committee.members.filter(m => !m.chair)
  ];

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, textAlign: 'center' }}>
        {committee.name}
      </h2>

      {/* wrapper allows horizontal scroll if names get too long */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <tbody>
            {sorted.map(m => (
              <tr key={m.name}>
                <td style={{ ...td, fontWeight: m.chair ? 700 : 400 }}>
                  {m.name}{m.chair && ' (Chair)'}
                </td>

                {m.chair ? (
                  <>
                    <td style={td}>{m.phone}</td>
                    <td style={td}>
                      <a href={`mailto:${m.email}`}>{m.email}</a>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}></td>
                    <td style={td}></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   4.  Page component
   ------------------------------------------------------------------ */
export default function ClassCouncil() {
  return (
    <Layout>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, textAlign:'center' }}>
        Class Council 2025 – 2026
      </h1>

      {/* Executive Board */}
      <div style={card}>
        <h2 style={{ margin: 0, marginBottom: 12, textAlign: 'center' }}>
          Executive Board
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Role</th>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {EXECUTIVE.map(e => (
                <tr key={e.role}>
                  <td style={td}>{e.role}</td>
                  <td style={td}>{e.name}</td>
                  <td style={td}>{e.phone}</td>
                  <td style={td}>
                    <a href={`mailto:${e.email}`}>{e.email}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Committees */}
      {COMMITTEES.map(c => (
        <CommitteeCard key={c.name} committee={c} />
      ))}
    </Layout>
  );
}



// // src/pages/ClassCouncil.jsx
// import React from 'react';
// import Layout from '../components/Layout';

// /* ------------------------------------------------------------------
//    1.  Dummy data  – replace with the real thing or fetch from your API
//    ------------------------------------------------------------------ */
// const EXECUTIVE = [
//   { role: 'President',           name: 'Jordan Lee',  phone: '(434) 555‑0120', email: 'jl4de@virginia.edu' },
//   { role: 'Vice‑President',      name: 'Priya Shah',  phone: '(434) 555‑0433', email: 'ps2ab@virginia.edu' },
//   { role: 'Treasurer',           name: 'Alex Kim',    phone: '(434) 555‑0765', email: 'ak3cd@virginia.edu' },
//   { role: 'Secretary',           name: 'Maria Lopez', phone: '(434) 555‑0998', email: 'ml7fg@virginia.edu' }
// ];

// const COMMITTEES = [
//   {
//     name: 'Wellness Committee',
//     members: [
//       { name: 'Taylor Nguyen', chair: true,  phone: '(434) 555‑1122', email: 'tn9hh@virginia.edu' },
//       { name: 'Chris Owens' },
//       { name: 'Jamie Patel' }
//     ]
//   },
//   {
//     name: 'Career Development Committee',
//     members: [
//       { name: 'Carmen Zhao', chair: true, phone: '(434) 555‑2233', email: 'cz3in@virginia.edu' },
//       { name: 'Omar Hassan' },
//       { name: 'Riley Smith' },
//       { name: 'Liam Davis' }
//     ]
//   },
//   {
//     name: 'Social Committee',
//     members: [
//       { name: 'Daniel Park', chair: true, phone: '(434) 555‑3344', email: 'dp2kl@virginia.edu' },
//       { name: 'Avery Johnson' },
//       { name: 'Sofia Garcia' },
//       { name: 'Noah Brown' }
//     ]
//   }
// ];

// /* ------------------------------------------------------------------
//    2.  Simple reusable styles
//    ------------------------------------------------------------------ */
// const card = {
//   background: '#fff',
//   border: '1px solid #ddd',
//   borderRadius: 10,
//   padding: 20,
//   marginBottom: 24,
//   width: '45%',        // or any % / px you like
//   maxWidth: 950,       // keeps it from stretching on huge screens
//   margin: '0 auto 24px',
  
// };
// const th = { textAlign: 'center', fontWeight: 600, padding: '8px 6px', borderBottom: '1px solid #eee' };
// const td = { padding: '8px 6px', borderBottom: '1px solid #eee' };

// /* ------------------------------------------------------------------
//    3.  Helper to render each committee table
//    ------------------------------------------------------------------ */
// function CommitteeCard({ committee }) {
//   const sorted = [
//     ...committee.members.filter(m => m.chair),   // chairs first
//     ...committee.members.filter(m => !m.chair)
//   ];

//   return (
//     <div style={card}>
//       <h2 style={{ margin: 0, marginBottom: 12 }}>{committee.name}</h2>
//       <table style={{ width: '50%', borderCollapse: 'collapse' }}>
//         <tbody>
//           {sorted.map(m => (
//             <tr key={m.name}>
//               <td style={{ ...td, fontWeight: m.chair ? 700 : 400 }}>
//                 {m.name}{m.chair && ' (Chair)'}
//               </td>
//               {m.chair
//                 ? (
//                   <>
//                     <td style={td}>{m.phone}</td>
//                     <td style={td}>
//                       <a href={`mailto:${m.email}`}>{m.email}</a>
//                     </td>
//                   </>
//                 ) : (
//                   /* fill the grid so chair & non‑chair rows align */
//                   <>
//                     <td style={td}></td>
//                     <td style={td}></td>
//                   </>
//                 )
//               }
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------
//    4.  Page component
//    ------------------------------------------------------------------ */
// export default function ClassCouncil() {
//   return (
//     <Layout>
//       <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24 }}>Class Council 2025 – 2026</h1>

//       {/* Executive box */}
//       <div style={card}>
//         <h2 style={{ margin: 0, marginBottom: 12 }}>Executive Board</h2>
//         <table style={{ width: '50%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr>
//               <th style={th}>Role</th>
//               <th style={th}>Name</th>
//               <th style={th}>Phone</th>
//               <th style={th}>Email</th>
//             </tr>
//           </thead>
//           <tbody>
//             {EXECUTIVE.map(e => (
//               <tr key={e.role}>
//                 <td style={td}>{e.role}</td>
//                 <td style={td}>{e.name}</td>
//                 <td style={td}>{e.phone}</td>
//                 <td style={td}>
//                   <a href={`mailto:${e.email}`}>{e.email}</a>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Each committee */}
//       {COMMITTEES.map(c => <CommitteeCard key={c.name} committee={c} />)}
//     </Layout>
//   );
// }
