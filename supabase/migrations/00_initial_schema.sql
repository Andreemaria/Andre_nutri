-- Initial Schema for Sitema Nutricionista

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.nutricionistas (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutricionista_id UUID REFERENCES public.nutricionistas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    sexo TEXT,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    peso_inicial NUMERIC,
    altura NUMERIC,
    objetivos TEXT[],
    objetivo_texto TEXT,
    nivel_atividade TEXT,
    patologias TEXT[],
    patologias_texto TEXT,
    restricoes_alimentares TEXT[],
    restricoes_alimentares_texto TEXT,
    alergias TEXT[],
    alergias_texto TEXT,
    medicamentos TEXT,
    suplementos TEXT,
    refeicoes_por_dia INTEGER,
    horario_acorda TEXT,
    horario_dorme TEXT,
    litros_agua NUMERIC,
    atividade_fisica BOOLEAN DEFAULT FALSE,
    atividade_fisica_descricao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_consulta DATE NOT NULL DEFAULT CURRENT_DATE,
    peso NUMERIC,
    cintura NUMERIC,
    quadril NUMERIC,
    percentual_gordura NUMERIC,
    observacoes TEXT,
    proximo_retorno DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planos_alimentares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.nutricionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Nutricionistas
CREATE POLICY "Nutricionistas podem ver seus próprios dados" ON public.nutricionistas
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Nutricionistas podem inserir seus próprios dados" ON public.nutricionistas
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Nutricionistas podem atualizar seus próprios dados" ON public.nutricionistas
    FOR UPDATE USING (auth.uid() = id);

-- Pacientes (Filtrados por nutricionista_id)
CREATE POLICY "Nutricionistas podem ver seus pacientes" ON public.pacientes
    FOR SELECT USING (auth.uid() = nutricionista_id);

CREATE POLICY "Nutricionistas podem gerenciar seus pacientes" ON public.pacientes
    FOR ALL USING (auth.uid() = nutricionista_id);

-- Consultas (Através do nutricionista_id do paciente)
CREATE POLICY "Nutricionistas podem ver consultas dos seus pacientes" ON public.consultas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.consultas.paciente_id
            AND public.pacientes.nutricionista_id = auth.uid()
        )
    );

CREATE POLICY "Nutricionistas podem gerenciar consultas dos seus pacientes" ON public.consultas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.consultas.paciente_id
            AND public.pacientes.nutricionista_id = auth.uid()
        )
    );

-- Planos Alimentares
CREATE POLICY "Nutricionistas podem ver planos dos seus pacientes" ON public.planos_alimentares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.planos_alimentares.paciente_id
            AND public.pacientes.nutricionista_id = auth.uid()
        )
    );

CREATE POLICY "Nutricionistas podem gerenciar planos dos seus pacientes" ON public.planos_alimentares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.planos_alimentares.paciente_id
            AND public.pacientes.nutricionista_id = auth.uid()
        )
    );
