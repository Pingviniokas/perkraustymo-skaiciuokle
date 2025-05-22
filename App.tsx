import React, { useState } from 'react';
import OrdersView from './features/orders/OrdersView';
import ExpensesView from './features/expenses/ExpensesView';
import EmployeesView from './features/employees/EmployeesView';
import ReportsView from './features/reports/ReportsView';
import DashboardView from './features/dashboard/DashboardView';
import LoginView from './features/auth/LoginView'; 
import { AppProvider } from './contexts/AppContext'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomeIcon, TruckIcon, CurrencyEuroIcon, UsersIcon, DocumentChartBarIcon, MenuIcon, XIcon } from './components/icons/Icons'; 

type View = 'dashboard' | 'orders' | 'expenses' | 'employees' | 'reports';

const MainApp: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false); 
  
  const { isAuthenticated, loading, logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'orders':
        return <OrdersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'employees':
        return <EmployeesView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Apžvalga', icon: <HomeIcon className="w-5 h-5 mr-2" /> },
    { id: 'orders', label: 'Užsakymai', icon: <TruckIcon className="w-5 h-5 mr-2" /> },
    { id: 'expenses', label: 'Išlaidos', icon: <CurrencyEuroIcon className="w-5 h-5 mr-2" /> },
    { id: 'employees', label: 'Darbuotojai', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
    { id: 'reports', label: 'Ataskaitos', icon: <DocumentChartBarIcon className="w-5 h-5 mr-2" /> },
  ];

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <img 
            src="https://mesjaucia.lt/wp-content/themes/mjcDesign/images/logoMJC.png" 
            alt="MES JAU ČIA Logo" 
            className="h-16 mx-auto mb-4 animate-pulse" 
          />
          <p className="text-xl text-neutral-700">Kraunasi...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppProvider> 
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-neutral-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center">
              <img 
                src="https://mesjaucia.lt/wp-content/themes/mjcDesign/images/logoMJC.png" 
                alt="MES JAU ČIA Logo" 
                className="h-8 sm:h-10 mr-2 sm:mr-3" 
                loading="lazy"
              />
              <span className="hidden sm:inline">MES JAU ČIA skaičiuolė</span>
              <span className="sm:hidden">MJČ skaičiuolė</span>
            </h1>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User info and logout */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <span className="text-neutral-300">Prisijungęs:</span>
                <span className="text-white">{currentUser?.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600 transition-colors"
              >
                Atsijungti
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-neutral-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 container mx-auto mt-2 sm:mt-4 px-2 sm:px-4">
          {/* Desktop Navigation */}
          <nav className="hidden lg:block w-64 bg-white p-4 rounded-lg shadow mr-4">
            <ul>
              {navItems.map(item => (
                <li key={item.id} className="mb-2">
                  <button
                    onClick={() => setActiveView(item.id as View)}
                    className={`w-full flex items-center text-left px-4 py-2 rounded-md transition-colors duration-150 ease-in-out
                                ${activeView === item.id 
                                  ? 'bg-neutral-800 text-white shadow-sm' 
                                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Navigation Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
              <nav className="bg-white w-64 h-full p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-neutral-800">Navigacija</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-md hover:bg-neutral-100"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
                <ul>
                  {navItems.map(item => (
                    <li key={item.id} className="mb-2">
                      <button
                        onClick={() => {
                          setActiveView(item.id as View);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center text-left px-4 py-3 rounded-md transition-colors duration-150 ease-in-out
                                    ${activeView === item.id 
                                      ? 'bg-neutral-800 text-white shadow-sm' 
                                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800'}`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40">
            <div className="flex justify-around py-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className={`flex flex-col items-center py-2 px-3 rounded-md transition-colors duration-150 ease-in-out min-w-0
                              ${activeView === item.id 
                                ? 'text-neutral-800 bg-neutral-100' 
                                : 'text-neutral-600 hover:text-neutral-800'}`}
                >
                  <div className="mb-1">
                    {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                  </div>
                  <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white p-3 sm:p-6 rounded-lg shadow mb-20 lg:mb-0">
            {renderView()}
          </main>
        </div>
        
        <footer className="text-center p-4 text-sm text-neutral-600 hidden lg:block">
          © {new Date().getFullYear()} MES JAU ČIA skaičiuolė
        </footer>
      </div>
    </AppProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
