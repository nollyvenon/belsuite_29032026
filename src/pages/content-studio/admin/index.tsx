import React, { useEffect, useState } from 'react';

const AdminContentStudio = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', type: '', language: 'en', prompt: '' });
  const [editingId, setEditingId] = useState(null);

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: '', description: '', type: '', language: 'en', prompt: '' });
    setEditingId(null);
    fetchTemplates();
  };

  const handleEdit = (tpl) => {
    setForm({
      name: tpl.name,
      description: tpl.description,
      type: tpl.type,
      language: tpl.language,
      prompt: tpl.prompt,
    });
    setEditingId(tpl.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1>Content Studio Admin</h1>
      <h2>Template Management</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required style={{ marginRight: 8 }} />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ marginRight: 8 }} />
        <input name="type" value={form.type} onChange={handleChange} placeholder="Type (blog, ad, etc)" required style={{ marginRight: 8 }} />
        <input name="language" value={form.language} onChange={handleChange} placeholder="Language (en, es, etc)" style={{ width: 80, marginRight: 8 }} />
        <input name="prompt" value={form.prompt} onChange={handleChange} placeholder="Prompt Template" required style={{ width: 200, marginRight: 8 }} />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setForm({ name: '', description: '', type: '', language: 'en', prompt: '' }); setEditingId(null); }}>Cancel</button>}
      </form>
      {loading ? <div>Loading templates...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Language</th>
              <th>Prompt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(tpl => (
              <tr key={tpl.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{tpl.name}</td>
                <td>{tpl.description}</td>
                <td>{tpl.type}</td>
                <td>{tpl.language}</td>
                <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.prompt}</td>
                <td>
                  <button onClick={() => handleEdit(tpl)}>Edit</button>
                  <button onClick={() => handleDelete(tpl.id)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminContentStudio;
