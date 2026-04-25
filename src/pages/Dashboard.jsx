import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    weekConsultations: 0,
    noReturnPatients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Total de pacientes ativos
        const { count: totalPatients } = await supabase
          .from('pacientes')
          .select('*', { count: 'exact', head: true })
          .eq('nutricionista_id', user.id);

        // 2. Consultas da semana
        const now = new Date();
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        // Buscar IDs de pacientes deste nutricionista para filtrar consultas
        const { data: myPatients } = await supabase
          .from('pacientes')
          .select('id')
          .eq('nutricionista_id', user.id);
        
        const patientIds = myPatients?.map(p => p.id) || [];

        let weekConsultations = 0;
        if (patientIds.length > 0) {
          const { count } = await supabase
            .from('consultas')
            .select('*', { count: 'exact', head: true })
            .in('paciente_id', patientIds)
            .gte('data_consulta', firstDayOfWeek.toISOString().split('T')[0])
            .lte('data_consulta', lastDayOfWeek.toISOString().split('T')[0]);
          weekConsultations = count || 0;
        }

        // 3. Pacientes sem retorno (> 30 dias e sem agendamento futuro)
        // Lógica: Buscar todas as últimas consultas de cada paciente
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Esta é uma query simplificada. Para um sistema real, poderíamos usar um RPC ou View.
        // Aqui buscaremos os pacientes e suas consultas para filtrar no cliente.
        const { data: patientsWithConsultations } = await supabase
          .from('pacientes')
          .select(`
            id,
            nome,
            consultas (
              data_consulta,
              proximo_retorno
            )
          `)
          .eq('nutricionista_id', user.id);

        const noReturnPatients = patientsWithConsultations?.filter(patient => {
          const consultations = patient.consultas || [];
          if (consultations.length === 0) return false; // Se nunca consultou, talvez não conte como "sem retorno" de consulta

          // Ordenar por data de consulta descendente
          const sortedConsultations = [...consultations].sort((a, b) => 
            new Date(b.data_consulta) - new Date(a.data_consulta)
          );

          const lastConsultation = sortedConsultations[0];
          const lastDate = new Date(lastConsultation.data_consulta);
          
          // Verificar se a última foi há mais de 30 dias
          const isOld = lastDate < thirtyDaysAgo;

          // Verificar se há algum retorno futuro
          const hasFutureReturn = consultations.some(c => 
            c.proximo_retorno && new Date(c.proximo_retorno) >= new Date()
          );

          return isOld && !hasFutureReturn;
        }) || [];

        setStats({
          totalPatients: totalPatients || 0,
          weekConsultations: weekConsultations,
          noReturnPatients: noReturnPatients
        });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="loading">Carregando dados...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1 className="page-title">Bem-vindo, Nutri</h1>
        <p className="auth-subtitle">Aqui está o resumo do seu consultório hoje.</p>
      </header>

      <div className="dashboard-grid">
        {/* Card 1: Total de Pacientes */}
        <div className="info-card">
          <div className="card-header">
            <span className="card-title">Total de Pacientes</span>
            <div className="card-icon-wrapper">
              <Users size={20} />
            </div>
          </div>
          <div className="card-value">{stats.totalPatients}</div>
          <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>Pacientes ativos</p>
        </div>

        {/* Card 2: Consultas da Semana */}
        <div className="info-card">
          <div className="card-header">
            <span className="card-title">Consultas da Semana</span>
            <div className="card-icon-wrapper">
              <Calendar size={20} />
            </div>
          </div>
          <div className="card-value">{stats.weekConsultations}</div>
          <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>Agendadas para esta semana</p>
        </div>

        {/* Card 3: Pacientes sem Retorno */}
        <div className="info-card" style={{ gridRow: 'span 2' }}>
          <div className="card-header">
            <span className="card-title">Pacientes sem Retorno</span>
            <div className="card-icon-wrapper" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          
          {stats.noReturnPatients.length > 0 ? (
            <ul className="patient-list">
              {stats.noReturnPatients.map(patient => (
                <li key={patient.id} className="patient-item">
                  <Link to={`/pacientes/${patient.id}`} className="patient-link">
                    {patient.nome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Nenhum paciente sem retorno no momento</p>
          )}
        </div>
      </div>
    </div>
  );
}
