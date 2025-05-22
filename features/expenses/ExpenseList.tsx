
import React from 'react';
import { Expense } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PencilIcon, TrashIcon } from '../../components/icons/Icons';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEditExpense }) => {
  const { deleteExpense } = useAppContext();

  if (expenses.length === 0) {
    return <p className="text-center text-neutral-500 py-8">Nėra išlaidų. Pridėkite naują.</p>;
  }

  return (
    <div className="space-y-3">
      {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
        <Card key={expense.id} className="hover:shadow-md transition-shadow duration-150">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <p className="font-semibold text-neutral-700">{expense.category}</p>
                <p className="text-xs text-neutral-500">{formatDate(expense.date)}</p>
              </div>
              <p className="text-lg font-medium text-red-700 mt-1 sm:mt-0">{formatCurrency(expense.amount)}</p>
            </div>
            {expense.notes && (
              <p className="mt-2 text-xs text-neutral-600 bg-neutral-50 p-2 rounded">{expense.notes}</p>
            )}
            <div className="flex space-x-2 mt-3 pt-3 border-t border-neutral-100 justify-end">
              <Button size="sm" variant="secondary" onClick={() => onEditExpense(expense)} leftIcon={<PencilIcon className="w-3 h-3"/>}>
                Redaguoti
              </Button>
              <Button size="sm" variant="danger" onClick={() => {
                if (window.confirm(`Ar tikrai norite ištrinti šią išlaidą (${expense.category} ${formatCurrency(expense.amount)})?`)) {
                  deleteExpense(expense.id);
                }
              }} leftIcon={<TrashIcon className="w-3 h-3"/>}>
                Trinti
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ExpenseList;