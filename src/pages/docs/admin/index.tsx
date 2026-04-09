import React from 'react';

const adminFeatures = [
  'Manage users and roles',
  'Access all modules',
  'View analytics and reports',
  'Configure system settings',
];

const adminHowTos = [
  'Go to the Admin Dashboard to manage users.',
  'Access system settings from the sidebar.',
];

const AdminDocsPage = () => (
  <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
    <h1>Admin Documentation</h1>
    <p><em>Full access to all features, user management, and system settings.</em></p>
    <h2>Features</h2>
    <ul>
      {adminFeatures.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
    <h2>How To</h2>
    <ul>
      {adminHowTos.map((howto) => (
        <li key={howto}>{howto}</li>
      ))}
    </ul>
  </div>
);

export default AdminDocsPage;
