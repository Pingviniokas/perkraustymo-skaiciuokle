
import React from 'react';
import { Order, PaymentMethod, ServiceType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '../../components/icons/Icons';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/helpers';
import { calculateDurationHours } from '../../utils/helpers';
import { MOVING_KM_RATE, CRANE_RENTAL_KM_RATE } from '../../constants';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onEditOrder }) => {
  const { deleteOrder, employees, toggleOrderPaidStatus } = useAppContext();

  if (orders.length === 0) {
    return <p className="text-center text-neutral-500 py-8">Nėra užsakymų. Pridėkite naują.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime() || new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(order => {
        const kmRate = order.serviceType === ServiceType.MOVING ? MOVING_KM_RATE : CRANE_RENTAL_KM_RATE;
        const kmCost = order.extraKilometers * kmRate;
        const extraKmLabel = order.serviceType === ServiceType.MOVING ? "KM užmiestyje" : "KM";

        return (
            <Card key={order.id} className="hover:shadow-xl transition-shadow duration-200">
                <div className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 pb-3 border-b border-neutral-200">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-700">{order.clientName}</h3>
                            <p className="text-xs text-neutral-500">Tipas: {order.serviceType}</p>
                            <p className="text-xs text-neutral-500">Užsakymo Nr.: {order.orderNumber}</p>
                            <p className="text-xs text-neutral-500">Data: {formatDate(order.orderDate)}</p>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:text-right">
                            <p className="text-xl font-bold text-neutral-800">{formatCurrency(order.orderAmount)}</p>
                            {order.paymentMethod === PaymentMethod.TRANSFER && (
                                <button 
                                    onClick={() => toggleOrderPaidStatus(order.id)}
                                    className={`mt-1 text-xs font-semibold py-1 px-2 rounded-full flex items-center
                                        ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                    {order.isPaid ? <CheckCircleIcon className="w-4 h-4 mr-1"/> : <XCircleIcon className="w-4 h-4 mr-1"/>}
                                    {order.isPaid ? 'Apmokėta' : 'Laukiama apmokėjimo'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                        <div>
                            <p><span className="font-medium text-neutral-600">Pradžia:</span> {formatDateTime(order.startTime)}</p>
                            <p><span className="font-medium text-neutral-600">Pabaiga:</span> {formatDateTime(order.endTime)}</p>
                            <p><span className="font-medium text-neutral-600">Trukmė:</span> {calculateDurationHours(order.startTime, order.endTime).toFixed(2)} val.</p>
                        </div>
                        <div>
                            <p><span className="font-medium text-neutral-600">Mokėjimo būdas:</span> {order.paymentMethod}</p>
                            <p><span className="font-medium text-neutral-600">Darbuotojai:</span> {order.assignedEmployeeIds.map(id => employees.find(e => e.id === id)?.name).join(', ') || 'N/A'}</p>
                            <p><span className="font-medium text-neutral-600">Užsakymo išlaidos:</span> {formatCurrency(order.orderSpecificExpenses)}</p>
                             {order.extraKilometers > 0 && (
                                <p><span className="font-medium text-neutral-600">{extraKmLabel}:</span> {order.extraKilometers} km ({formatCurrency(kmCost)})</p>
                            )}
                        </div>
                    </div>
                    
                    {order.notes && (
                        <div className="mb-3 p-2 bg-neutral-50 rounded text-xs text-neutral-600">
                            <p className="font-medium">Pastabos:</p>
                            <p>{order.notes}</p>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                        <div>
                            <p className="text-xs text-neutral-500">Pelnas (užsakymas - darbuotojai - spec. išlaidos): 
                                <span className={`font-semibold ${ (order.calculatedNetRevenue || 0) - order.orderSpecificExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency((order.calculatedNetRevenue || 0) - order.orderSpecificExpenses)}
                                </span>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button size="sm" variant="secondary" onClick={() => onEditOrder(order)} leftIcon={<PencilIcon className="w-4 h-4"/>}>
                                Redaguoti
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => {
                                if (window.confirm(`Ar tikrai norite ištrinti užsakymą ${order.orderNumber}?`)) {
                                    deleteOrder(order.id);
                                }
                            }} leftIcon={<TrashIcon className="w-4 h-4"/>}>
                                Trinti
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        )})}
    </div>
  );
};

export default OrderList;