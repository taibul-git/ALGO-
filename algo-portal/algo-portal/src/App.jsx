import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/cs/ClientsList';
import ClientDetail from './pages/cs/ClientDetail';
import IssuesList from './pages/cs/IssuesList';
import SetupsList from './pages/setup/SetupsList';
import SetupDetail from './pages/setup/SetupDetail';
import RunningAccounts from './pages/setup/RunningAccounts';
import VpsCredentials from './pages/setup/VpsCredentials';
import Users from './pages/admin/Users';

function Page({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Page><Dashboard /></Page>} />

      <Route path="/clients" element={<Page roles={['admin', 'cs']}><ClientsList /></Page>} />
      <Route path="/clients/:id" element={<Page roles={['admin', 'cs']}><ClientDetail /></Page>} />
      <Route path="/issues" element={<Page roles={['admin', 'cs']}><IssuesList /></Page>} />

      <Route path="/setups" element={<Page roles={['admin', 'setup']}><SetupsList /></Page>} />
      <Route path="/setups/:id" element={<Page roles={['admin', 'setup']}><SetupDetail /></Page>} />
      <Route path="/running" element={<Page roles={['admin', 'setup']}><RunningAccounts /></Page>} />
      <Route path="/vps" element={<Page roles={['admin', 'setup']}><VpsCredentials /></Page>} />

      <Route path="/users" element={<Page roles={['admin']}><Users /></Page>} />
    </Routes>
  );
}
