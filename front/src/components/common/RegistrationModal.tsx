import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { registrationService } from '../../services/registrationService';
import { Check, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de erro e loading
  const [localError, setLocalError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Regras de validação de senha
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasCapitalLetter = /[A-Z]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  // Limpa estados ao fechar ou abrir
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setPassword('');
      setConfirmPassword('');
      setLocalError('');
      setApiError('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setApiError('');

    // Validações locais adicionais
    if (!username.trim() || !email.trim() || !firstName.trim()) {
      setLocalError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!/^[a-zA-Z0-9_@.+-]+$/.test(username)) {
      setLocalError('Nome de usuário inválido. Use apenas letras, números e @/./+/-/_.');
      return;
    }

    if (!hasMinLength || !hasNumber || !hasCapitalLetter) {
      setLocalError('A senha fornecida não atende aos requisitos mínimos de segurança.');
      return;
    }

    if (!passwordsMatch) {
      setLocalError('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await registrationService.createRequest({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      // Trata as mensagens retornadas pela API (que podem ser dicionários com erros específicos)
      if (err.message) {
        setApiError(err.message);
      } else {
        setApiError('Ocorreu um erro ao enviar sua solicitação de cadastro.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirement = (label: string, met: boolean) => (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${met ? 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400' : 'bg-earth-100 text-earth-400 dark:bg-earth-800'}`}>
        <Check size={10} className={met ? 'opacity-100' : 'opacity-40'} />
      </div>
      <span className={met ? 'text-forest-700 dark:text-forest-400 font-medium' : 'text-earth-500 dark:text-earth-400'}>
        {label}
      </span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Cadastro">
      {isSuccess ? (
        <div className="text-center py-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-xl font-bold text-earth-800 dark:text-earth-100">Solicitação Enviada!</h3>
          <p className="text-earth-500 dark:text-earth-400 mt-2 text-sm max-w-sm mx-auto">
            Seu pedido de cadastro para o usuário <strong className="text-earth-700 dark:text-earth-200">@{username}</strong> foi enviado com sucesso.
          </p>
          <p className="text-earth-500 dark:text-earth-400 mt-1 text-xs">
            Um administrador revisará sua solicitação. Você poderá fazer login assim que ela for aprovada.
          </p>
          <button 
            onClick={onClose}
            className="mt-6 px-6 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            Entendido
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || apiError) && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{localError || apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
                Sobrenome
              </label>
              <input 
                type="text" 
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
              Nome de Usuário <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="ex: beto.silva"
              className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex: beto@email.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
          </div>

          <div className="border-t border-earth-100 dark:border-earth-800 pt-3">
            <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
              Senha <span className="text-red-500">*</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
          </div>

          {password && (
            <div className="p-3 bg-earth-50 dark:bg-earth-900/50 rounded-xl border border-earth-200/50 dark:border-earth-800 space-y-1.5 transition-all animate-in fade-in duration-200">
              <span className="block text-[10px] font-semibold text-earth-500 uppercase tracking-wider mb-0.5">Requisitos de Segurança:</span>
              {renderPasswordRequirement('No mínimo 8 caracteres', hasMinLength)}
              {renderPasswordRequirement('Contém pelo menos um número', hasNumber)}
              {renderPasswordRequirement('Contém pelo menos uma letra maiúscula', hasCapitalLetter)}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-shadow text-earth-800 dark:text-earth-100" 
              required 
            />
            {confirmPassword && (
              <div className="mt-1 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-forest-500' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-medium ${passwordsMatch ? 'text-forest-600 dark:text-forest-400' : 'text-red-500'}`}>
                  {passwordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-earth-100 dark:border-earth-800 pt-4 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-200 rounded-xl font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !passwordsMatch || !hasMinLength || !hasNumber || !hasCapitalLetter}
              className="flex-1 py-2.5 bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Cadastro'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
