export function StatusBadge({ status }) {
  const map = {
    'Solved': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'Pending': 'bg-[#E8A33D]/15 text-[#E8A33D]',
    'Completed': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'In Progress': 'bg-[#4FA8E8]/15 text-[#4FA8E8]',
    'Not Started': 'bg-[#171E26] text-[#9AA5B1]',
    'Blocked': 'bg-[#E5484D]/15 text-[#E5484D]',
    'active': 'bg-[#3ECF8E]/15 text-[#3ECF8E]',
    'inactive': 'bg-[#171E26] text-[#9AA5B1]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-[#171E26] text-[#9AA5B1]'}`}>
      {status || '—'}
    </span>
  );
}

export function Card({ title, value, sub, accent }) {
  return (
    <div className="bg-[#12181F] rounded-xl border border-[#1F2933] p-5">
      <div className="text-sm text-[#77828E]">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[#E8EDF2]">{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent || 'text-[#5C6773]'}`}>{sub}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={`bg-[#12181F] rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto border border-[#1F2933]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2933] sticky top-0 bg-[#12181F]">
          <h3 className="font-semibold text-[#E8EDF2]">{title}</h3>
          <button onClick={onClose} className="text-[#5C6773] hover:text-[#9AA5B1] text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-[#9AA5B1] mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full px-3 py-2 bg-[#0B0F14] border border-[#2A3540] rounded-lg text-sm text-[#E8EDF2] placeholder:text-[#5C6773] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/40 focus:border-[#3ECF8E]";

export function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1F2933] text-sm text-[#77828E]">
      <span>{total} total records</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 rounded border border-[#1F2933] text-[#9AA5B1] disabled:opacity-40">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 rounded border border-[#1F2933] text-[#9AA5B1] disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
