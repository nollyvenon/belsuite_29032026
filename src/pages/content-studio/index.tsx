import React, { useState } from 'react';

const ContentStudio = () => {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [keywords, setKeywords] = useState('');
  const [metaTags, setMetaTags] = useState('');
  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Example: fetch templates from API (stub)
  const templates = [
    { id: 'blog', name: 'Blog Post' },
    { id: 'ad', name: 'Ad Copy' },
    { id: 'social', name: 'Social Post' },
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    // Call backend API
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: template,
        title,
        keywords: keywords.split(','),
        metaTags: metaTags.split(','),
        tone,
        style,
        language,
      }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    setStep(3);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
      <h1>AI Content Studio</h1>
      <ol style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <li style={{ fontWeight: step === 1 ? 'bold' : 'normal' }}>1. Select Template</li>
        <li style={{ fontWeight: step === 2 ? 'bold' : 'normal' }}>2. Enter Details</li>
        <li style={{ fontWeight: step === 3 ? 'bold' : 'normal' }}>3. Result</li>
      </ol>
      {step === 1 && (
        <form onSubmit={() => setStep(2)}>
          <label>Template:<br />
            <select value={template} onChange={e => setTemplate(e.target.value)} required>
              <option value="">Select...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <br /><br />
          <button type="submit" disabled={!template}>Next</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleGenerate}>
          <label>Title:<br />
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label><br /><br />
          <label>Keywords (comma separated):<br />
            <input value={keywords} onChange={e => setKeywords(e.target.value)} />
          </label><br /><br />
          <label>Meta Tags (comma separated):<br />
            <input value={metaTags} onChange={e => setMetaTags(e.target.value)} />
          </label><br /><br />
          <label>Tone:<br />
            <input value={tone} onChange={e => setTone(e.target.value)} />
          </label><br /><br />
          <label>Style:<br />
            <input value={style} onChange={e => setStyle(e.target.value)} />
          </label><br /><br />
          <label>Language:<br />
            <input value={language} onChange={e => setLanguage(e.target.value)} />
          </label><br /><br />
          <button type="button" onClick={() => setStep(1)}>Back</button>
          <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
        </form>
      )}
      {step === 3 && result && (
        <div>
          <h2>Generated Content</h2>
          <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
            <strong>Title:</strong> {result.title || title}<br />
            <strong>Body:</strong>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{result.body}</div>
            <br />
            <strong>SEO Score:</strong> {result.seoScore}
          </div>
          <button style={{ marginTop: 24 }} onClick={() => setStep(1)}>Create Another</button>
        </div>
      )}
    </div>
  );
};

export default ContentStudio;
