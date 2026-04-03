import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../providers/auth';

const navItems = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/export', label: 'Export Data' },
  { to: '/account/delete', label: 'Delete Account' },
];

export function AccountLayout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-drift-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-drift-surface border-r border-[#142228] flex flex-col">
        <Link
          to="/"
          className="px-6 py-5 font-heading text-lg font-bold text-drift-accent"
          style={{ letterSpacing: '4px' }}
        >
          the mdl
        </Link>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-drift-primary/10 text-drift-accent font-medium'
                    : 'text-drift-muted hover:text-drift-text hover:bg-drift-surface'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#142228]">
          <button
            onClick={() => void signOut()}
            className="w-full px-3 py-2 text-sm text-drift-muted hover:text-drift-text rounded-lg hover:bg-drift-surface transition-colors text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
