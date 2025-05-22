
import React, { useState, useEffect } from 'react';
import { SalaryPayout, Employee } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { getCurrentDateISO } from '../../utils/helpers';

interface SalaryPayoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  payoutToEdit?: SalaryPayout | null;
  employeeIdForNewPayout?: string; // For pre-selecting employee when adding new
}

const SalaryPayoutForm: React.FC<SalaryPayoutFormProps> = ({ isOpen, onClose, payoutToEdit, employeeIdForNewPayout }) => {
  const { employees, addSalaryPayout, updateSalaryPayout } = useAppContext();
  
  const getInitialFormData = (): Omit<SalaryPayout, 'id'> => ({
    employeeId: employeeIdForNewPayout || (employees.length > 0 ? employees[0].id : ''),
    date: getCurrentDateISO(),
    amount: 0,
    notes: '',
  });
  
  const [formData, setFormData] = useState<Omit<SalaryPayout, 'id'>>(getInitialFormData());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (payoutToEdit) {
        setFormData({
          employeeId: payoutToEdit.employeeId,
          date: payoutToEdit.date,
          amount: payoutToEdit.amount,
          notes: payoutToEdit.notes || '',
        });
      } else {
        setFormData(getInitialFormData());
      }
      setError('');
    }
  }, [payoutToEdit, isOpen, employeeIdForNewPayout, employees]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.employeeId) {
      setError('Prašome pasirinkti darbuotoją.');
      return;
    }
    if (formData.amount <= 0) {
      setError('Išmokos suma turi būti didesnė už 0.');
      return;
    }

    if (payoutToEdit) {
      updateSalaryPayout({ ...payoutToEdit, ...formData });
    } else {
      addSalaryPayout(formData);
    }
    onClose();
  };

  const employeeOptions = employees.map(emp => ({ value: emp.id, label: emp.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payoutToEdit ? 'Redaguoti atlyginimo išmokėjimą' : 'Registruoti atlyginimo išmokėjimą'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Darbuotojas"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          options={employeeOptions}
          required
          disabled={employeeOptions.length === 0 || !!payoutToEdit} // Disable if no employees or editing
        />
        <Input 
          label="Data" 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="Suma (€)" 
          type="number" 
          name="amount" 
          value={formData.amount.toString()} 
          onChange={handleChange} 
          step="0.01" 
          min="0.01"
          required 
        />
        <Input 
          label="Pastabos" 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Atšaukti</Button>
          <Button type="submit" variant="primary">{payoutToEdit ? 'Išsaugoti' : 'Pridėti išmokėjimą'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SalaryPayoutForm;
