import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Clock, Check, ChevronRight, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function PatientForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pessoal');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Pessoal
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    // Clínico
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologias_texto: '',
    restricoes_alimentares: [],
    restricoes_alimentares_texto: '',
    alergias: [],
    alergias_texto: '',
    medicamentos: '',
    suplementos: '',
    // Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  const [imc, setImc] = useState(0);
  const [idade, setIdade] = useState(0);

  // Calcular IMC e Idade
  useEffect(() => {
    if (formData.peso_inicial && formData.altura) {
      const h = formData.altura / 100;
      setImc((formData.peso_inicial / (h * h)).toFixed(1));
    } else {
      setImc(0);
    }

    if (formData.data_nascimento) {
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setIdade(age);
    } else {
      setIdade(0);
    }
  }, [formData.peso_inicial, formData.altura, formData.data_nascimento]);

  const maskPhone = (value) => {
    if (!value) return "";
    let val = value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    
    if (val.length > 10) {
      return `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
    } else if (val.length > 6) {
      return `(${val.substring(0, 2)}) ${val.substring(2, 6)}-${val.substring(6)}`;
    } else if (val.length > 2) {
      return `(${val.substring(0, 2)}) ${val.substring(2)}`;
    } else {
      return val;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'whatsapp') {
      newValue = maskPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const current = prev[name] || [];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(v => v !== value) };
      }
      return { ...prev, [name]: [...current, value] };
    });
  };

  const formatTime = (value) => {
    if (!value) return '';
    let val = value.toString().replace(/\D/g, '');
    if (val.length <= 2) return val.padStart(2, '0') + ':00';
    if (val.length === 3) return val.substring(0, 1).padStart(2, '0') + ':' + val.substring(1);
    if (val.length === 4) return val.substring(0, 2) + ':' + val.substring(2);
    return val;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      alert('O nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      // Limpar dados para evitar erro de tipo no Postgres (vazio -> null)
      const cleanData = { ...formData };
      
      const numericFields = ['peso_inicial', 'altura', 'refeicoes_por_dia', 'litros_agua'];
      numericFields.forEach(field => {
        if (cleanData[field] === '') cleanData[field] = null;
      });

      if (cleanData.data_nascimento === '') cleanData.data_nascimento = null;

      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          ...cleanData,
          nutricionista_id: user.id,
          // Formatar horários apenas se houver valor
          horario_acorda: cleanData.horario_acorda ? formatTime(cleanData.horario_acorda) : null,
          horario_dorme: cleanData.horario_dorme ? formatTime(cleanData.horario_dorme) : null
        }])
        .select();

      if (error) throw error;

      alert('Paciente cadastrado com sucesso!');
      navigate(`/pacientes/${data[0].id}`);
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      alert(`Erro ao salvar paciente: ${error.message || 'Verifique os dados e tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-form-container">
      <header className="page-header">
        <h1 className="page-title">Novo Paciente</h1>
        <p className="auth-subtitle">Preencha os dados para iniciar o acompanhamento.</p>
      </header>

      <form onSubmit={handleSubmit} className="tabs-container">
        <div className="tabs-header">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            <User size={18} style={{ marginRight: '0.5rem' }} />
            Pessoal
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            <Activity size={18} style={{ marginRight: '0.5rem' }} />
            Clínico
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            <Clock size={18} style={{ marginRight: '0.5rem' }} />
            Hábitos
          </button>
        </div>

        <div className="tab-content">
          {/* Aba 1: Pessoal */}
          {activeTab === 'pessoal' && (
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Nome Completo *</label>
                <input 
                  type="text" 
                  name="nome"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  value={formData.nome}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data de Nascimento</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    name="data_nascimento"
                    className="form-input" 
                    style={{ paddingLeft: '1rem' }}
                    value={formData.data_nascimento}
                    onChange={handleInputChange}
                  />
                  {idade > 0 && <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{idade} anos</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sexo</label>
                <div className="radio-group">
                  {['Feminino', 'Masculino', 'Outro'].map(s => (
                    <label key={s} className="checkbox-item">
                      <input 
                        type="radio" 
                        name="sexo" 
                        value={s} 
                        checked={formData.sexo === s}
                        onChange={handleInputChange}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">WhatsApp / Telefone Principal *</label>
                <input 
                  type="text" 
                  name="whatsapp"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* Aba 2: Clínico */}
          {activeTab === 'clinico' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Peso Atual</label>
                <div className="input-icon-wrapper">
                  <input 
                    type="number" 
                    name="peso_inicial"
                    className="form-input" 
                    style={{ paddingLeft: '1rem' }}
                    value={formData.peso_inicial}
                    onChange={handleInputChange}
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Altura</label>
                <div className="input-icon-wrapper">
                  <input 
                    type="number" 
                    name="altura"
                    className="form-input" 
                    style={{ paddingLeft: '1rem' }}
                    value={formData.altura}
                    onChange={handleInputChange}
                  />
                  <span className="input-suffix">cm</span>
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">IMC (Cálculo Automático)</label>
                <input 
                  type="text" 
                  className="form-input read-only-input" 
                  value={imc} 
                  readOnly 
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Objetivo</label>
                <div className="checkbox-group">
                  {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                    <label key={obj} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={formData.objetivos.includes(obj)}
                        onChange={() => handleMultiSelect('objetivos', obj)}
                      />
                      {obj}
                    </label>
                  ))}
                </div>
                <input 
                  type="text" 
                  name="objetivo_texto"
                  placeholder="Outro objetivo ou observação..." 
                  className="form-input" 
                  style={{ paddingLeft: '1rem', marginTop: '1rem' }}
                  value={formData.objetivo_texto}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Nível de Atividade Física</label>
                <div className="checkbox-group">
                  {['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'].map(lvl => (
                    <label key={lvl} className="checkbox-item">
                      <input 
                        type="radio" 
                        name="nivel_atividade"
                        value={lvl}
                        checked={formData.nivel_atividade === lvl}
                        onChange={handleInputChange}
                      />
                      {lvl}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Patologias, Restrições, Alergias */}
              {[
                { label: 'Patologias ou Condições de Saúde', name: 'patologias', options: ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'] },
                { label: 'Restrições Alimentares', name: 'restricoes_alimentares', options: ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'] },
                { label: 'Alergias Alimentares', name: 'alergias', options: ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'] }
              ].map(section => (
                <div key={section.name} className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">{section.label}</label>
                  <div className="checkbox-group">
                    {section.options.map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={formData[section.name].includes(opt)}
                          onChange={() => handleMultiSelect(section.name, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                    <label className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={formData[section.name].length === 0}
                        onChange={() => setFormData(prev => ({ ...prev, [section.name]: [] }))}
                      />
                      Nenhum
                    </label>
                  </div>
                  <input 
                    type="text" 
                    name={`${section.name}_texto`}
                    placeholder="Adicionar outros..." 
                    className="form-input" 
                    style={{ paddingLeft: '1rem', marginTop: '1rem' }}
                    value={formData[`${section.name}_texto`]}
                    onChange={handleInputChange}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Medicamentos Contínuos</label>
                <textarea 
                  name="medicamentos"
                  className="form-input" 
                  style={{ paddingLeft: '1rem', height: '100px', resize: 'none' }}
                  value={formData.medicamentos}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Suplementos em Uso</label>
                <textarea 
                  name="suplementos"
                  className="form-input" 
                  style={{ paddingLeft: '1rem', height: '100px', resize: 'none' }}
                  value={formData.suplementos}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* Aba 3: Hábitos */}
          {activeTab === 'habitos' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Refeições por dia</label>
                <input 
                  type="number" 
                  name="refeicoes_por_dia"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  value={formData.refeicoes_por_dia}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantidade de Água</label>
                <div className="input-icon-wrapper">
                  <input 
                    type="number" 
                    name="litros_agua"
                    step="0.1"
                    className="form-input" 
                    style={{ paddingLeft: '1rem' }}
                    value={formData.litros_agua}
                    onChange={handleInputChange}
                  />
                  <span className="input-suffix">litros</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Horário que Acorda</label>
                <input 
                  type="number" 
                  name="horario_acorda"
                  placeholder="Ex: 630"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  value={formData.horario_acorda}
                  onChange={handleInputChange}
                />
                <small style={{ color: 'var(--text-light)' }}>Formatado: {formatTime(formData.horario_acorda)}</small>
              </div>
              <div className="form-group">
                <label className="form-label">Horário que Dorme</label>
                <input 
                  type="number" 
                  name="horario_dorme"
                  placeholder="Ex: 2230"
                  className="form-input" 
                  style={{ paddingLeft: '1rem' }}
                  value={formData.horario_dorme}
                  onChange={handleInputChange}
                />
                <small style={{ color: 'var(--text-light)' }}>Formatado: {formatTime(formData.horario_dorme)}</small>
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Pratica Atividade Física?</label>
                <div className="radio-group">
                  <label className="checkbox-item">
                    <input 
                      type="radio" 
                      name="atividade_fisica" 
                      value="true" 
                      checked={formData.atividade_fisica === true}
                      onChange={() => setFormData(prev => ({ ...prev, atividade_fisica: true }))}
                    />
                    Sim
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="radio" 
                      name="atividade_fisica" 
                      value="false" 
                      checked={formData.atividade_fisica === false}
                      onChange={() => setFormData(prev => ({ ...prev, atividade_fisica: false }))}
                    />
                    Não
                  </label>
                </div>
                {formData.atividade_fisica && (
                  <input 
                    type="text" 
                    name="atividade_fisica_descricao"
                    placeholder="Qual atividade e frequência semanal?" 
                    className="form-input" 
                    style={{ paddingLeft: '1rem', marginTop: '1rem' }}
                    value={formData.atividade_fisica_descricao}
                    onChange={handleInputChange}
                  />
                )}
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Observações Gerais</label>
                <textarea 
                  name="observacoes"
                  className="form-input" 
                  style={{ paddingLeft: '1rem', height: '120px', resize: 'none' }}
                  value={formData.observacoes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn" 
            style={{ width: 'auto', background: '#f1f5f9', color: 'var(--text-dark)' }}
            onClick={() => navigate('/pacientes')}
          >
            Cancelar
          </button>
          
          {activeTab !== 'habitos' ? (
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '0.875rem 2rem' }}
              onClick={() => setActiveTab(activeTab === 'pessoal' ? 'clinico' : 'habitos')}
            >
              Próximo
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '0.875rem 2rem' }}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (
                <>
                  <Save size={20} />
                  Salvar Paciente
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
