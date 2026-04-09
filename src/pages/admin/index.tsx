import React from 'react';
import Link from 'next/link';

const AdminDashboard = () => (
  <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
    <h1>Admin Dashboard</h1>
    <ul style={{ fontSize: 18 }}>
      <li>
        <Link href="/content-studio/admin">AI Content Studio Admin</Link>
      </li>
      {/* Add more admin links here as needed */}
    </ul>
  </div>
);

export default AdminDashboard;
