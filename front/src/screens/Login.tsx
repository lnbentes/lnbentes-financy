import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      <div className="bg-white dark:bg-earth-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-earth-200 dark:border-earth-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forest-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-forest-900 dark:text-forest-100">BeTo's House</h1>
          <p className="text-earth-500 mt-2">Bem-vindo ao seu gerenciador ecológico</p>
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
              className="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow" 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-bold transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
