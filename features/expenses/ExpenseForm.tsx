
import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { EXPENSE_CATEGORIES_OPTIONS } from '../../constants';
import { getCurrentDateISO } from '../../utils/helpers';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

const initialFormData: Omit<Expense, 'id'> = {
  date: getCurrentDateISO(),
  category: ExpenseCategory.FUEL,
  amount: 0,
  notes: '',
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, expenseToEdit }) => {
  const { addExpense, updateExpense } = useAppContext();
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        date: expenseToEdit.date,
        category: expenseToEdit.category,
        amount: expenseToEdit.amount,
        notes: expenseToEdit.notes || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [expenseToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
        alert("Išlaidų suma turi būti didesnė už 0.");
        return;
    }
    if (expenseToEdit) {
      updateExpense({ ...expenseToEdit, ...formData });
    } else {
      addExpense(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expenseToEdit ? 'Redaguoti išlaidą' : 'Pridėti naują išlaidą'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Data" type="date" name="date" value={formData.date} onChange={handleChange} required />
        <Select
          label="Kategorija"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={EXPENSE_CATEGORIES_OPTIONS.map(cat => ({ value: cat, label: cat }))}
          required
        />
        <Input label="Suma (€)" type="number" name="amount" value={formData.amount.toString()} onChange={handleChange} step="0.01" required min="0.01" />
        <Input label="Pastabos" name="notes" value={formData.notes} onChange={handleChange} />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Atšaukti</Button>
          <Button type="submit" variant="primary">{expenseToEdit ? 'Išsaugoti pakeitimus' : 'Pridėti išlaidą'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;