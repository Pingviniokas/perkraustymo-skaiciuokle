import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Order, PaymentMethod, Employee, ServiceType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { PAYMENT_METHODS_OPTIONS, SERVICE_TYPE_OPTIONS, MOVING_KM_RATE, CRANE_RENTAL_KM_RATE, VAN_RATE_CLIENT, MOVER_RATE_CLIENT } from '../../constants';
import { calculateOrderAmount, calculateEmployeeCostForOrder } from '../../utils/calculations';
import { formatCurrency, getCurrentDateISO, getCurrentDateTimeLocal, isWeekend, calculateDurationHours } from '../../utils/helpers';
// Fix: Updated icon imports to use available icons and remove missing ones.
import { CalendarDaysIcon, ClockIcon, CurrencyEuroIcon, TruckIcon, UsersIcon, CheckCircleIcon } from '../../components/icons/Icons';
import Textarea from '../../components/ui/Textarea'; // Ensured relative path


interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

interface OrderFormData {
  serviceType: ServiceType;
  orderDate: string;
  startTime: string; // Now just time format like "09:00"
  endTime: string;   // Now just time format like "17:00"
  clientName: string;
  paymentMethod: PaymentMethod;
  orderSpecificExpenses: number;
  assignedEmployeeIds: string[];
  notes: string;
  applyWeekdayOvertime: boolean;
  extraKilometers: number;
  orderAmountInput: string; 
  isPaid?: boolean;
}


