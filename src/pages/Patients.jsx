import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pacientes')
          .select(`
            id,
            nome,
            objetivos,
            objetivo_texto,
            consultas (
              data_consulta
            )
          `)
          .eq('nutricionista_id', user.id)
          .order('nome');

        if (error) throw error;

        // Processar data da última consulta
        const processedPatients = data.map(p => {
          const sortedConsultas = p.consultas?.sort((a, b) => 
            new Date(b.data_consulta) - new Date(a.data_consulta)
          );
          return {
            ...p,
            ultima_consulta: sortedConsultas?.[0]?.data_consulta || 'Nenhuma consulta'
          };
        });

        setPatients(processedPatients);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="patients-container">
      <header className="page-header">
        <h1 className="page-title">Meus Pacientes</h1>
        <p className="auth-subtitle">Gerencie sua lista de pacientes e acompanhamentos.</p>
      </header>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="input-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto', padding: '0.875rem 1.5rem' }}
          onClick={() => navigate('/pacientes/novo')}
        >
          <Plus size={20} />
          Novo Paciente
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando pacientes...</div>
      ) : filteredPatients.length > 0 ? (
        <div className="patients-table-container">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Objetivo Principal</th>
                <th>Última Consulta</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/pacientes/${patient.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="card-icon-wrapper" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <User size={16} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{patient.nome}</span>
                    </div>
                  </td>
                  <td>
                    {patient.objetivos?.[0] || patient.objetivo_texto || 'Não definido'}
                  </td>
                  <td>{patient.ultima_consulta !== 'Nenhuma consulta' ? new Date(patient.ultima_consulta).toLocaleDateString('pt-BR') : 'Nenhuma consulta'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', borderRadius: '24px' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-light)' }}>
            {searchTerm ? 'Nenhum paciente encontrado para essa busca.' : 'Nenhum paciente cadastrado ainda.'}
          </p>
        </div>
      )}
    </div>
  );
}
