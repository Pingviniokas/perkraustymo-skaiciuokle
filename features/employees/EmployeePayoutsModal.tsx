
import React, { useState } from 'react';
import { SalaryPayout, Employee } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, PlusCircleIcon } from '../../components/icons/Icons';
import SalaryPayoutForm from './SalaryPayoutForm'; // Importuojame formą

interface EmployeePayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  month: string; // YYYY-MM formatu
}

const EmployeePayoutsModal: React.FC<EmployeePayoutsModalProps> = ({ isOpen, onClose, employee, month }) => {
  const { salaryPayouts, deleteSalaryPayout } = useAppContext();

  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [payoutToEdit, setPayoutToEdit] = useState<SalaryPayout | null>(null);

  const employeePayoutsForMonth = salaryPayouts.filter(
    p => p.employeeId === employee.id && p.date.startsWith(month)
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openEditPayoutForm = (payout: SalaryPayout) => {
    setPayoutToEdit(payout);
    setIsPayoutFormOpen(true);
  };
  
  const openAddPayoutForm = () => {
    setPayoutToEdit(null);
    setIsPayoutFormOpen(true);
  };

  const handleDeletePayout = (payoutId: string) => {
    if (window.confirm("Ar tikrai norite ištrinti šį išmokėjimą?")) {
      deleteSalaryPayout(payoutId);
    }
  };
  
  const totalPaidThisMonth = employeePayoutsForMonth.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Atlyginimų išmokėjimai - ${employee.name} (${month})`}
        footer={
          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={onClose}>Uždaryti</Button>
            <p className="text-sm font-semibold">Viso išmokėta ({month}): {formatCurrency(totalPaidThisMonth)}</p>
          </div>
        }
      >
        <div className="mb-4 flex justify-end">
            <Button onClick={openAddPayoutForm} size="sm" leftIcon={<PlusCircleIcon className="w-4 h-4" />}>
                Registruoti naują
            </Button>
        </div>

        {employeePayoutsForMonth.length === 0 ? (
          <p className="text-neutral-500 text-center py-4">Šį mėnesį šiam darbuotojui išmokėjimų neregistruota.</p>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {employeePayoutsForMonth.map(payout => (
              <li key={payout.id} className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-neutral-700">{formatCurrency(payout.amount)}</p>
                    <p className="text-xs text-neutral-500">{formatDate(payout.date)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditPayoutForm(payout)} leftIcon={<PencilIcon className="w-3 h-3" />}>
                        R
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeletePayout(payout.id)} leftIcon={<TrashIcon className="w-3 h-3" />}>
                        T
                    </Button>
                  </div>
                </div>
                {payout.notes && <p className="mt-1 text-xs text-neutral-600">{payout.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {isPayoutFormOpen && (
        <SalaryPayoutForm
          isOpen={isPayoutFormOpen}
          onClose={() => setIsPayoutFormOpen(false)}
          payoutToEdit={payoutToEdit}
          employeeIdForNewPayout={!payoutToEdit ? employee.id : undefined} // Perduodam employeeId jei kuriam naują
        />
      )}
    </>
  );
};

export default EmployeePayoutsModal;
