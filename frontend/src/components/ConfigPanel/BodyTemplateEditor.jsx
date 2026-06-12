import React, { useState } from 'react';
import { mlService } from '../../services/api';
import { Eye, Loader2 } from 'lucide-react';

const DYNAMIC_VARS = [
  { name: '{{randomId}}', desc: '8-char random hex ID' },
  { name: '{{uuid}}', desc: 'Unique UUID v4 string' },
  { name: '{{timestamp}}', desc: 'Epoch timestamp (ms)' },
  { name: '{{isoDate}}', desc: 'ISO Date format string' },
  { name: '{{randomInt}}', desc: 'Integer between 0 and 99999' },
  { name: '{{randomEmail}}', desc: 'Simulated user email' },
  { name: '{{randomName}}', desc: 'Random full name' }
];

function BodyTemplateEditor({ body, setBody }) {
  const [previewText, setPreviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerPreview = async () => {
    setLoading(true);
    try {
      const response = await mlService.previewBody(body, {});
      setPreviewText(response.data.expanded);
    } catch (err) {
      setPreviewText('Error: Failed to process template variables.');
    }
    setLoading(false);
  };

  const insertVariable = (varName) => {
    setBody(prev => prev + varName);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        JSON Payload Body & Template Variables
      </h3>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Body Textarea Input */}
        <div style={{ flex: '2', minWidth: '300px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Request Body (JSON template format)
          </label>
          <textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{\n  "userId": "{{randomId}}",\n  "email": "{{randomEmail}}",\n  "amount": {{randomInt}}\n}'
            style={{
              width: '100%',
              height: '180px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Right Side: Quick Variable Inject List */}
        <div style={{ flex: '1.2', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Dynamic Template Macros
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.02)',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)'
          }}>
            {DYNAMIC_VARS.map(v => (
              <div 
                key={v.name}
                onClick={() => insertVariable(v.name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  border: '1px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <code style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{v.name}</code>
                <span style={{ color: 'var(--text-secondary)' }}>{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Preview Section */}
      <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '20px', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview Body Output</span>
          <button 
            type="button" 
            onClick={triggerPreview}
            disabled={loading || !body}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--accent-cyan)',
              background: 'var(--accent-cyan-glow)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 'var(--radius-sm)',
              cursor: (!body || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
            <span>Generate Preview</span>
          </button>
        </div>
        
        {previewText && (
          <pre style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {previewText}
          </pre>
        )}
      </div>
    </div>
  );
}

export default BodyTemplateEditor;
