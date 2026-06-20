import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, Calendar, CheckCircle, Clock, Download, RefreshCw, Timer } from 'lucide-react';
import JSZip from 'jszip';
import { useLanguage } from '../../context/LanguageContext';
import { reportService } from '../../services/reportService';

const toInputDate = (date) => date.toISOString().slice(0, 10);

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    desde: toInputDate(start),
    hasta: toInputDate(end)
  };
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const getColumnName = (index) => {
  let column = '';
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
};

const buildSheetXml = (rows) => {
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${getColumnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `<c r="${reference}"><v>${value}</v></c>`;
      }
      return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
};

const downloadWorkbook = async (fileName, sheets) => {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`);

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  zip.folder('xl').file('workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
  </sheets>
</workbook>`);

  zip.folder('xl').folder('_rels').file('workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}
</Relationships>`);

  const worksheetsFolder = zip.folder('xl').folder('worksheets');
  sheets.forEach((sheet, index) => {
    worksheetsFolder.file(`sheet${index + 1}.xml`, buildSheetXml(sheet.rows));
  });

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function AnalyticsReport() {
  const { t, language } = useLanguage();
  const authUser = JSON.parse(sessionStorage.getItem('onboardhub_user') || '{}');
  const defaultRange = useMemo(() => getDefaultDateRange(), []);

  const [filters, setFilters] = useState({
    empresaId: authUser.client_id || '',
    desde: defaultRange.desde,
    hasta: defaultRange.hasta
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summary = report?.summary || {};
  const detail = report?.detail || [];

  const getLocalizedStatus = (status) => {
    const statusMap = {
      Completado: t('analytics_status_completed'),
      'En curso': t('analytics_status_in_progress'),
      Atrasado: t('analytics_status_delayed')
    };
    return statusMap[status] || status;
  };

  const getLocalizedProcessName = (processName) => {
    if (!processName) return '-';

    const knownProcessNames = {
      'Proceso personalizado': t('analytics_custom_process'),
      'Induccion TI': language === 'en' ? 'IT Induction' : 'Induccion TI',
      'Inducción TI': language === 'en' ? 'IT Induction' : 'Inducción TI',
      'Onboarding Area Finanzas': language === 'en' ? 'Finance Area Onboarding' : 'Onboarding Area Finanzas',
      'Onboarding Área Finanzas': language === 'en' ? 'Finance Area Onboarding' : 'Onboarding Área Finanzas'
    };

    return knownProcessNames[processName] || processName;
  };

  const fetchReport = async () => {
    if (!authUser.client_id) {
      setError(t('dashboard_error_missing_company'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await reportService.getOnboardingReport({
        empresaId: filters.empresaId || authUser.client_id,
        clientId: authUser.client_id,
        desde: filters.desde,
        hasta: filters.hasta
      });
      setReport(data);
    } catch (err) {
      console.error('Error fetching onboarding report', err);
      setError(t('analytics_error_loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchReport();
  };

  const handleExport = async () => {
    if (!report) return;

    const summaryRows = [
      [t('analytics_company'), authUser.client_id],
      [t('analytics_from'), filters.desde],
      [t('analytics_to'), filters.hasta],
      [t('analytics_total_onboardings'), summary.total_onboardings || 0],
      [t('analytics_completed'), summary.completed || 0],
      [t('analytics_in_progress'), summary.in_progress || 0],
      [t('analytics_delayed'), summary.delayed || 0],
      [t('analytics_average_days'), summary.average_completion_days ?? t('analytics_no_average')]
    ];

    const detailRows = [
      [
        t('analytics_employee'),
        t('analytics_process'),
        t('analytics_role'),
        t('analytics_start_date'),
        t('analytics_end_date'),
        t('analytics_status'),
        t('analytics_progress'),
        t('analytics_total_tasks'),
        t('analytics_completed_tasks'),
        t('analytics_delayed_tasks'),
        t('analytics_completion_days')
      ],
      ...detail.map((row) => [
        row.employee_name,
        getLocalizedProcessName(row.template_name),
        row.role,
        row.start_date,
        row.end_date,
        getLocalizedStatus(row.status),
        `${row.progress}%`,
        row.total_tasks,
        row.completed_tasks,
        row.delayed_tasks,
        row.completion_days
      ])
    ];

    await downloadWorkbook(`reporte_onboarding_${filters.desde}_${filters.hasta}.xlsx`, [
      { name: 'Resumen', rows: summaryRows },
      { name: 'Detalle', rows: detailRows }
    ]);
  };

  const stats = [
    {
      label: t('analytics_total_onboardings'),
      value: summary.total_onboardings || 0,
      icon: Briefcase,
      color: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: t('analytics_completed'),
      value: summary.completed || 0,
      icon: CheckCircle,
      color: '#16a34a',
      background: 'rgba(22, 163, 74, 0.1)'
    },
    {
      label: t('analytics_in_progress'),
      value: summary.in_progress || 0,
      icon: Clock,
      color: '#d97706',
      background: 'rgba(217, 119, 6, 0.1)'
    },
    {
      label: t('analytics_delayed'),
      value: summary.delayed || 0,
      icon: AlertTriangle,
      color: '#dc2626',
      background: 'rgba(220, 38, 38, 0.1)'
    },
    {
      label: t('analytics_average_days'),
      value: summary.average_completion_days ?? t('analytics_no_average'),
      icon: Timer,
      color: '#7c3aed',
      background: 'rgba(124, 58, 237, 0.1)'
    }
  ];

  const getStatusStyle = (status) => {
    if (status === 'Completado') {
      return { background: 'rgba(22, 163, 74, 0.1)', color: '#15803d' };
    }
    if (status === 'Atrasado') {
      return { background: 'rgba(220, 38, 38, 0.1)', color: '#b91c1c' };
    }
    return { background: 'rgba(217, 119, 6, 0.1)', color: '#b45309' };
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{t('analytics_title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('analytics_subtitle')}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            {t('analytics_company')}
          </label>
          <input
            className="form-input"
            type="text"
            value={filters.empresaId ? `${t('analytics_session_company')} ${filters.empresaId}` : ''}
            disabled
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <Calendar size={14} /> {t('analytics_from')}
          </label>
          <input
            className="form-input"
            type="date"
            value={filters.desde}
            max={filters.hasta || undefined}
            onChange={(event) => handleFilterChange('desde', event.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <Calendar size={14} /> {t('analytics_to')}
          </label>
          <input
            className="form-input"
            type="date"
            value={filters.hasta}
            min={filters.desde || undefined}
            onChange={(event) => handleFilterChange('hasta', event.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> {loading ? t('msg_loading') : t('analytics_apply_filters')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
            disabled={!report || detail.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> {t('analytics_export')}
          </button>
        </div>
      </form>

      {error && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', color: '#b91c1c', background: 'rgba(220, 38, 38, 0.08)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: stat.background, color: stat.color, padding: '10px', borderRadius: '8px', display: 'flex' }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>{t('analytics_detail_title')}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{detail.length} {t('analytics_records')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('msg_loading')}</div>
        ) : detail.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('msg_no_data')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th style={tableHeaderStyle}>{t('analytics_employee')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_process')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_start_date')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_end_date')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_status')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_progress')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_tasks')}</th>
                  <th style={tableHeaderStyle}>{t('analytics_completion_days')}</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((row) => (
                  <tr key={row.journey_id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.employee_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatValue(row.role)}</div>
                    </td>
                    <td style={tableCellStyle}>{getLocalizedProcessName(row.template_name)}</td>
                    <td style={tableCellStyle}>{formatValue(row.start_date)}</td>
                    <td style={tableCellStyle}>{formatValue(row.end_date)}</td>
                    <td style={tableCellStyle}>
                      <span style={{ ...getStatusStyle(row.status), padding: '0.3rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {getLocalizedStatus(row.status)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '90px', height: '8px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${row.progress || 0}%`, height: '100%', background: row.progress >= 100 ? '#16a34a' : '#3b82f6' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{row.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {row.completed_tasks}/{row.total_tasks}
                      {row.delayed_tasks > 0 && (
                        <span style={{ marginLeft: '0.5rem', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>
                          {row.delayed_tasks} {t('analytics_delayed_short')}
                        </span>
                      )}
                    </td>
                    <td style={tableCellStyle}>{formatValue(row.completion_days)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '0.85rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap'
};

const tableCellStyle = {
  padding: '0.9rem 1rem',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  verticalAlign: 'middle'
};
