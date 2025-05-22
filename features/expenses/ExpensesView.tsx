
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
import Button from '../../components/ui/Button';
import { Expense, ExpenseCategory } from '../../types';
import { PlusCircleIcon } from '../../components/icons/Icons';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { EXPENSE_CATEGORIES_OPTIONS } from '../../constants';
import { getCurrentDateISO, getMonthYear, formatCurrency } from '../../utils/helpers';
import Card from '../../components/ui/Card';

const ExpensesView: React.FC = () => {
  const { expenses } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  
  const [filterMonth, setFilterMonth] = useState<string>(getMonthYear(getCurrentDateISO()));
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('');


  const openModalToEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const openModalToCreate = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const monthMatch = !filterMonth || getMonthYear(expense.date) === filterMonth;
      const categoryMatch = !filterCategory || expense.category === filterCategory;
      return monthMatch && categoryMatch;
    });
  }, [expenses, filterMonth, filterCategory]);
  
  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-800">Išlaidos</h2>
        <Button 
          onClick={openModalToCreate} 
          variant="primary" 
          leftIcon={<PlusCircleIcon className="w-5 h-5"/>}
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Pridėti išlaidą</span>
          <span className="hidden sm:inline">Pridėti naują išlaidą</span>
        </Button>
      </div>

       <div className="p-3 sm:p-4 bg-neutral-50 rounded-lg shadow-sm">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
          <Input
              label="Filtruoti pagal mėnesį"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              containerClassName="mb-0"
          />
          <Select
              label="Filtruoti pagal kategoriją"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | '')}
              options={[{ value: '', label: 'Visos kategorijos' }, ...EXPENSE_CATEGORIES_OPTIONS.map(cat => ({ value: cat, label: cat }))]}
              containerClassName="mb-0"
          />
           <Card className="sm:col-span-2 lg:col-span-1 shadow-none bg-white border border-neutral-200" bodyClassName="p-3">
              <p className="text-sm text-neutral-600">Filtruotų išlaidų suma:</p>
              <p className="text-lg sm:text-xl font-semibold text-red-700">{formatCurrency(totalFilteredExpenses)}</p>
           </Card>
         </div>
      </div>

      <ExpenseList expenses={filteredExpenses} onEditExpense={openModalToEdit} />

      {isModalOpen && (
        <ExpenseForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          expenseToEdit={expenseToEdit}
        />
      )}
    </div>
  );
};

export default ExpensesView;