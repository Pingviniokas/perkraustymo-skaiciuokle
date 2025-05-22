
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
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Finansų Apžvalga</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title={`Šios dienos (${new Date(today).toLocaleDateString('lt-LT')}) pelnas`}>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(dailyFinancials.profit)}</p>
        </Card>
        <Card title="Šio mėnesio pelnas">
          <p className="text-3xl font-bold text-green-700">{formatCurrency(monthlyFinancials.profit)}</p>
        </Card>
         <Card title="Laukiama pavedimų (Mėn.)">
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(monthlyFinancials.totalPendingBankTransfers)}</p>
        </Card>
        <Card title="Išmokėta atlyginimų (Mėn.)">
          <p className="text-3xl font-bold text-sky-600">{formatCurrency(monthlyFinancials.totalSalaryPayoutsInMonth)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Paskutinių 7 dienų finansai">
          {weeklyProfitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Pajamos" fill={COLORS[0]} /> 
                <Bar dataKey="Visos Išlaidos" fill={COLORS[1]} />
                <Bar dataKey="Pelnas" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-neutral-500">Nėra duomenų.</p>}
        </Card>
        <Card title="Šio mėnesio išlaidos pagal kategorijas">
           {monthlyExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={monthlyExpenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {monthlyExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
           ) : <p className="text-neutral-500">Nėra išlaidų šį mėnesį.</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Šiandienos suvestinė">
          <ul className="space-y-1 text-sm text-neutral-700">
            <li>Pajamos: <span className="font-semibold">{formatCurrency(dailyFinancials.totalOrdersAmount)}</span></li>
            <li>Išlaidos (be atlyg.): <span className="font-semibold">{formatCurrency(dailyFinancials.totalExpensesAmount)}</span></li>
            <li>Atlyginimai (uždirbta): <span className="font-semibold">{formatCurrency(dailyFinancials.totalEmployeeSalaries)}</span></li>
            <li className="font-medium text-sky-700">Atlyginimai (išmokėta): <span className="font-semibold">{formatCurrency(dailyFinancials.totalSalaryPayoutsOnDate)}</span></li>
            <li className="mt-2 pt-2 border-t border-neutral-200">Grynaisiais laukiama: <span className="font-semibold">{formatCurrency(dailyFinancials.cashExpected)}</span></li>
            <li>Pervedimu laukiama: <span className="font-semibold">{formatCurrency(dailyFinancials.bankTransfersExpected)}</span></li>
            <li>Laukia pavedimų: <span className="font-semibold text-red-600">{formatCurrency(dailyFinancials.pendingBankTransfers)}</span></li>
          </ul>
        </Card>
        <Card title={`Šio mėnesio (${currentMonth}) suvestinė`}>
           <ul className="space-y-1 text-sm text-neutral-700">
            <li>Viso užsakymų: <span className="font-semibold">{monthlyFinancials.totalOrders}</span></li>
            <li>Pajamos: <span className="font-semibold">{formatCurrency(monthlyFinancials.totalOrdersAmount)}</span></li>
            <li>Išlaidos (be atlyg.): <span className="font-semibold">{formatCurrency(monthlyFinancials.totalExpensesAmount)}</span></li>
            <li>Atlyginimai (uždirbta): <span className="font-semibold">{formatCurrency(monthlyFinancials.totalEmployeeSalaries)}</span></li>
            <li className="font-medium text-sky-700">Atlyginimai (išmokėta): <span className="font-semibold">{formatCurrency(monthlyFinancials.totalSalaryPayoutsInMonth)}</span></li>
            <li className="mt-2 pt-2 border-t border-neutral-200">Grynaisiais gauta/laukiama: <span className="font-semibold">{formatCurrency(monthlyFinancials.cashExpected)}</span></li>
            <li>Pervedimu gauta/laukiama: <span className="font-semibold">{formatCurrency(monthlyFinancials.bankTransfersExpected)}</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
