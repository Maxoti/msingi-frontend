/**
 * src/shared/components/Table.jsx
 * Reusable table used across the app
 *
 * Props:
 *   columns  — [{ key, label, render?, width?, align? }]
 *   data     — array of row objects
 *   loading  — bool (shows skeleton)
 *   empty    — string or JSX shown when data is empty
 *   onRowClick — fn(row) optional row click handler
 *   keyField — string field to use as React key (default 'id')
 *
 * Column shape:
 *   key     — data field name (also used as React key)
 *   label   — column header text
 *   render  — optional fn(value, row) => JSX  (custom cell renderer)
 *   width   — optional css width e.g. '120px'
 *   align   — 'left' (default) | 'center' | 'right'
 *
 * Usage example:
 *   <Table
 *     columns={[
 *       { key: 'name',   label: 'Name' },
 *       { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> },
 *       { key: 'actions',label: '',       render: (_, row) => <ActionButtons row={row} /> },
 *     ]}
 *     data={students}
 *     loading={loading}
 *     empty="No students found"
 *   />
 */

export default function Table({
  columns   = [],
  data      = [],
  loading   = false,
  empty     = 'No data found',
  onRowClick,
  keyField  = 'id',
}) {
  return (
    <div style={s.wrapper}>
      <table style={s.table}>
        {/* Head */}
        <thead>
          <tr style={s.headRow}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...s.th,
                  width:     col.width || 'auto',
                  textAlign: col.align || 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={s.skeletonRow}>
                {columns.map((col) => (
                  <td key={col.key} style={s.td}>
                    <span style={s.skeletonCell} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length} style={s.emptyCell}>
                <div style={s.emptyState}>
                  <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📭</span>
                  {empty}
                </div>
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row) => (
              <tr
                key={row[keyField]}
                style={{
                  ...s.tr,
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ ...s.td, textAlign: col.align || 'left' }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────
const s = {
  wrapper: {
    background:   '#fff',
    borderRadius: '14px',
    overflow:     'hidden',
    boxShadow:    '0 2px 16px rgba(0,0,0,0.06)',
    width:        '100%',
  },
  table: {
    width:           '100%',
    borderCollapse:  'collapse',
    fontSize:        14,
  },
  headRow: {
    background: '#fafafa',
  },
  th: {
    padding:         '13px 20px',
    fontSize:        11,
    fontWeight:      700,
    color:           '#888',
    textTransform:   'uppercase',
    letterSpacing:   '0.05em',
    borderBottom:    '1px solid #f0f0f0',
    whiteSpace:      'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f8f8f8',
    transition:   'background 0.15s',
  },
  td: {
    padding: '14px 20px',
    color:   '#333',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding:   '60px 24px',
    textAlign: 'center',
  },
  emptyState: {
    color:    '#aaa',
    fontSize: 14,
  },
  skeletonRow: {
    borderBottom: '1px solid #f8f8f8',
  },
  skeletonCell: {
    display:    'block',
    height:     14,
    width:      '70%',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 4,
    animation:  'shimmer 1.2s infinite',
  },
}