const OrderForm: React.FC<OrderFormProps> = ({ isOpen, onClose, orderToEdit }) => {
  const { addOrder, updateOrder, employees } = useAppContext();

  // Helper function to combine date and time into datetime-local format
  const combineDateAndTime = (date: string, time: string): string => {
    return `${date}T${time}`;
  };

  // Helper function to extract time from datetime-local format
  const extractTimeFromDateTime = (dateTime: string): string => {
    return dateTime.split('T')[1] || "09:00";
  };
  
  const getInitialFormData = (): OrderFormData => ({
    serviceType: ServiceType.MOVING,
    orderDate: getCurrentDateISO(),
    startTime: "09:00", // Default start time
    endTime: "17:00",   // Default end time
    clientName: '',
    paymentMethod: PaymentMethod.CASH,
    orderSpecificExpenses: 0,
    assignedEmployeeIds: [],
    notes: '',
    applyWeekdayOvertime: false,
    extraKilometers: 0,
    orderAmountInput: '0',
    isPaid: false,
  });

  const [formData, setFormData] = useState<OrderFormData>(getInitialFormData());
  const [calculatedSuggestedAmount, setCalculatedSuggestedAmount] = useState(0);
  const [calculatedEmployeeCost, setCalculatedEmployeeCost] = useState(0);
  const [calculatedKmCost, setCalculatedKmCost] = useState(0);

  // Fix: Added useMemo import from react
  const availableEmployees = useMemo(() => {
    return employees.filter(emp => {
      const empNameLower = emp.name.toLowerCase();
      if (formData.serviceType === ServiceType.MOVING) {
        return !empNameLower.includes('fiskaro');
      } else if (formData.serviceType === ServiceType.CRANE_RENTAL) {
        return empNameLower.includes('fiskaro');
      }
      return true; // Should ideally not happen if serviceType is one of the two
    });
  }, [employees, formData.serviceType]);

  const updateCalculations = useCallback(() => {
    let numMoversForCalc = 0;
    if (formData.serviceType === ServiceType.MOVING) {
        numMoversForCalc = formData.assignedEmployeeIds.filter(empId => {
            const emp = employees.find(e => e.id === empId);
            return emp && !emp.name.toLowerCase().includes('fiskaro');
        }).length;
    }

    // Combine date and time for calculations
    const fullStartTime = combineDateAndTime(formData.orderDate, formData.startTime);
    const fullEndTime = combineDateAndTime(formData.orderDate, formData.endTime);

    const suggestedAmount = calculateOrderAmount(
      formData.serviceType,
      fullStartTime,
      fullEndTime,
      numMoversForCalc, 
      formData.orderDate,
      formData.applyWeekdayOvertime,
      formData.extraKilometers
    );
    setCalculatedSuggestedAmount(suggestedAmount);

    const kmRate = formData.serviceType === ServiceType.MOVING ? MOVING_KM_RATE : CRANE_RENTAL_KM_RATE;
    setCalculatedKmCost(formData.extraKilometers * kmRate);

    const employeeCost = calculateEmployeeCostForOrder(
        fullStartTime,
        fullEndTime,
        formData.assignedEmployeeIds,
        employees
    );
    setCalculatedEmployeeCost(employeeCost);
    
     if (!orderToEdit || formData.orderAmountInput === '0' || 
        (orderToEdit && orderToEdit.orderAmount.toString() === formData.orderAmountInput && 
         (extractTimeFromDateTime(orderToEdit.startTime) !== formData.startTime || 
          extractTimeFromDateTime(orderToEdit.endTime) !== formData.endTime || 
          orderToEdit.assignedEmployeeIds.length !== formData.assignedEmployeeIds.length || // This comparison might need refinement if IDs change but count stays same
          orderToEdit.orderDate !== formData.orderDate || 
          orderToEdit.applyWeekdayOvertime !== formData.applyWeekdayOvertime ||
          orderToEdit.serviceType !== formData.serviceType ||
          orderToEdit.extraKilometers !== formData.extraKilometers
          ))
        ) {
        
        const oldSuggestedAmountForEdit = orderToEdit ? calculateOrderAmount(
            orderToEdit.serviceType, orderToEdit.startTime, orderToEdit.endTime, 
            (orderToEdit.serviceType === ServiceType.MOVING ? orderToEdit.assignedEmployeeIds.filter(id => {
                const emp = employees.find(e => e.id === id);
                return emp && !emp.name.toLowerCase().includes('fiskaro');
            }).length : 0), 
            orderToEdit.orderDate, 
            orderToEdit.applyWeekdayOvertime, orderToEdit.extraKilometers
        ) : 0;

        if (!orderToEdit || parseFloat(formData.orderAmountInput) === oldSuggestedAmountForEdit ) {
             setFormData(prev => ({ ...prev, orderAmountInput: suggestedAmount.toString() }));
        }
    }
  }, [formData.serviceType, formData.startTime, formData.endTime, formData.assignedEmployeeIds, formData.orderDate, formData.applyWeekdayOvertime, formData.extraKilometers, employees, orderToEdit, formData.orderAmountInput]);


  useEffect(() => {
    if (isOpen) {
        if (orderToEdit) {
            setFormData({
                serviceType: orderToEdit.serviceType,
                orderDate: orderToEdit.orderDate,
                startTime: extractTimeFromDateTime(orderToEdit.startTime),
                endTime: extractTimeFromDateTime(orderToEdit.endTime),
                clientName: orderToEdit.clientName,
                paymentMethod: orderToEdit.paymentMethod,
                orderSpecificExpenses: orderToEdit.orderSpecificExpenses,
                assignedEmployeeIds: orderToEdit.assignedEmployeeIds,
                notes: orderToEdit.notes || '',
                applyWeekdayOvertime: orderToEdit.applyWeekdayOvertime,
                extraKilometers: orderToEdit.extraKilometers,
                orderAmountInput: orderToEdit.orderAmount.toString(),
                isPaid: orderToEdit.isPaid,
            });
        } else {
            const initial = getInitialFormData();
             const initialNumMovers = initial.serviceType === ServiceType.MOVING ? initial.assignedEmployeeIds.filter(id => {
                const emp = employees.find(e => e.id === id);
                return emp && !emp.name.toLowerCase().includes('fiskaro');
            }).length : 0;
            const initialSuggestedAmount = calculateOrderAmount(
                initial.serviceType, 
                combineDateAndTime(initial.orderDate, initial.startTime), 
                combineDateAndTime(initial.orderDate, initial.endTime), 
                initialNumMovers,
                initial.orderDate, 
                initial.applyWeekdayOvertime, 
                initial.extraKilometers
            );
            setFormData({...initial, orderAmountInput: initialSuggestedAmount.toString()});
        }
    }
  }, [orderToEdit, isOpen, employees]); 

 useEffect(() => {
    if(isOpen){ 
        updateCalculations();
    }
  }, [isOpen, formData.serviceType, formData.startTime, formData.endTime, formData.assignedEmployeeIds, formData.orderDate, formData.applyWeekdayOvertime, formData.extraKilometers, updateCalculations]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        let newValue: string | number | ServiceType = value;
        if (name === 'orderSpecificExpenses' || name === 'extraKilometers') {
            newValue = parseFloat(value) || 0;
        } else if (name === 'serviceType') {
            const newServiceType = value as ServiceType;
            // Clean up assigned employees if service type changes
            setFormData(prev => {
                const stillValidAssignedEmployees = prev.assignedEmployeeIds.filter(empId => {
                    const employee = employees.find(e => e.id === empId);
                    if (!employee) return false;
                    const empNameLower = employee.name.toLowerCase();
                    if (newServiceType === ServiceType.MOVING) {
                        return !empNameLower.includes('fiskaro');
                    } else if (newServiceType === ServiceType.CRANE_RENTAL) {
                        return empNameLower.includes('fiskaro');
                    }
                    return false; 
                });
                return { ...prev, [name]: newServiceType, assignedEmployeeIds: stillValidAssignedEmployees };
            });
            return; // Return early as setFormData was called with a function

        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => {
      const newAssignedEmployeeIds = prev.assignedEmployeeIds.includes(employeeId)
        ? prev.assignedEmployeeIds.filter(id => id !== employeeId)
        : [...prev.assignedEmployeeIds, employeeId];
      return { ...prev, assignedEmployeeIds: newAssignedEmployeeIds };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOrderAmount = parseFloat(formData.orderAmountInput) || 0;

    // Combine date and time for duration calculation
    const fullStartTime = combineDateAndTime(formData.orderDate, formData.startTime);
    const fullEndTime = combineDateAndTime(formData.orderDate, formData.endTime);
    
    const duration = calculateDurationHours(fullStartTime, fullEndTime);
    if (duration <= 0 && formData.extraKilometers <= 0 && finalOrderAmount <=0) {
        alert("Užsakymo suma, trukmė arba kilometrai turi būti didesni už 0.");
        return;
    }
    if (finalOrderAmount <= 0 && (duration > 0 || formData.extraKilometers > 0) ) {
         if (!window.confirm("Užsakymo suma yra 0 arba mažesnė, nors yra trukmė arba kilometrai. Ar tikrai tęsti?")) {
            return;
         }
    }

    const orderDataForSubmit: Omit<Order, 'id' | 'orderNumber' | 'calculatedNetRevenue'> = {
        serviceType: formData.serviceType,
        orderDate: formData.orderDate,
        startTime: fullStartTime, // Store combined datetime
        endTime: fullEndTime,     // Store combined datetime
        clientName: formData.clientName,
        paymentMethod: formData.paymentMethod,
        orderAmount: finalOrderAmount,
        orderSpecificExpenses: formData.orderSpecificExpenses,
        assignedEmployeeIds: formData.assignedEmployeeIds,
        notes: formData.notes,
        applyWeekdayOvertime: formData.serviceType === ServiceType.MOVING ? formData.applyWeekdayOvertime : false, // Only for MOVING
        extraKilometers: formData.extraKilometers,
        isPaid: formData.paymentMethod === PaymentMethod.CASH ? true : (orderToEdit ? formData.isPaid : false),
    };
    
    if (orderToEdit) {
      updateOrder({ ...orderToEdit, ...orderDataForSubmit });
    } else {
      addOrder(orderDataForSubmit);
    }
    onClose();
  };
  
  const currentOrderIsWeekend = isWeekend(formData.orderDate);
  const finalAmountForProfitCalc = parseFloat(formData.orderAmountInput) || 0;
  const kmRate = formData.serviceType === ServiceType.MOVING ? MOVING_KM_RATE : CRANE_RENTAL_KM_RATE;
  
  const numActualMovers = formData.serviceType === ServiceType.MOVING ? formData.assignedEmployeeIds.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp && !emp.name.toLowerCase().includes('fiskaro');
  }).length : 0;

  const numCraneOperators = formData.serviceType === ServiceType.CRANE_RENTAL ? formData.assignedEmployeeIds.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp && emp.name.toLowerCase().includes('fiskaro');
  }).length : 0;


  const getSectionHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex items-center text-neutral-600 mb-2 mt-4">
      {icon}
      <h4 className="font-semibold ml-2">{title}</h4>
    </div>
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={orderToEdit ? 'Redaguoti užsakymą' : 'Pridėti naują užsakymą'}>
      <form onSubmit={handleSubmit} className="space-y-1">

        {/* Fix: Removed InformationCircleIcon as it's not available */}
        {getSectionHeader("Pagrindinė informacija", null)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Select
            label="Paslaugos tipas"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            options={SERVICE_TYPE_OPTIONS.map(st => ({ value: st, label: st }))}
            required
            containerClassName="mb-3"
            />
            <Input label="Užsakymo data" type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required containerClassName="mb-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input label="Pradžios laikas" type="time" name="startTime" value={formData.startTime} onChange={handleChange} required containerClassName="mb-3" />
            <Input label="Pabaigos laikas" type="time" name="endTime" value={formData.endTime} onChange={handleChange} required containerClassName="mb-3" />
        </div>

        {/* Fix: Replaced UserCircleIcon with UsersIcon */}
        {getSectionHeader("Klientas ir Mokėjimas", <UsersIcon className="w-5 h-5" />)}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input label="Kliento vardas/pavadinimas" type="text" name="clientName" value={formData.clientName} onChange={handleChange} required containerClassName="mb-3"/>
            <Select
            label="Mokėjimo būdas"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={PAYMENT_METHODS_OPTIONS.map(pm => ({ value: pm, label: pm }))}
            required
            containerClassName="mb-3"
            />
        </div>
        
        {getSectionHeader("Kainodara", <CurrencyEuroIcon className="w-5 h-5" />)}
        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 mb-3">
            <p className="text-xs text-neutral-500 mb-1">Automatiškai apskaičiuota (siūloma) suma: <span className="font-semibold text-neutral-700">{formatCurrency(calculatedSuggestedAmount)}</span></p>
             {formData.extraKilometers > 0 && <p className="text-xs text-neutral-500 mb-1">Iš jų kilometrų kaina: <span className="font-semibold text-neutral-700">{formatCurrency(calculatedKmCost)}</span> ({formatCurrency(kmRate)}/km)</p>}
            <Input 
                label="Užsakymo suma (€)" 
                type="number" 
                name="orderAmountInput" 
                value={formData.orderAmountInput} 
                onChange={handleChange} 
                step="0.01" 
                required
                containerClassName="mb-2"
            />
            {formData.serviceType === ServiceType.MOVING && (
                <div className="flex items-center space-x-2 mt-1">
                    <input
                        type="checkbox"
                        id="applyWeekdayOvertime"
                        name="applyWeekdayOvertime"
                        checked={formData.applyWeekdayOvertime}
                        onChange={handleChange}
                        disabled={currentOrderIsWeekend}
                        className="h-4 w-4 text-neutral-800 border-neutral-300 rounded focus:ring-neutral-500"
                    />
                    <label htmlFor="applyWeekdayOvertime" className={`text-sm ${currentOrderIsWeekend ? 'text-neutral-400 italic' : 'text-neutral-700'}`}>
                        Taikyti viršvalandžių tarifą (d.d. po 17 val.)
                        {currentOrderIsWeekend && " (savaitgalį tarifas taikomas automatiškai visai sumai)"}
                    </label>
                </div>
            )}
        </div>

        {/* Fix: Replaced MapPinIcon with TruckIcon */}
        {getSectionHeader("Papildomi kilometrai", <TruckIcon className="w-5 h-5" />)}
        <Input 
            label={`${formData.serviceType === ServiceType.MOVING ? "Papildomi km užmiestyje" : "Papildomi km"} (įvesti bendrą kiekį)`}
            type="number" 
            name="extraKilometers" 
            value={formData.extraKilometers.toString()} 
            onChange={handleChange} 
            step="0.1" 
            min="0"
            containerClassName="mb-3"
        />

        {getSectionHeader("Darbuotojai", <UsersIcon className="w-5 h-5" />)}
         <p className="text-xs text-neutral-500 mb-1 ml-1">
            {formData.serviceType === ServiceType.MOVING 
                ? `Pasirinkite krovėjus. Kaina skaičiuojama pagal: ${numActualMovers} krovėjas(-ai) × ${formatCurrency(MOVER_RATE_CLIENT)}/val + ${formatCurrency(VAN_RATE_CLIENT)}/val už auto.`
                : `Pasirinkite Fiskaro operatorių. Kaina: fiksuota pagal trukmę.` 
            }
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border border-neutral-300 rounded-md max-h-40 overflow-y-auto mb-3">
            {availableEmployees.map(emp => (
              <label key={emp.id} className="flex items-center space-x-2 p-2 rounded hover:bg-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.assignedEmployeeIds.includes(emp.id)}
                  onChange={() => handleEmployeeToggle(emp.id)}
                  className="h-4 w-4 text-neutral-800 border-neutral-300 rounded focus:ring-neutral-500"
                />
                <span className="text-sm text-neutral-700">{emp.name}</span>
              </label>
            ))}
            {availableEmployees.length === 0 && <p className="col-span-full text-xs text-neutral-500 text-center py-2">Nėra tinkamų darbuotojų šiam paslaugos tipui.</p>}
          </div>
        
        {/* Fix: Removed ChatBubbleLeftEllipsisIcon as it's not available */}
        {getSectionHeader("Papildoma informacija", null)}
        <Input label="Papildomos užsakymo išlaidos (€)" type="number" name="orderSpecificExpenses" value={formData.orderSpecificExpenses.toString()} onChange={handleChange} step="0.01" containerClassName="mb-3" />
        <Textarea label="Pastabos (vidinės)" name="notes" value={formData.notes} onChange={handleChange} rows={2} containerClassName="mb-3" />

        <div className="bg-neutral-100 p-3 rounded-md mt-4 space-y-1">
            <h4 className="font-semibold text-neutral-700 text-sm mb-2">Užsakymo suvestinė:</h4>
            <p className="text-sm text-neutral-600">Galutinė užsakymo suma klientui: <span className="font-semibold text-neutral-800">{formatCurrency(finalAmountForProfitCalc)}</span></p>
            <p className="text-sm text-neutral-600">Numatomos darbuotojų sąnaudos: <span className="font-semibold text-red-600">{formatCurrency(calculatedEmployeeCost)}</span></p>
            <p className="text-sm text-neutral-600">Specifinės užsakymo išlaidos: <span className="font-semibold text-red-600">{formatCurrency(formData.orderSpecificExpenses)}</span></p>
            <p className="text-sm text-neutral-600 font-medium">Numatomas grynasis pelnas: <span className={`font-bold ${finalAmountForProfitCalc - calculatedEmployeeCost - formData.orderSpecificExpenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(finalAmountForProfitCalc - calculatedEmployeeCost - formData.orderSpecificExpenses)}</span></p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Atšaukti</Button>
          {/* Fix: Replaced CheckIcon with CheckCircleIcon */}
          <Button type="submit" variant="primary" leftIcon={<CheckCircleIcon className="w-4 h-4"/>}>{orderToEdit ? 'Išsaugoti pakeitimus' : 'Pridėti užsakymą'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderForm;