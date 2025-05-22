import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

const LoginView: React.FC = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'code' | 'email'>('code');
  
  const { loginWithCode, login } = useAuth();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!code) {
      setError('Įveskite prisijungimo kodą.');
      setLoading(false);
      return;
    }

    try {
      await loginWithCode(code);
    } catch (error: any) {
      setError(error.message || 'Prisijungimo klaida.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Įveskite el. paštą ir slaptažodį.');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
    } catch (error: any) {
      setError(error.message || 'Prisijungimo klaida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img 
            src="https://mesjaucia.lt/wp-content/themes/mjcDesign/images/logoMJC.png" 
            alt="MES JAU ČIA Logo" 
            className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" 
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">MES JAU ČIA skaičiuolė</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">Prašome prisijungti</p>
        </div>
        
        <Card title="Prisijungimas" className="shadow-xl">
          {/* Login Mode Toggle */}
          <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMode('code')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'code' 
                  ? 'bg-white shadow-sm text-neutral-800' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Kodas
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'email' 
                  ? 'bg-white shadow-sm text-neutral-800' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              El. paštas
            </button>
          </div>

          {/* Code Login Form */}
          {loginMode === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4 sm:space-y-6">
              <Input
                label="Prisijungimo Kodas"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Įveskite kodą"
                error={error}
                containerClassName="mb-0"
                disabled={loading}
              />
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                size="md"
                disabled={loading}
              >
                {loading ? 'Prisijungiama...' : 'Prisijungti'}
              </Button>
            </form>
          )}

          {/* Email Login Form */}
          {loginMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-6">
              <Input
                label="El. paštas"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mesjaucia.lt"
                disabled={loading}
              />
              <Input
                label="Slaptažodis"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Įveskite slaptažodį"
                error={error}
                disabled={loading}
              />
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                size="md"
                disabled={loading}
              >
                {loading ? 'Prisijungiama...' : 'Prisijungti'}
              </Button>
            </form>
          )}
        </Card>
        
        <footer className="text-center p-3 sm:p-4 text-xs sm:text-sm text-neutral-500 mt-6 sm:mt-8">
          © {new Date().getFullYear()} MES JAU ČIA
        </footer>
      </div>
    </div>
  );
};

export default LoginView;