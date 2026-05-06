import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Activity } from 'lucide-react';

export default function Registration() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar Auth Account
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password 
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // 2. Persistir nome e email em 'nutricionistas' (Assumindo id sendo o auth.uid se assim foi modelado, ou um campo separado)
      // Como a tabela tem RLS, idealmente um trigger resolveria, porem podemos fazer a inserção diretamente se permitido.
      // E usamos fallback de erro p gerenciar a mensagem p o usuário.
      if (authData?.user) {
        const { error: insertError } = await supabase
          .from('nutricionistas')
          .insert([
            { id: authData.user.id, nome: name, email: email }
          ]);

        if (insertError) {
             console.error("Erro ao inserir perfil do nutricionista:", insertError);
             // Não dar um throw duro no cadastro caso o Auth logue, mas alertar
             // E caso sua tabela 'nutricionistas' não tiver PK de 'id' UUID referenciado, pode apenas salvar se tiver ID genérico
        }
      }

      navigate('/dashboard');
    } catch (error) {
      setError(error.message === 'User already registered' ? 'Email já cadastrado.' : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Activity size={32} />
            <span>AndreNutri</span>
          </div>
          <h1 className="auth-title">Crie sua conta</h1>
          <p className="auth-subtitle">Registre-se como perfil profissional</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegistration}>
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <div className="input-icon-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Dra. Maria Clara"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha (mínimo 6 caracteres)</label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar senha</label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processando...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-links">
          <span>Já tem conta? </span>
          <Link to="/">Faça login</Link>
        </div>
      </div>
    </div>
  );
}
