
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { calculateMonthlyFinancials, MonthlyFinancials, calculateEmployeeMonthlySummary, EmployeeMonthlySummary } from '../../utils/calculations';
import { formatCurrency, getMonthYear, getCurrentDateISO } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnnualReportMonthDataExtended extends MonthlyFinancials {
  monthShort: string;
}

const ReportsView: React.FC = () => {
  const { orders, expenses, employees, salaryPayouts } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthYear(getCurrentDateISO()));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const monthlyReportData = useMemo(() => {
    if (!selectedMonth) return null;
    return calculateMonthlyFinancials(selectedMonth, orders, expenses, employees, salaryPayouts);
  }, [selectedMonth, orders, expenses, employees, salaryPayouts]);

  const monthlyEmployeeSummaries: EmployeeMonthlySummary[] = useMemo(() => {
    if (!selectedMonth) return [];
    return employees.map(emp => calculateEmployeeMonthlySummary(selectedMonth, emp, orders, salaryPayouts));
  }, [selectedMonth, employees, orders, salaryPayouts]);

  const annualReportData: AnnualReportMonthDataExtended[] = useMemo(() => {
    const yearData: AnnualReportMonthDataExtended[] = [];
    if (!selectedYear || isNaN(parseInt(selectedYear))) return [];
    
    const yearNum = parseInt(selectedYear);

    for (let i = 1; i <= 12; i++) {
      const monthStr = `${yearNum}-${i.toString().padStart(2, '0')}`;
      const monthData = calculateMonthlyFinancials(monthStr, orders, expenses, employees, salaryPayouts);
      yearData.push({
          ...monthData,
          monthShort: new Date(yearNum, i - 1, 1).toLocaleString('lt-LT', { month: 'short' }),
      });
    }
    return yearData;
  }, [selectedYear, orders, expenses, employees, salaryPayouts]);

  const annualTotals = useMemo(() => {
    return annualReportData.reduce((acc, monthData) => {
        acc.totalOrdersAmount += monthData.totalOrdersAmount;
        acc.totalExpensesAmount += monthData.totalExpensesAmount;
        acc.totalEmployeeSalaries += monthData.totalEmployeeSalaries; // Uzdirbta
        acc.totalSalaryPayoutsInMonth += monthData.totalSalaryPayoutsInMonth; // Ismoketa
        acc.profit += monthData.profit;
        return acc;
    }, {totalOrdersAmount: 0, totalExpensesAmount: 0, totalEmployeeSalaries: 0, totalSalaryPayoutsInMonth: 0, profit: 0});
  }, [annualReportData]);

  const COLORS = ['#262626', '#b91c1c', '#737373', '#059669', '#d97706', '#6366f1', '#F1C40F', '#16A085', '#0ea5e9']; // Pridėta nauja spalva


  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Ataskaitos</h2>

      {/* Monthly Report Section */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-200">
            <h3 className="text-xl font-semibold text-neutral-700">Mėnesio Ataskaita</h3>
            <Input
            label="Pasirinkite mėnesį:"
            type="month"
            value={selectedMonth}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedMonth(e.target.value)}
            containerClassName="mb-0 sm:w-auto"
            labelClassName="text-sm"
            />
        </div>
        {!monthlyReportData ? (
          <p className="text-neutral-500">Pasirinkite mėnesį ataskaitai.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={`Finansinė suvestinė (${monthlyReportData.month})`}>
              <ul className="space-y-1 text-sm text-neutral-700">
                <li>Viso užsakymų: <span className="font-semibold">{monthlyReportData.totalOrders}</span></li>
                <li>Bendra pajamų suma: <span className="font-semibold text-green-600">{formatCurrency(monthlyReportData.totalOrdersAmount)}</span></li>
                <li>Bendra išlaidų suma (be atlyg.): <span className="font-semibold text-red-700">{formatCurrency(monthlyReportData.totalExpensesAmount)}</span></li>
                <li>Atlyginimai (uždirbta): <span className="font-semibold text-red-700">{formatCurrency(monthlyReportData.totalEmployeeSalaries)}</span></li>
                <li className="font-medium text-sky-700">Atlyginimai (išmokėta): <span className="font-semibold">{formatCurrency(monthlyReportData.totalSalaryPayoutsInMonth)}</span></li>
                <li className="pt-1 mt-1 border-t border-neutral-200 font-bold">Pelnas: <span className={`font-bold ${monthlyReportData.profit >=0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(monthlyReportData.profit)}</span></li>
                <li className="pt-1 mt-1 border-t border-neutral-200">Grynaisiais (tikėtina): <span className="font-semibold">{formatCurrency(monthlyReportData.cashExpected)}</span></li>
                <li>Pervedimais (tikėtina): <span className="font-semibold">{formatCurrency(monthlyReportData.bankTransfersExpected)}</span></li>
                <li>Laukiama pavedimų: <span className="font-semibold text-amber-600">{formatCurrency(monthlyReportData.totalPendingBankTransfers)}</span></li>
              </ul>
            </Card>
            <Card title="Išlaidos pagal kategorijas">
              {Object.keys(monthlyReportData.expensesByCategory).length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={Object.entries(monthlyReportData.expensesByCategory).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {Object.entries(monthlyReportData.expensesByCategory).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                    </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-neutral-500 text-sm">Nėra išlaidų šį mėnesį.</p>}
            </Card>
            <Card title="Darbuotojų atlyginimai" className="md:col-span-2">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-neutral-700">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="p-2 text-left font-semibold text-neutral-600">Darbuotojas</th>
                      <th className="p-2 text-right font-semibold text-neutral-600">Valandos</th>
                      <th className="p-2 text-right font-semibold text-neutral-600">Uždirbta</th>
                      <th className="p-2 text-right font-semibold text-neutral-600">Išmokėta</th>
                      <th className="p-2 text-right font-semibold text-neutral-600">Likutis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyEmployeeSummaries.map(emp => (
                      <tr key={emp.employeeId} className="border-b border-neutral-100">
                        <td className="p-2">{emp.employeeName}</td>
                        <td className="p-2 text-right">{emp.totalHours.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold text-green-700">{formatCurrency(emp.totalSalary)}</td>
                        <td className="p-2 text-right font-semibold text-red-600">{formatCurrency(emp.totalPaidOut)}</td>
                        <td className={`p-2 text-right font-semibold ${emp.outstandingBalance >= 0 ? 'text-neutral-800' : 'text-red-700'}`}>{formatCurrency(emp.outstandingBalance)}</td>
                      </tr>
                    ))}
                     {monthlyEmployeeSummaries.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-neutral-500">Nėra darbuotojų duomenų šiam mėnesiui.</td></tr>
                     )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Annual Report Section */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-200">
            <h3 className="text-xl font-semibold text-neutral-700">Metinė Ataskaita</h3>
            <Input
            label="Pasirinkite metus:"
            type="number"
            placeholder="YYYY"
            value={selectedYear}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedYear(e.target.value)}
            min="2020"
            max={new Date().getFullYear() + 5}
            containerClassName="mb-0 sm:w-auto"
            labelClassName="text-sm"
            />
        </div>
        {!annualReportData || annualReportData.length === 0 || annualReportData.every(m => m.totalOrdersAmount === 0 && m.totalExpensesAmount === 0 && m.profit === 0) ? (
          <p className="text-neutral-500">Pasirinkite metus arba nėra duomenų pasirinktiems metams.</p>
        ) : (
          <Card title={`Finansinė suvestinė (${selectedYear} m.)`}>
            <div className="mb-4">
                <h4 className="font-semibold text-md text-neutral-700">Metų sumos:</h4>
                <ul className="text-sm text-neutral-700 grid grid-cols-2 md:grid-cols-5 gap-2">
                    <li>Pajamos: <span className="font-bold text-green-600">{formatCurrency(annualTotals.totalOrdersAmount)}</span></li>
                    <li>Išlaidos (be atlyg.): <span className="font-bold text-red-700">{formatCurrency(annualTotals.totalExpensesAmount)}</span></li>
                    <li>Atlyginimai (uždirbta): <span className="font-bold text-red-700">{formatCurrency(annualTotals.totalEmployeeSalaries)}</span></li>
                    <li className="font-bold text-sky-700">Atlyginimai (išmokėta): <span className="font-bold">{formatCurrency(annualTotals.totalSalaryPayoutsInMonth)}</span></li>
                    <li>Pelnas: <span className={`font-bold ${annualTotals.profit >=0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(annualTotals.profit)}</span></li>
                </ul>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={annualReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthShort" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="totalOrdersAmount" name="Pajamos" stackId="a" fill={COLORS[0]} />
                <Bar dataKey="totalExpensesAmount" name="Išlaidos (bendros)" stackId="b" fill={COLORS[1]} />
                <Bar dataKey="totalEmployeeSalaries" name="Atlyg. (Uždirbta)" stackId="b" fill={COLORS[4]} /> 
                <Bar dataKey="totalSalaryPayoutsInMonth" name="Atlyg. (Išmokėta)" fill={COLORS[8]} /> {/* Sky blue for payouts */}
                <Bar dataKey="profit" name="Pelnas" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </section>
    </div>
  );
};

export default ReportsView;
