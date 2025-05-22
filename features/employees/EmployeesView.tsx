
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { EmployeeMonthlySummary, calculateEmployeeMonthlySummary } from '../../utils/calculations';
import type { Employee } from '../../types';
import { formatCurrency, getMonthYear, getCurrentDateISO } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PlusCircleIcon, PencilIcon, TrashIcon, CashIcon } from '../../components/icons/Icons'; // Pridėta CashIcon
import EmployeeForm from './EmployeeForm';
import SalaryPayoutForm from './SalaryPayoutForm'; // Nauja forma išmokėjimams
import EmployeePayoutsModal from './EmployeePayoutsModal'; // Modal išmokėjimų sąrašui

const EmployeesView: React.FC = () => {
  const { employees, orders, salaryPayouts, deleteEmployee } = useAppContext(); 
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthYear(getCurrentDateISO()));
  
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [employeeIdForNewPayout, setEmployeeIdForNewPayout] = useState<string | undefined>(undefined);
  
  const [isPayoutsListModalOpen, setIsPayoutsListModalOpen] = useState(false);
  const [selectedEmployeeForPayouts, setSelectedEmployeeForPayouts] = useState<Employee | null>(null);


  const employeeSummaries: EmployeeMonthlySummary[] = useMemo(() => {
    if (!selectedMonth) return [];
    return employees.map(emp => calculateEmployeeMonthlySummary(selectedMonth, emp, orders, salaryPayouts));
  }, [employees, orders, salaryPayouts, selectedMonth]);

  const openAddEmployeeModal = () => {
    setEmployeeToEdit(null);
    setIsEmployeeFormOpen(true);
  };

  const openEditEmployeeModal = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEmployeeFormOpen(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm("Ar tikrai norite ištrinti šį darbuotoją? Šis veiksmas negalės būti atšauktas.")) {
        deleteEmployee(employeeId);
    }
  };

  const openAddPayoutModal = (employeeId: string) => {
    setEmployeeIdForNewPayout(employeeId);
    setIsPayoutFormOpen(true);
  };
  
  const openPayoutsListModal = (employee: Employee) => {
    setSelectedEmployeeForPayouts(employee);
    setIsPayoutsListModalOpen(true);
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-neutral-200">
        <h2 className="text-2xl font-semibold text-neutral-800">Darbuotojai</h2>
        <Button onClick={openAddEmployeeModal} variant="primary" leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
          Pridėti darbuotoją
        </Button>
      </div>

      <div className="mb-6 p-4 bg-neutral-50 rounded-lg shadow-sm flex items-end gap-4">
        <Input
          label="Suvestinė už mėnesį:"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          containerClassName="mb-0"
        />
      </div>

      {employeeSummaries.length === 0 && selectedMonth && employees.length > 0 && (
        <p className="text-center text-neutral-500 py-8">Nėra darbuotojų duomenų pasirinktam mėnesiui.</p>
      )}
       {employees.length === 0 && (
        <p className="text-center text-neutral-500 py-8">Nėra pridėtų darbuotojų.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const summary = employeeSummaries.find(s => s.employeeId === emp.id);
          return (
            <Card key={emp.id} title={emp.name} actions={
              <div className="flex space-x-1">
                <Button size="sm" variant="secondary" onClick={() => openEditEmployeeModal(emp)} leftIcon={<PencilIcon className="w-3 h-3"/>}>
                    R
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteEmployee(emp.id)} leftIcon={<TrashIcon className="w-3 h-3"/>}>
                    T
                </Button>
              </div>
            }>
              <div className="space-y-1 text-sm text-neutral-700">
                <p>Val. įkainis: <span className="font-semibold">{formatCurrency(emp.hourlyRate)}</span></p>
                {summary && selectedMonth && (
                  <>
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                        <p>Mėn. ({selectedMonth}) išdirbta: <span className="font-semibold">{summary.totalHours.toFixed(2)} val.</span></p>
                        <p>Uždirbta: <span className="font-semibold text-green-700">{formatCurrency(summary.totalSalary)}</span></p>
                        <p 
                            className="cursor-pointer hover:underline text-blue-600"
                            onClick={() => openPayoutsListModal(emp)}
                        >
                            Išmokėta: <span className="font-semibold text-red-600">{formatCurrency(summary.totalPaidOut)}</span>
                        </p>
                        <p>Likutis: <span className={`font-bold ${summary.outstandingBalance >= 0 ? 'text-neutral-800' : 'text-red-700'}`}>{formatCurrency(summary.outstandingBalance)}</span></p>
                    </div>
                    <Button 
                        size="sm" 
                        variant="success" 
                        onClick={() => openAddPayoutModal(emp.id)} 
                        leftIcon={<CashIcon className="w-4 h-4"/>}
                        className="mt-2 w-full"
                    >
                        Registruoti išmokėjimą
                    </Button>
                  </>
                )}
                 {!summary && selectedMonth && (
                    <p className="text-xs text-neutral-500 italic mt-2 pt-2 border-t">Nėra duomenų už {selectedMonth}</p>
                 )}
              </div>
            </Card>
          );
        })}
      </div>
      {isEmployeeFormOpen && (
        <EmployeeForm
            isOpen={isEmployeeFormOpen}
            onClose={() => setIsEmployeeFormOpen(false)}
            employeeToEdit={employeeToEdit}
        />
      )}
      {isPayoutFormOpen && (
        <SalaryPayoutForm
            isOpen={isPayoutFormOpen}
            onClose={() => setIsPayoutFormOpen(false)}
            employeeIdForNewPayout={employeeIdForNewPayout}
            // payoutToEdit prop bus valdomas per EmployeePayoutsModal
        />
      )}
      {isPayoutsListModalOpen && selectedEmployeeForPayouts && (
        <EmployeePayoutsModal
            isOpen={isPayoutsListModalOpen}
            onClose={() => setIsPayoutsListModalOpen(false)}
            employee={selectedEmployeeForPayouts}
            month={selectedMonth}
        />
      )}
    </div>
  );
};

export default EmployeesView;
