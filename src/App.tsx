import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronDown, Clipboard,
  Cpu, ExternalLink, Factory, FileText, FlaskConical, HelpCircle, Info,
  Layers3, MapPin, Monitor, Package, Printer, QrCode, ScanLine, Search,
  ShieldCheck, Sofa, Truck, X, Zap,
} from 'lucide-react';
import sampleData from './data/samples.json';

type Sample = typeof sampleData[number];
const samples: Sample[] = sampleData;
const types = [...new Set(samples.map(sample => sample.type))];
const icons = { 'Plant & Machinery': Factory, 'Laboratory Equipment': FlaskConical, 'Electrical Equipment': Zap, 'Office equipment': Monitor, 'IT Equipment': Cpu, 'Furniture & Fixtures': Sofa, Vehicles: Truck };
const fields: { key: keyof Sample; label: string; group: string }[] = [
  { key: 'code', label: 'Asset code', group: 'Identification' },
  { key: 'name', label: 'Asset name', group: 'Identification' },
  { key: 'poNumber', label: 'PO number', group: 'Procurement' },
  { key: 'vendorCode', label: 'Vendor code', group: 'Procurement' },
  { key: 'vendorName', label: 'Vendor name', group: 'Procurement' },
  { key: 'location', label: 'Asset location', group: 'Location' },
  { key: 'costCenter', label: 'Cost center', group: 'Location' },
  { key: 'quantity', label: 'Quantity', group: 'Lifecycle' },
  { key: 'usefulLife', label: 'Useful life', group: 'Lifecycle' },
  { key: 'capitalizationDate', label: 'Capitalization date', group: 'Lifecycle' },
];

function TypeIcon({ type, size = 20 }: { type: string; size?: number }) {
  const Icon = icons[type as keyof typeof icons] || Package;
  return <Icon size={size} strokeWidth={1.7} />;
}

function valueOf(sample: Sample, key: keyof Sample) {
  const value = sample[key];
  if (key === 'capitalizationDate') return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  if (key === 'usefulLife') return `${value} years`;
  return value || 'Not provided';
}

function publicOrigin() {
  const configured = import.meta.env.VITE_PUBLIC_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (['http:', 'https:'].includes(url.protocol)) return url.origin;
    } catch { /* Use the current deployment when the optional origin is invalid. */ }
  }
  return window.location.origin;
}

function Brand() {
  return <a className="brand" href="/" aria-label="Brady asset samples home"><span className="brand-mark"><QrCode size={23} strokeWidth={2} /></span><span>brady<span className="brand-dot">.</span></span></a>;
}

function Details({ sample }: { sample: Sample }) {
  return <section className="details-panel" aria-labelledby="details-heading">
    <div className="panel-heading"><div><span className="eyebrow">ASSET RECORD</span><h2 id="details-heading">The details, all in one place.</h2></div><span className="field-count"><FileText size={14} /> 10 fields</span></div>
    <dl className="details-grid">{fields.map((field, index) => <div className={`detail-cell ${field.key === 'name' || field.key === 'vendorName' ? 'wide-value' : ''}`} key={field.key}>
      <dt><span className="field-index">{String(index + 1).padStart(2, '0')}</span>{field.label}</dt>
      <dd className={['code', 'poNumber', 'vendorCode', 'location', 'costCenter'].includes(field.key) ? 'mono' : ''}>{valueOf(sample, field.key)}</dd>
    </div>)}</dl>
    <div className="record-footer"><FileText size={14} /><span>Source: Excel · Samples worksheet</span><span className="record-footer-note">Original sample values</span></div>
  </section>;
}

function downloadFile(url: string, name: string) {
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
}

