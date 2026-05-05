import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, User, Activity, Calendar, Save, Plus, 
  FileText, TrendingUp, Clock, Check, AlertCircle, X 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [activeSection, setActiveSection] = useState('dados'); // dados, consultas, planos
  const [activeTab, setActiveTab] = useState('pessoal'); // for Section 1 sub-tabs
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Meal Plan States
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // Plan being generated/edited
  const [viewingPlan, setViewingPlan] = useState(null); // Historical plan being viewed
  
  // Consultation Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditingConsultation, setIsEditingConsultation] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Patient
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // 2. Fetch Consultations
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: true });

      if (consultationError) throw consultationError;
      setConsultations(consultationData);

      // 3. Fetch Meal Plans (Placeholder logic for now)
      const { data: planData, error: planError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });

      if (planError) throw planError;
      setMealPlans(planData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handle Patient Input Change
  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setPatient(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleMultiSelect = (name, value) => {
    setPatient(prev => {
      const current = prev[name] || [];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(v => v !== value) };
      }
      return { ...prev, [name]: [...current, value] };
    });
  };

  // Save Patient Edits
  const handleSavePatient = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(patient)
        .eq('id', id);

      if (error) throw error;
      
      setSuccessMsg('Alterações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Save New or Edit Consultation
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const consultationData = {
        ...newConsultation,
        paciente_id: id,
        peso: parseFloat(newConsultation.peso) || null,
        cintura: parseFloat(newConsultation.cintura) || null,
        quadril: parseFloat(newConsultation.quadril) || null,
        percentual_gordura: parseFloat(newConsultation.percentual_gordura) || null,
      };

      if (isEditingConsultation) {
        const { error } = await supabase
          .from('consultas')
          .update(consultationData)
          .eq('id', newConsultation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('consultas')
          .insert([consultationData]);
        if (error) throw error;
      }

      setShowModal(false);
      setIsEditingConsultation(false);
      setNewConsultation({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      fetchData(); // Refresh list and chart
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      alert('Erro ao salvar consulta.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditConsultationClick = (consultation) => {
    setNewConsultation({
      ...consultation,
      peso: consultation.peso?.toString() || '',
      cintura: consultation.cintura?.toString() || '',
      quadril: consultation.quadril?.toString() || '',
      percentual_gordura: consultation.percentual_gordura?.toString() || '',
    });
    setIsEditingConsultation(true);
    setShowModal(true);
  };

  // Meal Plan Functions
  const handleCreateManualPlan = () => {
    const blankPlan = [
      "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
    ].map(dia => ({
      dia,
      refeicoes: {
        cafe_da_manha: ["", "", "", "", ""],
        lanche_manha: ["", "", "", "", ""],
        almoco: ["", "", "", "", ""],
        lanche_tarde: ["", "", "", "", ""],
        jantar: ["", "", "", "", ""]
      }
    }));
    setCurrentPlan(blankPlan);
    setViewingPlan(null);
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setCurrentPlan(null);
    setViewingPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-plano', {
        body: { patientData: patient },
      });

      if (error) throw error;
      
      setCurrentPlan(data.plano_semanal);
      setSuccessMsg('Plano gerado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      let errorMsg = 'Verifique sua conexão.';
      if (error.context) {
        try {
          const body = await error.context.json();
          errorMsg = body.details || body.error || error.message;
        } catch (e) {
          errorMsg = error.message;
        }
      } else {
        errorMsg = error.message;
      }
      alert('Erro ao gerar plano alimentar com IA: ' + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: id,
          conteudo: { plano_semanal: currentPlan }
        }]);

      if (error) throw error;

      setSuccessMsg('Plano alimentar salvo com sucesso!');
      setCurrentPlan(null);
      fetchData(); // Refresh history
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano alimentar.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlan = (dayIndex, mealKey, optionIndex, newValue) => {
    const updatedPlan = JSON.parse(JSON.stringify(currentPlan));
    updatedPlan[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setCurrentPlan(updatedPlan);
  };

  const handleViewPlan = (plan) => {
    setViewingPlan(plan.conteudo.plano_semanal);
    setCurrentPlan(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Chart Data Preparation
  const chartData = consultations.map(c => ({
    data: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: c.peso
  }));

  if (loading) {
    return (
      <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '1rem', color: 'var(--text-light)' }}>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="patient-profile-container">
      {/* Header */}
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/pacientes')} 
            className="btn-icon"
            title="Voltar"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="page-title">{patient?.nome}</h1>
            <p className="auth-subtitle">Prontuário e Acompanhamento</p>
          </div>
        </div>
        
        {successMsg && (
          <div className="success-toast">
            <Check size={18} />
            {successMsg}
          </div>
        )}
      </header>

      {/* Main Navigation Tabs */}
      <div className="profile-nav">
        <button 
          className={`profile-nav-item ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={20} />
          Dados do Paciente
        </button>
        <button 
          className={`profile-nav-item ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <Activity size={20} />
          Consultas
        </button>
        <button 
          className={`profile-nav-item ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <FileText size={20} />
          Planos Alimentares
        </button>
      </div>

      {/* Section Content */}
      <div className="profile-section-content">
        
        {/* SECTION 1: DADOS */}
        {activeSection === 'dados' && (
          <div className="tabs-container">
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveTab('pessoal')}
              >
                Pessoal
              </button>
              <button 
                className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveTab('clinico')}
              >
                Clínico
              </button>
              <button 
                className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveTab('habitos')}
              >
                Hábitos
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'pessoal' && (
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nome Completo</label>
                    <input 
                      type="text" 
                      name="nome"
                      className="form-input" 
                      value={patient.nome || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input 
                      type="date" 
                      name="data_nascimento"
                      className="form-input" 
                      value={patient.data_nascimento || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input 
                      type="text" 
                      name="whatsapp"
                      className="form-input" 
                      value={patient.whatsapp || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      value={patient.email || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'clinico' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Peso Inicial (kg)</label>
                    <input 
                      type="number" 
                      name="peso_inicial"
                      className="form-input" 
                      value={patient.peso_inicial || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Altura (cm)</label>
                    <input 
                      type="number" 
                      name="altura"
                      className="form-input" 
                      value={patient.altura || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Objetivos</label>
                    <div className="checkbox-group">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral'].map(obj => (
                        <label key={obj} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={(patient.objetivos || []).includes(obj)}
                            onChange={() => handleMultiSelect('objetivos', obj)}
                          />
                          {obj}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Patologias</label>
                    <textarea 
                      name="patologias_texto"
                      className="form-input" 
                      style={{ height: '80px', paddingLeft: '1rem' }}
                      value={patient.patologias_texto || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'habitos' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Refeições/dia</label>
                    <input 
                      type="number" 
                      name="refeicoes_por_dia"
                      className="form-input" 
                      value={patient.refeicoes_por_dia || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Água/dia (L)</label>
                    <input 
                      type="number" 
                      name="litros_agua"
                      step="0.1"
                      className="form-input" 
                      value={patient.litros_agua || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Observações Gerais</label>
                    <textarea 
                      name="observacoes"
                      className="form-input" 
                      style={{ height: '120px', paddingLeft: '1rem' }}
                      value={patient.observacoes || ''}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSavePatient}
                disabled={saving}
                style={{ width: 'auto' }}
              >
                {saving ? 'Salvando...' : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: CONSULTAS */}
        {activeSection === 'consultas' && (
          <div className="consultations-section">
            {/* Weight Evolution Chart */}
            <div className="chart-container info-card" style={{ marginBottom: '2rem', height: '400px' }}>
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} />
                  Evolução de Peso
                </h3>
              </div>
              
              {consultations.length > 0 ? (
                <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="data" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="kg" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="var(--primary-color)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPeso)" 
                        dot={{ r: 6, fill: 'var(--primary-color)', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart">
                  <Activity size={48} />
                  <p>Nenhuma consulta registrada ainda</p>
                </div>
              )}
            </div>

            {/* List Header */}
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="section-subtitle">Histórico de Consultas</h3>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => { setIsEditingConsultation(false); setShowModal(true); }}>
                <Plus size={20} />
                Nova Consulta
              </button>
            </div>

            {/* Consultations List */}
            <div className="consultations-list">
              {consultations.length > 0 ? (
                [...consultations].reverse().map(c => (
                  <div key={c.id} className="info-card consultation-item" style={{ marginBottom: '1rem' }}>
                    <div className="consultation-grid">
                      <div className="consultation-info">
                        <div className="consultation-date">
                          <Calendar size={16} />
                          {formatDate(c.data_consulta)}
                        </div>
                        <div className="consultation-metrics">
                          <div className="metric">
                            <span className="label">Peso</span>
                            <span className="value">{c.peso} kg</span>
                          </div>
                          {c.cintura && (
                            <div className="metric">
                              <span className="label">Cintura</span>
                              <span className="value">{c.cintura} cm</span>
                            </div>
                          )}
                          {c.quadril && (
                            <div className="metric">
                              <span className="label">Quadril</span>
                              <span className="value">{c.quadril} cm</span>
                            </div>
                          )}
                          {c.percentual_gordura && (
                            <div className="metric">
                              <span className="label">% Gordura</span>
                              <span className="value">{c.percentual_gordura}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {c.observacoes && (
                        <div className="consultation-obs">
                          <span className="label">Observações:</span>
                          <p>{c.observacoes}</p>
                        </div>
                      )}
                      
                      {c.proximo_retorno && (
                        <div className="consultation-footer">
                          <span className="next-return">
                            <Clock size={14} />
                            Próximo retorno: {formatDate(c.proximo_retorno)}
                          </span>
                        </div>
                      )}

                      <div className="consultation-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-sm" 
                          style={{ 
                            background: 'var(--secondary-color)', 
                            color: 'var(--primary-color)',
                            width: 'auto',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem'
                          }}
                          onClick={() => handleEditConsultationClick(c)}
                        >
                          Editar Consulta
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-list">
                  <p>Nenhuma consulta encontrada.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: PLANOS */}
        {activeSection === 'planos' && (
          <div className="plans-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="section-subtitle">Planos Alimentares</h3>
              {!currentPlan && !viewingPlan && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn" 
                    style={{ width: 'auto', background: 'var(--secondary-color)', color: 'var(--primary-color)' }} 
                    onClick={handleCreateManualPlan}
                  >
                    <Plus size={20} />
                    Criar Plano Manualmente
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: 'auto' }} 
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: '#fff' }}></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Activity size={20} />
                        Gerar Plano Alimentar com IA
                      </>
                    )}
                  </button>
                </div>
              )}
              {(currentPlan || viewingPlan) && (
                <button 
                  className="btn" 
                  style={{ width: 'auto', background: '#f1f5f9' }} 
                  onClick={() => { setCurrentPlan(null); setViewingPlan(null); }}
                >
                  Voltar ao Histórico
                </button>
              )}
            </div>

            {/* AI Generation Loading State */}
            {isGenerating && (
              <div className="info-card" style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
                <h3 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>A IA está elaborando o plano...</h3>
                <p style={{ color: 'var(--text-light)' }}>Isso pode levar alguns segundos dependendo da complexidade.</p>
              </div>
            )}

            {/* Generated/Editable Plan Display */}
            {(currentPlan || viewingPlan) && (
              <div className="meal-plan-display">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {viewingPlan ? 'Visualizando Plano Salvo' : 'Novo Plano Alimentar Semanal'}
                  </h4>
                  {currentPlan && (
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSavePlan} disabled={saving}>
                      <Save size={18} />
                      {saving ? 'Salvando...' : 'Salvar Plano'}
                    </button>
                  )}
                </div>

                <div className="days-grid">
                  {(currentPlan || viewingPlan).map((day, dIdx) => (
                    <div key={day.dia} className="day-card info-card" style={{ marginBottom: '2rem' }}>
                      <div className="card-header" style={{ borderBottom: '2px solid var(--secondary-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ color: 'var(--primary-color)', fontSize: '1.25rem' }}>{day.dia}</h3>
                      </div>
                      
                      <div className="meals-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {Object.entries(day.refeicoes).map(([mealKey, options]) => (
                          <div key={mealKey} className="meal-group">
                            <h5 style={{ 
                              textTransform: 'capitalize', 
                              marginBottom: '0.75rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              color: 'var(--text-dark)',
                              fontWeight: 700
                            }}>
                              {mealKey.replace(/_/g, ' ')}
                            </h5>
                            <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {options.map((option, oIdx) => (
                                <div key={oIdx} style={{ position: 'relative' }}>
                                  <input 
                                    type="text" 
                                    className="form-input" 
                                    style={{ fontSize: '0.9rem', padding: '0.6rem 0.75rem' }}
                                    value={option}
                                    onChange={(e) => handleEditPlan(dIdx, mealKey, oIdx, e.target.value)}
                                    disabled={!!viewingPlan}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History List */}
            {!currentPlan && !viewingPlan && !isGenerating && (
              <div className="plans-history">
                {mealPlans.length > 0 ? (
                  mealPlans.map(plan => (
                    <div 
                      key={plan.id} 
                      className="info-card plan-item" 
                      style={{ marginBottom: '1rem', cursor: 'pointer' }}
                      onClick={() => handleViewPlan(plan)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div className="card-icon-wrapper">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Plano Alimentar</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Gerado em {formatDate(plan.created_at)}</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>Nenhum plano alimentar gerado ainda.</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', marginTop: '1.5rem' }} 
                      onClick={handleGeneratePlan}
                    >
                      Gerar Primeiro Plano
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content auth-card" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="auth-title" style={{ margin: 0 }}>
                {isEditingConsultation ? 'Editar Consulta' : 'Nova Consulta'}
              </h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Data da Consulta</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newConsultation.data_consulta}
                    onChange={(e) => setNewConsultation({...newConsultation, data_consulta: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input" 
                    placeholder="00.0"
                    value={newConsultation.peso}
                    onChange={(e) => setNewConsultation({...newConsultation, peso: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">% Gordura</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input" 
                    placeholder="00.0"
                    value={newConsultation.percentual_gordura}
                    onChange={(e) => setNewConsultation({...newConsultation, percentual_gordura: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cintura (cm)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="00"
                    value={newConsultation.cintura}
                    onChange={(e) => setNewConsultation({...newConsultation, cintura: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quadril (cm)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="00"
                    value={newConsultation.quadril}
                    onChange={(e) => setNewConsultation({...newConsultation, quadril: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Próximo Retorno</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newConsultation.proximo_retorno}
                    onChange={(e) => setNewConsultation({...newConsultation, proximo_retorno: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Observações</label>
                  <textarea 
                    className="form-input" 
                    style={{ height: '100px', paddingLeft: '1rem' }}
                    value={newConsultation.observacoes}
                    onChange={(e) => setNewConsultation({...newConsultation, observacoes: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : (isEditingConsultation ? 'Atualizar Consulta' : 'Salvar Consulta')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Styles for Profile */}
      <style>{`
        .profile-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: #fff;
          padding: 0.5rem;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          width: fit-content;
        }
        
        .profile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          background: none;
          border-radius: 12px;
          color: var(--text-light);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .profile-nav-item:hover {
          color: var(--primary-color);
          background: var(--secondary-color);
        }
        
        .profile-nav-item.active {
          background: var(--primary-color);
          color: #fff;
        }
        
        .btn-icon {
          background: #fff;
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          border-radius: 10px;
          cursor: pointer;
          color: var(--text-light);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .btn-icon:hover {
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
        
        .success-toast {
          background: #dcfce7;
          color: #166534;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          animation: slideInRight 0.3s ease;
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .empty-chart {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          gap: 1rem;
          opacity: 0.5;
        }
        
        .consultation-item {
          transition: all 0.2s;
        }
        
        .consultation-item:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }
        
        .consultation-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .consultation-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--primary-color);
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        
        .consultation-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
        }
        
        .metric {
          display: flex;
          flex-direction: column;
        }
        
        .metric .label {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        
        .metric .value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        
        .consultation-obs {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.95rem;
          color: var(--text-dark);
          line-height: 1.5;
        }
        
        .consultation-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }
        
        .next-return {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: var(--text-light);
          font-weight: 500;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(16, 185, 129, 0.2);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
