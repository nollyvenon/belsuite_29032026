import React from 'react';

// Example user roles - update as needed
const userRoles = [
  {
    name: 'Admin',
    description: 'Full access to all features, user management, and system settings.',
    features: [
      'Manage users and roles',
      'Access all modules',
      'View analytics and reports',
      'Configure system settings',
    ],
    howTos: [
      'Go to the Admin Dashboard to manage users.',
      'Access system settings from the sidebar.',
    ],
  },
  {
    name: 'Manager',
    description: 'Manage teams, projects, and view reports.',
    features: [
      'Create and manage teams',
      'Assign roles to team members',
      'View project analytics',
    ],
    howTos: [
      'Navigate to Teams to add or remove members.',
      'Use the Projects tab to manage ongoing work.',
    ],
  },
  {
    name: 'Member',
    description: 'Participate in projects and collaborate with teams.',
    features: [
      'Access assigned projects',
      'Collaborate with team members',
      'Submit work for approval',
    ],
    howTos: [
      'Check your dashboard for assigned tasks.',
      'Use the chat to communicate with your team.',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to view content and reports.',
    features: [
      'View reports and analytics',
      'Browse project documentation',
    ],
    howTos: [
      'Go to the Reports section for analytics.',
      'Browse documentation from the Docs page.',
    ],
  },
];

const DocsPage = () => (
  <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
    <h1>User Account Types & Features</h1>
    <p>This page describes all user account types, their features, and how to use them.</p>
    {userRoles.map((role) => (
      <section key={role.name} style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
        <h2>{role.name}</h2>
        <p><em>{role.description}</em></p>
        <h3>Features</h3>
        <ul>
          {role.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <h3>How To</h3>
        <ul>
          {role.howTos.map((howto) => (
            <li key={howto}>{howto}</li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default DocsPage;
