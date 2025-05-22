
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import OrderList from './OrderList';
import OrderForm from './OrderForm';
import Button from '../../components/ui/Button';
import { Order } from '../../types';
import { PlusCircleIcon } from '../../components/icons/Icons';
import Input from '../../components/ui/Input';
import { getCurrentDateISO, getMonthYear } from '../../utils/helpers';

const OrdersView: React.FC = () => {
  const { orders } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [filterDate, setFilterDate] = useState<string>(getCurrentDateISO()); // Filter by specific date
  const [filterMonth, setFilterMonth] = useState<string>(getMonthYear(getCurrentDateISO())); // Filter by month
  const [filterType, setFilterType] = useState<'date' | 'month' | 'all'>('date');


  const openModalToEdit = (order: Order) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const openModalToCreate = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    if (filterType === 'all') return orders;
    if (filterType === 'date' && filterDate) {
      return orders.filter(order => order.orderDate === filterDate);
    }
    if (filterType === 'month' && filterMonth) {
      return orders.filter(order => getMonthYear(order.orderDate) === filterMonth);
    }
    return orders;
  }, [orders, filterDate, filterMonth, filterType]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-800">Užsakymai</h2>
        <Button 
          onClick={openModalToCreate} 
          variant="primary" 
          leftIcon={<PlusCircleIcon className="w-5 h-5"/>}
          className="w-full sm:w-auto"
        >
          <span className="sm:hidden">Pridėti užsakymą</span>
          <span className="hidden sm:inline">Pridėti naują užsakymą</span>
        </Button>
      </div>

      <div className="p-3 sm:p-4 bg-neutral-50 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
              <label htmlFor="filterType" className="block text-sm font-medium text-neutral-700 mb-1">Filtruoti pagal:</label>
              <select 
                  id="filterType"
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value as 'date' | 'month' | 'all')}
                  className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 text-sm"
              >
                  <option value="date">Dieną</option>
                  <option value="month">Mėnesį</option>
                  <option value="all">Visus</option>
              </select>
          </div>
          {filterType === 'date' && (
              <Input 
                  label="Pasirinkite datą"
                  type="date" 
                  value={filterDate} 
                  onChange={(e) => setFilterDate(e.target.value)}
                  containerClassName="mb-0"
              />
          )}
          {filterType === 'month' && (
              <Input
                  label="Pasirinkite mėnesį"
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  containerClassName="mb-0"
              />
          )}
        </div>
      </div>
      
      <OrderList orders={filteredOrders} onEditOrder={openModalToEdit} />

      {isModalOpen && (
        <OrderForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          orderToEdit={orderToEdit}
        />
      )}
    </div>
  );
};

export default OrdersView;