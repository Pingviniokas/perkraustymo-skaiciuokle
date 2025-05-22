
import React, { useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { calculateDailyFinancials, calculateMonthlyFinancials } from '../../utils/calculations';
import { formatCurrency, getMonthYear } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardView: React.FC = () => {
  const { orders, expenses, employees, salaryPayouts, now } = useAppContext();

  const today = useMemo(() => now.toISOString().split('T')[0], [now]);
  const currentMonth = useMemo(() => getMonthYear(now.toISOString()), [now]);

  const dailyFinancials = useMemo(() => calculateDailyFinancials(today, orders, expenses, employees, salaryPayouts), [today, orders, expenses, employees, salaryPayouts]);
  const monthlyFinancials = useMemo(() => calculateMonthlyFinancials(currentMonth, orders, expenses, employees, salaryPayouts), [currentMonth, orders, expenses, employees, salaryPayouts]);

  const COLORS = ['#262626', '#b91c1c', '#737373', '#059669', '#d97706', '#6366f1', '#F1C40F', '#16A085'];


  const monthlyExpenseData = useMemo(() => {
    return Object.entries(monthlyFinancials.expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [monthlyFinancials.expensesByCategory]);

  const last7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [now]);

  const weeklyProfitData = useMemo(() => {
    return last7Days.map(date => {
      const financials = calculateDailyFinancials(date, orders, expenses, employees, salaryPayouts);
      return {
        date: new Date(date).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' }),
        Pelnas: financials.profit,
        Pajamos: financials.totalOrdersAmount,
        "Visos Išlaidos": financials.totalExpensesAmount + financials.totalEmployeeSalaries // Bendros išlaidos + uždirbti atlyginimai
      };
    });
  }, [last7Days, orders, expenses, employees, salaryPayouts]);


  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-neutral-800">Finansų Apžvalga</h2>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card title={`Šios dienos pelnas`}>
          <p className="text-xs sm:text-sm text-neutral-600 mb-1">{new Date(today).toLocaleDateString('lt-LT')}</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(dailyFinancials.profit)}</p>
        </Card>
        <Card title="Šio mėnesio pelnas">
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatCurrency(monthlyFinancials.profit)}</p>
        </Card>
         <Card title="Laukiama pavedimų">
          <p className="text-xs sm:text-sm text-neutral-600 mb-1">Šį mėnesį</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{formatCurrency(monthlyFinancials.totalPendingBankTransfers)}</p>
        </Card>
        <Card title="Išmokėta atlyginimų">
          <p className="text-xs sm:text-sm text-neutral-600 mb-1">Šį mėnesį</p>
          <p className="text-2xl sm:text-3xl font-bold text-sky-600">{formatCurrency(monthlyFinancials.totalSalaryPayoutsInMonth)}</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Paskutinių 7 dienų finansai">
          {weeklyProfitData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProfitData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${Math.round(value/1000)}k`}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ fontSize: '12px' }}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Pajamos" fill={COLORS[0]} /> 
                  <Bar dataKey="Visos Išlaidos" fill={COLORS[1]} />
                  <Bar dataKey="Pelnas" fill={COLORS[3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-neutral-500 text-center py-8">Nėra duomenų.</p>}
        </Card>
        <Card title="Šio mėnesio išlaidos pagal kategorijas">
           {monthlyExpenseData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={monthlyExpenseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={window.innerWidth < 640 ? 60 : 100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => window.innerWidth < 640 ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                          {monthlyExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
              </ResponsiveContainer>
            </div>
           ) : <p className="text-neutral-500 text-center py-8">Nėra išlaidų šį mėnesį.</p>}
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card title="Šiandienos suvestinė" className="lg:col-span-1">
          <ul className="space-y-1.5 text-sm text-neutral-700">
            <li className="flex justify-between">
              <span>Pajamos:</span> 
              <span className="font-semibold">{formatCurrency(dailyFinancials.totalOrdersAmount)}</span>
            </li>
            <li className="flex justify-between">
              <span>Išlaidos (be atlyg.):</span> 
              <span className="font-semibold">{formatCurrency(dailyFinancials.totalExpensesAmount)}</span>
            </li>
            <li className="flex justify-between">
              <span>Atlyginimai (uždirbta):</span> 
              <span className="font-semibold">{formatCurrency(dailyFinancials.totalEmployeeSalaries)}</span>
            </li>
            <li className="flex justify-between font-medium text-sky-700">
              <span>Atlyginimai (išmokėta):</span> 
              <span className="font-semibold">{formatCurrency(dailyFinancials.totalSalaryPayoutsOnDate)}</span>
            </li>
            <div className="pt-2 border-t border-neutral-200 space-y-1.5">
              <li className="flex justify-between">
                <span>Grynaisiais laukiama:</span> 
                <span className="font-semibold">{formatCurrency(dailyFinancials.cashExpected)}</span>
              </li>
              <li className="flex justify-between">
                <span>Pervedimu laukiama:</span> 
                <span className="font-semibold">{formatCurrency(dailyFinancials.bankTransfersExpected)}</span>
              </li>
              <li className="flex justify-between">
                <span>Laukia pavedimų:</span> 
                <span className="font-semibold text-red-600">{formatCurrency(dailyFinancials.pendingBankTransfers)}</span>
              </li>
            </div>
          </ul>
        </Card>
        <Card title={`Šio mėnesio (${currentMonth}) suvestinė`} className="lg:col-span-1">
           <ul className="space-y-1.5 text-sm text-neutral-700">
            <li className="flex justify-between">
              <span>Viso užsakymų:</span> 
              <span className="font-semibold">{monthlyFinancials.totalOrders}</span>
            </li>
            <li className="flex justify-between">
              <span>Pajamos:</span> 
              <span className="font-semibold">{formatCurrency(monthlyFinancials.totalOrdersAmount)}</span>
            </li>
            <li className="flex justify-between">
              <span>Išlaidos (be atlyg.):</span> 
              <span className="font-semibold">{formatCurrency(monthlyFinancials.totalExpensesAmount)}</span>
            </li>
            <li className="flex justify-between">
              <span>Atlyginimai (uždirbta):</span> 
              <span className="font-semibold">{formatCurrency(monthlyFinancials.totalEmployeeSalaries)}</span>
            </li>
            <li className="flex justify-between font-medium text-sky-700">
              <span>Atlyginimai (išmokėta):</span> 
              <span className="font-semibold">{formatCurrency(monthlyFinancials.totalSalaryPayoutsInMonth)}</span>
            </li>
            <div className="pt-2 border-t border-neutral-200 space-y-1.5">
              <li className="flex justify-between">
                <span>Grynaisiais gauta/laukiama:</span> 
                <span className="font-semibold">{formatCurrency(monthlyFinancials.cashExpected)}</span>
              </li>
              <li className="flex justify-between">
                <span>Pervedimu gauta/laukiama:</span> 
                <span className="font-semibold">{formatCurrency(monthlyFinancials.bankTransfersExpected)}</span>
              </li>
            </div>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
