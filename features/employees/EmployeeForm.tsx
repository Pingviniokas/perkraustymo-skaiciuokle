
import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { DEFAULT_MOVER_SALARY_RATE } from '../../constants';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

const initialFormData: Omit<Employee, 'id'> = {
  name: '',
  hourlyRate: DEFAULT_MOVER_SALARY_RATE,
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, onClose, employeeToEdit }) => {
  const { addEmployee, updateEmployee } = useAppContext();
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        name: employeeToEdit.name,
        hourlyRate: employeeToEdit.hourlyRate,
      });
    } else {
      setFormData(initialFormData);
    }
    setError(''); 
  }, [employeeToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
        setError('Darbuotojo vardas yra privalomas.');
        return;
    }
    if (formData.hourlyRate <= 0) {
        setError('Valandinis įkainis turi būti didesnis už 0.');
        return;
    }

    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, formData);
    } else {
      addEmployee(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employeeToEdit ? 'Redaguoti darbuotoją' : 'Pridėti naują darbuotoją'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
            label="Darbuotojo vardas" 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
        />
        <Input 
            label="Valandinis įkainis (€)" 
            type="number" 
            name="hourlyRate" 
            value={formData.hourlyRate.toString()} 
            onChange={handleChange} 
            step="0.01" 
            min="0.01"
            required 
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Atšaukti</Button>
          <Button type="submit" variant="primary">{employeeToEdit ? 'Išsaugoti pakeitimus' : 'Pridėti darbuotoją'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeForm;
