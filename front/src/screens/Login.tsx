import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { RegistrationModal } from '../components/common/RegistrationModal';
import { Banknote } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await authService.login(username, password);
      await checkAuth(); // Refetches user and updates context
    } catch (err: any) {
      setError(err.message || 'Login falhou. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-earth-50 dark:bg-earth-950 p-4">
      <div className="bg-white dark:bg-earth-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-earth-200 dark:border-earth-800 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forest-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Banknote size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-forest-900 dark:text-forest-100">Finance's House</h1>
          <p className="text-earth-500 mt-2">Bem-vindo ao seu gerenciador financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-bold transition-colors mt-2 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <div className="text-center mt-6 border-t border-earth-100 dark:border-earth-800 pt-4">
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="text-sm font-semibold text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors cursor-pointer"
          >
            Não tem uma conta? Solicitar cadastro
          </button>
        </div>
      </div>

      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />
    </div>
  );
}
