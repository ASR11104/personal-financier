import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, ProtectedRoute } from './components';
import {
  Login,
  Register,
  Dashboard,
  Expenses,
  AddExpense,
  EditExpense,
  Incomes,
  AddIncome,
  EditIncome,
  Accounts,
  AddAccount,
  EditAccount,
  Analytics,
  Categories,
  Profile,
} from './pages';
import { getToken } from './api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const token = getToken();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={token ? <Navigate to="/dashboard" replace /> : <Register />}
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/new" element={<AddExpense />} />
            <Route path="/expenses/:id/edit" element={<EditExpense />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/incomes/new" element={<AddIncome />} />
            <Route path="/incomes/:id/edit" element={<EditIncome />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/new" element={<AddAccount />} />
            <Route path="/accounts/:id/edit" element={<EditAccount />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Redirect root to dashboard or login */}
          <Route
            path="/"
            element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
          />

          {/* 404 */}
          <Route
            path="*"
            element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
