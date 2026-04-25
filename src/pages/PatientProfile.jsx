import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Activity, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data, error } = await supabase
          .from('pacientes')
          .select('nome')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPatient(data);
      } catch (error) {
        console.error('Erro ao buscar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  return (
    <div className="patient-profile-container">
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/pacientes')} 
          className="btn" 
          style={{ width: 'auto', background: 'none', padding: '0.5rem', color: 'var(--text-light)' }}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title">Perfil do Paciente</h1>
          <p className="auth-subtitle">
            {loading ? 'Carregando...' : patient?.nome || 'Paciente não encontrado'}
          </p>
        </div>
      </header>

      <div className="empty-state" style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', borderRadius: '24px' }}>
        <User size={48} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Perfil em Construção</h2>
        <p style={{ color: 'var(--text-light)' }}>
          Em breve você poderá visualizar todos os detalhes, evolução e planos alimentares deste paciente.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto', marginTop: '2rem', marginInline: 'auto' }}
          onClick={() => navigate('/pacientes')}
        >
          Voltar para Lista
        </button>
      </div>
    </div>
  );
}
