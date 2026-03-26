import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Auth } from './components/Auth/Auth';
import { TaskBoard } from './components/Tasks/TaskBoard';

// Dev-only route switcher — remove before production
function DevNav() {
  const location = useLocation();
  const links = [
    { to: '/auth', label: 'Auth' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tasks', label: 'Tasks' },
  ];
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex gap-1 bg-white border border-gray-200 shadow-md rounded-full px-2 py-1.5">
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-colors ${
            location.pathname === to
              ? 'bg-primary-main text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <DevNav />
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskBoard />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
