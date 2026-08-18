import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Check } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const OPTIONS = [
    { id: 'dark', label: 'Dark Mode', desc: 'Easier on the eyes for long sessions and low light.', icon: Moon },
    { id: 'light', label: 'Light / White Mode', desc: 'Bright, high-contrast look for daytime use.', icon: Sun },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Manage preferences for this portal.</p>
      </div>

      <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5 max-w-2xl">
        <h3 className="font-medium text-[var(--text-primary)] mb-1">Appearance</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Choose how the portal looks on this device.</p>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ id, label, desc, icon: Icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active ? 'border-[#3ECF8E] bg-[#3ECF8E]/10' : 'border-[var(--border)] hover:bg-[var(--bg-panel-hover)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} className={active ? 'text-[#3ECF8E]' : 'text-[var(--text-muted)]'} />
                  {active && <Check size={16} className="text-[#3ECF8E]" />}
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
                <div className="text-xs text-[var(--text-faint)] mt-1">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] p-5 max-w-2xl mt-6">
        <h3 className="font-medium text-[var(--text-primary)] mb-1">More settings</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Team access is managed from <span className="text-[var(--text-secondary)]">Team &amp; Roles</span>. More preferences will appear here over time.
        </p>
      </div>
    </div>
  );
}
