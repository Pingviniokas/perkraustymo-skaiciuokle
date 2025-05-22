import React, { useState } from 'react';
import OrdersView from './features/orders/OrdersView';
import ExpensesView from './features/expenses/ExpensesView';
import EmployeesView from './features/employees/EmployeesView';
import ReportsView from './features/reports/ReportsView';
import DashboardView from './features/dashboard/DashboardView';
import LoginView from './features/auth/LoginView'; 
import { AppProvider } from './contexts/AppContext'; 
import { HomeIcon, TruckIcon, CurrencyEuroIcon, UsersIcon, DocumentChartBarIcon } from './components/icons/Icons'; 

type View = 'dashboard' | 'orders' | 'expenses' | 'employees' | 'reports';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); 

  const LOGIN_CODE = "199011"; // Šis kodas bus naudojamas X-Auth-Code antraštėje API užklausoms

  const handleLogin = (code: string) => {
    if (code === LOGIN_CODE) {
      setIsAuthenticated(true);
    } else {
      alert("Neteisingas prisijungimo kodas!");
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

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  return (
    <AppProvider> 
      <div className="min-h-screen flex flex-col">
        <header className="bg-neutral-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <img 
                src="https://mesjaucia.lt/wp-content/themes/mjcDesign/images/logoMJC.png" 
                alt="MES JAU ČIA Logo" 
                className="h-10 mr-3" 
                loading="lazy"
              />
              MES JAU ČIA skaičiuolė
            </h1>
            {/* "Išsaugoti viską" mygtukas pašalintas, nes duomenys saugomi serveryje */}
          </div>
        </header>
        
        <div className="flex flex-1 container mx-auto mt-4">
          <nav className="w-64 bg-white p-4 rounded-lg shadow mr-4">
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

          <main className="flex-1 bg-white p-6 rounded-lg shadow">
            {renderView()}
          </main>
        </div>
        <footer className="text-center p-4 text-sm text-neutral-600">
          © {new Date().getFullYear()} MES JAU ČIA skaičiuolė
        </footer>
      </div>
    </AppProvider>
  );
};

export default App;
