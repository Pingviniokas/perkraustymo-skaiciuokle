
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

interface LoginViewProps {
  onLoginSuccess: (code: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code) {
      setError('Įveskite prisijungimo kodą.');
      return;
    }
    // Perduodam kodą į App.tsx patikrinimui
    onLoginSuccess(code); 
    // Klaidos pranešimą rodys App.tsx per alert(), arba galime patobulinti, kad perduotų atgal klaidą
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
                src="https://mesjaucia.lt/wp-content/themes/mjcDesign/images/logoMJC.png" 
                alt="MES JAU ČIA Logo" 
                className="h-20 mx-auto mb-4" 
              />
            <h1 className="text-3xl font-bold text-neutral-800">MES JAU ČIA skaičiuolė</h1>
            <p className="text-neutral-600">Prašome prisijungti</p>
          </div>
        <Card title="Prisijungimas">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Prisijungimo Kodas"
              type="password" // Galima naudoti 'text' arba 'password'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Įveskite kodą"
              error={error}
              containerClassName="mb-0"
            />
            <Button type="submit" variant="primary" className="w-full">
              Prisijungti
            </Button>
          </form>
        </Card>
        <footer className="text-center p-4 text-sm text-neutral-500 mt-8">
            © {new Date().getFullYear()} MES JAU ČIA
        </footer>
      </div>
    </div>
  );
};

export default LoginView;