function QRPanel({ sample, notify }: { sample: Sample; notify: (message: string) => void }) {
  const url = `${publicOrigin()}/asset/${encodeURIComponent(sample.code)}`;
  const [qr, setQr] = useState('');
  const [error, setError] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(new URL(url).hostname);
  useEffect(() => {
    let current = true;
    setQr(''); setError(false);
    QRCode.toDataURL(url, { width: 800, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#102d25', light: '#ffffff' } })
      .then(data => { if (current) setQr(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [url]);

  async function downloadLabel() {
    if (!qr) return;
    try {
      const image = new Image(); image.src = qr; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, 1000, 1000);
      context.drawImage(image, 75, 15, 850, 850);
      context.fillStyle = '#102d25'; context.textAlign = 'center';
      context.font = '25px sans-serif'; context.fillText('SAP CODE', 500, 878);
      context.font = '38px monospace'; context.fillText(sample.sapCode, 500, 938);
      downloadFile(canvas.toDataURL('image/png'), `asset-label-${sample.code}.png`);
      notify('Label downloaded');
    } catch { notify('Could not download the label. Please try again.'); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); notify('Asset link copied'); }
    catch { setShowUrl(true); notify('Select and copy the asset link below'); }
  }

  return <aside className="qr-panel" aria-labelledby="qr-heading">
    <div className="qr-heading"><span className="small-icon"><ScanLine size={18} /></span><div><h2 id="qr-heading">Ready to scan</h2><p>One label. Every detail.</p></div></div>
    <div className="label-preview">
      {qr ? <img className="qr-image" src={qr} alt={`QR code opening details for asset ${sample.code}`} width="240" height="240" /> : <div className="qr-placeholder">{error ? 'Unable to generate QR' : 'Generating QR…'}</div>}
      <span className="sap-label">SAP CODE</span><span className="sap-code">{sample.sapCode}</span>
    </div>
    <div className="label-meta"><span>50 × 50 mm label</span><span>Demo SAP code</span></div>
    <button className="button primary full" onClick={downloadLabel} disabled={!qr}><ArrowDownToLine size={16} />Download label</button>
    <div className="qr-actions"><button className="button secondary" disabled={!qr} onClick={() => window.print()}><Printer size={15} />Print</button><button className="button secondary" onClick={copyLink}><Clipboard size={15} />Copy link</button></div>
    <div className="scan-note"><ShieldCheck size={17} /><p>Scan with your phone camera.<br /><strong>No app or login needed.</strong></p></div>
    {isLocal && <p className="local-note"><Info size={14} /><span>This is a local preview. Deploy the app before sharing a QR with Yekesh.</span></p>}
    <button className="text-button qr-link-toggle" onClick={() => setShowUrl(!showUrl)} aria-expanded={showUrl}>{showUrl ? 'Hide asset link' : 'View asset link'}<ChevronDown size={13} className={showUrl ? 'rotated' : ''} /></button>
    {showUrl && <input className="link-input" ref={linkRef} aria-label="Asset public link" value={url} readOnly onFocus={() => linkRef.current?.select()} />}
    <div className="print-label" aria-hidden="true">{qr && <img src={qr} alt="" />}<span>SAP CODE</span><strong>{sample.sapCode}</strong></div>
  </aside>;
}

export default function App() {
  const pathMatch = window.location.pathname.match(/^\/asset\/([^/]+)\/?$/);
  let pathCode = '';
  try { pathCode = pathMatch ? decodeURIComponent(pathMatch[1]) : ''; } catch { pathCode = 'invalid'; }
  const isPublic = window.location.pathname.startsWith('/asset/');
  const initial = samples.find(sample => sample.code === (pathCode || new URLSearchParams(window.location.search).get('sample')));
  const [selectedCode, setSelectedCode] = useState(initial?.code || samples[0].code);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [toast, setToast] = useState('');
  const [help, setHelp] = useState(false);
  const helpRef = useRef<HTMLDialogElement>(null);
  const selected = samples.find(sample => sample.code === selectedCode)!;
  const visibleSamples = samples.filter(sample => (type === 'all' || sample.type === type) && `${sample.name} ${sample.code} ${sample.type} ${sample.location}`.toLowerCase().includes(search.toLowerCase().trim()));
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.title = isPublic && initial ? `${initial.name} · Brady` : 'Brady · Asset samples';
  }, [isPublic, initial]);
  useEffect(() => { if (help) helpRef.current?.showModal(); else helpRef.current?.close(); }, [help]);

  function choose(sample: Sample) {
    setSelectedCode(sample.code);
    window.history.replaceState(null, '', `/?sample=${encodeURIComponent(sample.code)}`);
  }

  if (isPublic && !initial || !isPublic && window.location.pathname !== '/') return <div className="not-found"><Brand /><div className="not-found-card"><ScanLine size={38} /><h1>Asset not found</h1><p>We couldn’t find a sample for this link. Check the QR label or choose an available sample.</p><a className="button primary" href="/">View samples<ArrowRight size={17} /></a></div></div>;

  return <div className={isPublic ? 'app public-view' : 'app'}>
    <header className="topbar"><div className="topbar-inner"><Brand /><div className="header-divider" /><span className="product-name">Asset tagging</span>{!isPublic && <nav aria-label="Main navigation"><a className="active-nav" href="/">Samples</a></nav>}<div className="header-right"><span className="demo-badge"><span />Sample demo</span><button className="icon-button" aria-label="How QR labels work" onClick={() => setHelp(true)}><HelpCircle size={20} /></button><span className="avatar" aria-label="Brady">B</span></div></div></header>
    <main className="workspace">
      <div className="breadcrumb"><a href="/">Asset tagging</a><span>/</span><span>{isPublic ? 'Asset details' : 'Samples'}</span></div>
      {!isPublic ? <section className="page-intro"><div><div className="eyebrow intro-eyebrow"><span />SAMPLE COLLECTION</div><h1>Small label.<br className="mobile-break" /> Complete picture<span>.</span></h1><p>Explore your asset samples. Scan a QR to take the details with you.</p></div><div className="intro-symbol" aria-hidden="true"><div className="scan-corner tl" /><div className="scan-corner tr" /><QrCode size={56} strokeWidth={1.2} /><div className="scan-corner bl" /><div className="scan-corner br" /></div></section> : <div className="public-intro"><span className="public-status"><ShieldCheck size={16} />Public asset details</span><a className="text-button" href="/"><ArrowLeft size={14} />All samples</a></div>}

      <div className="content-layout">
        {!isPublic && <aside className="sample-browser" aria-label="Sample selection">
          <div className="browser-heading"><h2>Samples <span>{samples.length.toString().padStart(2, '0')}</span></h2><Layers3 size={18} /></div>
          <label className="search-box"><Search size={16} /><input type="search" placeholder="Find a sample…" aria-label="Search samples" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <div className="filter-wrap"><select aria-label="Filter by asset type" value={type} onChange={event => setType(event.target.value)}><option value="all">All asset types</option>{types.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={14} /></div>
          <div className="sample-list">{visibleSamples.map((sample, index) => <button className={`sample-card ${sample.code === selectedCode ? 'selected' : ''}`} key={sample.code} onClick={() => choose(sample)} aria-pressed={sample.code === selectedCode}>
            <div className="sample-card-top"><span className={`type-icon type-${samples.indexOf(sample)}`}><TypeIcon type={sample.type} /></span><span className="sample-number">{String(samples.indexOf(sample) + 1).padStart(2, '0')}</span>{sample.code === selectedCode && <Check size={15} className="selection-check" />}</div>
            <span className="sample-name">{sample.name}</span><span className="sample-card-bottom"><span className="mono">{sample.code}</span><ArrowRight size={15} /></span>
            <span className="sr-only">Sample {index + 1}, {sample.type}</span>
          </button>)}{visibleSamples.length === 0 && <div className="empty-search"><Search size={25} /><h3>No matching samples</h3><p>Try another name, code, or type.</p><button className="text-button" onClick={() => { setSearch(''); setType('all'); }}>Clear filters</button></div>}</div>
          <div className="browser-footer"><FileText size={14} /><span>From your Samples worksheet</span></div>
        </aside>}

        <div className="selected-area" key={selected.code}>
          <section className="asset-summary"><div className="summary-top"><span className="type-badge"><TypeIcon type={selected.type} size={14} />{selected.type}</span><span className="sample-data-badge">Sample data</span></div><h2>{selected.name}</h2><div className="summary-meta"><span className="mono"><Package size={15} />{selected.code}</span><span className="meta-divider" /><span><MapPin size={15} />{selected.location}</span>{!isPublic && <a href={`/asset/${selected.code}`} target="_blank" rel="noreferrer" className="open-asset">Open scan view<ExternalLink size={14} /></a>}</div></section>
          <div className="asset-content"><Details sample={selected} />{!isPublic && <QRPanel sample={selected} notify={setToast} />}</div>
          <div className="below-record"><span><span className="tiny-dot" />{isPublic ? 'All 10 asset fields are shown above.' : 'The QR opens this record on any phone.'}</span><span>Made for a quick scan.</span></div>
        </div>
      </div>
      <footer className="site-footer"><span>brady<span className="brand-dot">.</span><span className="footer-separator">/</span>Asset tagging demo</span><span>One scan closer to your assets.</span></footer>
    </main>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    <dialog ref={helpRef} className="help-dialog" onClose={() => setHelp(false)} onClick={event => { if (event.target === event.currentTarget) setHelp(false); }}><div className="help-heading"><span className="small-icon"><ScanLine size={21} /></span><button className="icon-button" aria-label="Close help" onClick={() => setHelp(false)}><X size={20} /></button></div><h2>From label to details.</h2><p>Choose a sample, download its QR label, and scan it with a phone camera. The link opens all ten fields without an app or login.</p><ol><li>Choose the sample you want to share.</li><li>Download or print its QR label.</li><li>Scan the QR with your phone camera.</li></ol><p className="help-small">SAP codes are 16-character placeholders for this demo. Labels are designed for 50 × 50 mm printing; use actual size (100%) and disable printer headers and footers. Local preview links become shareable after deployment.</p><button className="button primary full" onClick={() => setHelp(false)}>Got it<Check size={16} /></button></dialog>
  </div>;
}
