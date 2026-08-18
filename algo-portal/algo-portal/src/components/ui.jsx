export function StatusBadge({ status }) {
  const map = {
    'Solved': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'Running': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'Pending': 'bg-[#E8A33D]/15 text-[#E8A33D]',
    'Completed': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'In Progress': 'bg-[#4FA8E8]/15 text-[#4FA8E8]',
    'Not Started': 'bg-[var(--bg-panel-hover)] text-[var(--text-muted)]',
    'Blocked': 'bg-[#E5484D]/15 text-[#E5484D]',
    'active': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'inactive': 'bg-[var(--bg-panel-hover)] text-[var(--text-muted)]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-[var(--bg-panel-hover)] text-[var(--text-muted)]'}`}>
      {status || '—'}
    </span>
  );
}

export function Card({ title, value, sub, accent }) {
  return (
    <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5">
      <div className="text-sm text-[var(--text-muted)]">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent || 'text-[var(--text-faint)]'}`}>{sub}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4" onClick={onClose}>
      <div
        className={`bg-[var(--bg-panel)] rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto border border-[var(--border)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-panel)]">
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/40 focus:border-[#3ECF8E]";

export function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
      <span>{total} total records</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
