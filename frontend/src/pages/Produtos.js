import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, Loader, AlertCircle,
  ChevronLeft, ChevronRight, Menu, X, Save, HelpCircle, ArrowLeft, Layers
} from 'lucide-react';
import { productService, categoriaService } from '../services/api';

const formatarMoeda = (v) => {
  const n = parseFloat(v) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Estilos compartilhados (estilo ERP)
const cls = {
  label: 'block text-sm text-gray-700 mb-2',
  req: 'text-red-600 font-bold',
  field: 'w-full px-3 py-2.5 h-11 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
  fieldReadonly: 'w-full px-3 py-2.5 h-11 border border-gray-300 rounded text-sm bg-gray-100 text-gray-500',
  fieldSelect: 'w-full px-3 py-2.5 h-11 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 appearance-none bg-no-repeat',
  btnBlue: 'px-4 py-2.5 text-xs font-bold rounded text-white bg-[#1e88e5] hover:bg-[#1976d2] uppercase flex items-center justify-center gap-2',
  btnGray: 'px-4 py-2.5 text-xs font-bold rounded text-white bg-gray-400 hover:bg-gray-500 uppercase flex items-center justify-center gap-2',
  btnDarkBlue: 'px-4 py-2.5 text-xs font-bold rounded text-white bg-[#1565c0] hover:bg-[#0d47a1] uppercase flex items-center justify-center gap-2'
};

// Ícone de ajuda (?) circular azul
const HelpDot = ({ title }) => (
  <span
    title={title}
    className="inline-flex items-center justify-center w-4 h-4 ml-1 bg-blue-500 text-white text-[10px] font-bold rounded-full cursor-help align-middle"
  >?</span>
);

// Toggle SIM/NÃO estilo ERP
const Toggle = ({ value, onChange, leftLabel = 'SIM', rightLabel = 'NÃO', leftColor = 'green', rightColor = 'red' }) => {
  const colorMap = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    teal: 'bg-cyan-600'
  };
  return (
    <div className="inline-flex h-11 rounded overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-7 text-xs font-bold text-white min-w-[75px] ${value ? colorMap[leftColor] : 'bg-gray-400'}`}
      >{leftLabel}</button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-7 text-xs font-bold text-white min-w-[75px] ${!value ? colorMap[rightColor] : 'bg-gray-400'}`}
      >{rightLabel}</button>
    </div>
  );
};

// ============================================
// FORMULÁRIO DE CADASTRO
// ============================================
const ESTADO_INICIAL = {
  codigo: '',
  tipo: 'produto',
  nome: '',
  descricao: '',
  categoria_id: '',
  marca: '',
  modelo: '',
  cor: '',
  tamanho: '',
  unidade_medida: 'UN',
  preco_custo: '',
  quero_lucrar: '',
  perc_lucro: '',
  preco_venda: '',
  comissao: '',
  enviar_sms_previsao: false,
  previsao_retorno_dias: '',
  ativo: true
};

const FormularioProduto = ({ produto, categorias, onVoltar, onSalvo }) => {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [estoqueAtual, setEstoqueAtual] = useState(null);
  const [ultimaMov, setUltimaMov] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('produto');

  // Carrega dados do produto em edição
  useEffect(() => {
    setErro('');
    if (produto) {
      const custo = parseFloat(produto.preco_custo) || 0;
      const venda = parseFloat(produto.preco_venda) || 0;
      setForm({
        codigo: produto.codigo || '',
        tipo: produto.tipo || 'produto',
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        categoria_id: produto.categoria_id || '',
        marca: produto.marca || '',
        modelo: produto.modelo || '',
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        unidade_medida: produto.unidade_medida || 'UN',
        preco_custo: custo ? String(custo).replace('.', ',') : '',
        quero_lucrar: custo && venda ? (venda - custo).toFixed(2).replace('.', ',') : '',
        perc_lucro: produto.margem_lucro != null ? String(produto.margem_lucro).replace('.', ',') : '',
        preco_venda: venda ? String(venda).replace('.', ',') : '',
        comissao: produto.comissao != null ? String(produto.comissao).replace('.', ',') : '',
        enviar_sms_previsao: !!produto.enviar_sms_previsao,
        previsao_retorno_dias: produto.previsao_retorno_dias || '',
        ativo: produto.ativo !== 0
      });
      setEstoqueAtual(produto.estoque_total ?? 0);

      productService.obter(produto.id)
        .then(r => {
          const movs = r.estoque || [];
          const ult = movs.reduce((max, e) => {
            if (!e.updated_at) return max;
            const d = new Date(e.updated_at);
            return (!max || d > max) ? d : max;
          }, null);
          if (ult) setUltimaMov(ult.toLocaleString('pt-BR'));
        })
        .catch(() => {});
    } else {
      setForm(ESTADO_INICIAL);
      setEstoqueAtual(null);
      setUltimaMov('');
    }
  }, [produto]);

  // Cálculo automático: quando custo muda + venda → recalcula quero lucrar e %
  const parseNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;
  const fmtNum = (n, casas = 2) => n.toFixed(casas).replace('.', ',');

  const handleCustoChange = (v) => {
    const custo = parseNum(v);
    const venda = parseNum(form.preco_venda);
    const novoForm = { ...form, preco_custo: v };
    if (custo > 0 && venda > 0) {
      novoForm.quero_lucrar = fmtNum(venda - custo);
      novoForm.perc_lucro = fmtNum(((venda - custo) / custo) * 100);
    }
    setForm(novoForm);
  };

  const handleVendaChange = (v) => {
    const venda = parseNum(v);
    const custo = parseNum(form.preco_custo);
    const novoForm = { ...form, preco_venda: v };
    if (custo > 0 && venda > 0) {
      novoForm.quero_lucrar = fmtNum(venda - custo);
      novoForm.perc_lucro = fmtNum(((venda - custo) / custo) * 100);
    }
    setForm(novoForm);
  };

  const handleQueroLucrarChange = (v) => {
    const lucrar = parseNum(v);
    const custo = parseNum(form.preco_custo);
    const novoForm = { ...form, quero_lucrar: v };
    if (custo > 0) {
      novoForm.preco_venda = fmtNum(custo + lucrar);
      novoForm.perc_lucro = fmtNum((lucrar / custo) * 100);
    }
    setForm(novoForm);
  };

  const handlePercLucroChange = (v) => {
    const perc = parseNum(v);
    const custo = parseNum(form.preco_custo);
    const novoForm = { ...form, perc_lucro: v };
    if (custo > 0) {
      const venda = custo * (1 + perc / 100);
      novoForm.preco_venda = fmtNum(venda);
      novoForm.quero_lucrar = fmtNum(venda - custo);
    }
    setForm(novoForm);
  };

  // Líquido = venda - (venda * comissão%)
  const liquidoCalc = (() => {
    const venda = parseNum(form.preco_venda);
    const com = parseNum(form.comissao);
    if (venda <= 0) return '';
    return fmtNum(venda - (venda * com / 100));
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        codigo: form.codigo === 'Novo' || !form.codigo ? null : form.codigo,
        tipo: form.tipo,
        nome: form.nome,
        descricao: form.descricao,
        categoria_id: form.categoria_id || null,
        marca: form.marca,
        modelo: form.modelo,
        cor: form.cor,
        tamanho: form.tamanho,
        unidade_medida: form.unidade_medida || 'UN',
        preco_custo: parseNum(form.preco_custo),
        preco_venda: parseNum(form.preco_venda),
        comissao: parseNum(form.comissao),
        enviar_sms_previsao: form.enviar_sms_previsao,
        previsao_retorno_dias: parseInt(form.previsao_retorno_dias) || 0,
        ativo: form.ativo
      };
      if (produto) {
        await productService.atualizar(produto.id, payload);
      } else {
        await productService.criar(payload);
      }
      onSalvo();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar produto');
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (s) => s ? new Date(s).toLocaleString('pt-BR') : '';

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      {/* Título + botão voltar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-1.5 rounded hover:bg-gray-100" title="Voltar">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h3 className="text-[#1e88e5] text-base font-bold uppercase tracking-wide">
            Cadastro de Produto ou Serviço
          </h3>
        </div>
        {produto && (
          <span className="text-xs text-gray-500">
            ID #{produto.id}
          </span>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-200 px-2">
        {[
          { id: 'produto', label: 'Produto ou Serviço' },
          { id: 'precos', label: 'Formador de Preços' },
          { id: 'pacote', label: 'Pacote ou Sessão' },
          { id: 'kit', label: 'Kit de Produtos ou Serviços' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAbaAtiva(t.id)}
            className={`px-5 py-3 text-sm border-b-[3px] ${
              abaAtiva === t.id
                ? 'text-[#1e88e5] border-red-500 font-medium'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {abaAtiva !== 'produto' && (
        <div className="p-12 text-center text-gray-400">
          <Layers size={48} className="mx-auto mb-3 text-gray-300" />
          <div className="text-sm">Aba em desenvolvimento</div>
        </div>
      )}

      {abaAtiva === 'produto' && (
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {erro && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="text-sm">{erro}</span>
              </div>
            )}

            {/* LINHA 1: Código (2) | Tipo (2) | Nome (8) */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-2">
                <label className={cls.label}>Código<span className={cls.req}>*</span></label>
                <input type="text" value={produto ? form.codigo : 'Novo'} className={cls.fieldReadonly} readOnly />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>
                  Tipo<span className={cls.req}>*</span>
                  <HelpDot title="Produto físico ou serviço prestado" />
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className={cls.fieldSelect}
                >
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>
              <div className="col-span-8">
                <label className={cls.label}>Nome<span className={cls.req}>*</span></label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  className={cls.field}
                />
              </div>
            </div>

            {/* LINHA 2: Grupo (5) | Marca (4) | Unid. medida (3) */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-5">
                <label className={cls.label}>
                  Grupo<span className={cls.req}>*</span>
                  <HelpDot title="Categoria do produto" />
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className={cls.fieldSelect}
                >
                  <option value="">Selecione...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.pai_nome ? `${c.pai_nome} > ${c.nome}` : c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <label className={cls.label}>Marca</label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  className={cls.field}
                  placeholder="Ex: JBL, Samsung, Apple"
                />
              </div>
              <div className="col-span-3">
                <label className={cls.label}>Unid. medida</label>
                <input
                  type="text"
                  value={form.unidade_medida}
                  onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}
                  className={cls.field}
                  placeholder="UN, CX, PC"
                />
              </div>
            </div>

            {/* LINHA 3: 6 campos de preço */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-2">
                <label className={cls.label}>Custo (R$)</label>
                <input
                  type="text"
                  value={form.preco_custo}
                  onChange={(e) => handleCustoChange(e.target.value)}
                  className={`${cls.field} text-right`}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Quero Lucrar (R$)</label>
                <input
                  type="text"
                  value={form.quero_lucrar}
                  onChange={(e) => handleQueroLucrarChange(e.target.value)}
                  className={`${cls.field} text-right`}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Perc. de Lucro (%)</label>
                <input
                  type="text"
                  value={form.perc_lucro}
                  onChange={(e) => handlePercLucroChange(e.target.value)}
                  className={`${cls.field} text-right`}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <label className={`${cls.label} font-bold`}>
                  Preço venda (R$)<span className={cls.req}>*</span>
                </label>
                <input
                  type="text"
                  value={form.preco_venda}
                  onChange={(e) => handleVendaChange(e.target.value)}
                  className={`${cls.field} text-right font-semibold`}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>
                  Comissão (%)
                  <HelpDot title="Comissão do vendedor sobre essa venda" />
                </label>
                <input
                  type="text"
                  value={form.comissao}
                  onChange={(e) => setForm({ ...form, comissao: e.target.value })}
                  className={`${cls.field} text-right`}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Líquido (R$)</label>
                <input
                  type="text"
                  value={liquidoCalc}
                  className={`${cls.fieldReadonly} text-right`}
                  readOnly
                />
              </div>
            </div>

            {/* LINHA 4: Controla Estoque (3) | Mín (2) | Atual (2) | Última Mov (5) */}
            <div className="grid grid-cols-12 gap-5 items-end">
              <div className="col-span-3">
                <label className={cls.label}>
                  Controla Estoque?
                  <HelpDot title="Quando ativado, controla saldo por loja" />
                </label>
                <Toggle
                  value={true}
                  onChange={() => {}}
                  leftColor="green"
                  rightColor="red"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Estoque mínimo</label>
                <input
                  type="number"
                  className={`${cls.field} text-right`}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Estoque atual</label>
                <input
                  type="text"
                  value={estoqueAtual ?? ''}
                  className={`${cls.fieldReadonly} text-right font-semibold`}
                  readOnly
                />
              </div>
              <div className="col-span-5">
                <label className={cls.label}>Última Movimentação</label>
                <input
                  type="text"
                  value={ultimaMov}
                  className={cls.fieldReadonly}
                  readOnly
                />
              </div>
            </div>

            {/* LINHA 5: SMS Previsão (4) | Previsão dias (3) */}
            <div className="grid grid-cols-12 gap-5 items-end">
              <div className="col-span-4">
                <label className={cls.label}>Enviar SMS da Previsão de Retorno?</label>
                <Toggle
                  value={form.enviar_sms_previsao}
                  onChange={(v) => setForm({ ...form, enviar_sms_previsao: v })}
                  leftColor="green"
                  rightColor="red"
                />
              </div>
              <div className="col-span-3">
                <label className={cls.label}>Previsão de Retorno</label>
                <div className="flex">
                  <input
                    type="number"
                    value={form.previsao_retorno_dias}
                    onChange={(e) => setForm({ ...form, previsao_retorno_dias: e.target.value })}
                    className={`${cls.field} text-right rounded-r-none`}
                    placeholder="0"
                  />
                  <div className="px-4 h-11 flex items-center bg-gray-100 border border-l-0 border-gray-300 rounded-r text-sm text-gray-500">
                    dias
                  </div>
                </div>
              </div>
            </div>

            {/* LINHA 6: Status (3) | Data Cadastro (3) | Data Atualização (3) */}
            <div className="grid grid-cols-12 gap-5 items-end">
              <div className="col-span-3">
                <label className={cls.label}>Status</label>
                <Toggle
                  value={form.ativo}
                  onChange={(v) => setForm({ ...form, ativo: v })}
                  leftLabel="ATIVO"
                  rightLabel="INATIVO"
                  leftColor="teal"
                  rightColor="red"
                />
              </div>
              <div className="col-span-3">
                <label className={cls.label}>Data Cadastro</label>
                <input
                  type="text"
                  value={formatarData(produto?.created_at)}
                  className={cls.fieldReadonly}
                  readOnly
                />
              </div>
              <div className="col-span-3">
                <label className={cls.label}>Data Atualização</label>
                <input
                  type="text"
                  value={formatarData(produto?.updated_at)}
                  className={cls.fieldReadonly}
                  readOnly
                />
              </div>
            </div>

          </div>

          {/* Footer com botões */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Campos marcados com <span className="text-red-600 font-bold">*</span> são obrigatórios
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onVoltar} disabled={salvando} className={cls.btnGray}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" disabled={salvando} className={cls.btnBlue}>
                {salvando ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// ============================================
// LISTA DE PRODUTOS (com toolbar de filtros)
// ============================================
const ListaProdutos = ({ onNovo, onEditar, onAbrirMenu }) => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('true');
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const resp = await productService.listar({
        busca,
        categoria_id: filtroCategoria,
        marca: filtroMarca,
        ativo: filtroAtivo,
        page,
        limit: 20
      });
      setProdutos(resp.produtos || []);
      setTotal(resp.paginacao?.total || 0);
      setTotalPaginas(resp.paginacao?.total_paginas || 1);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroCategoria, filtroMarca, filtroAtivo, page]);

  useEffect(() => {
    categoriaService.listar()
      .then(r => setCategorias(r.categorias || []))
      .catch(() => {});
    productService.listarMarcas()
      .then(r => setMarcas(r.marcas || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const limparFiltros = () => {
    setBusca('');
    setFiltroCategoria('');
    setFiltroMarca('');
    setFiltroTipo('');
    setFiltroAtivo('true');
    setPage(1);
  };

  const desativar = async (produto) => {
    if (!window.confirm(`Desativar o produto "${produto.nome}"?`)) return;
    try {
      await productService.desativar(produto.id);
      carregar();
    } catch (err) {
      alert(err.message || 'Erro ao desativar produto');
    }
  };

  return (
    <>
      {/* Cabeçalho mobile */}
      <div className="lg:hidden mb-3">
        <button onClick={onAbrirMenu} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          <Menu size={20} />
        </button>
      </div>

      {/* TOOLBAR DE FILTROS */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-12 gap-2 mb-2">
          <div className="col-span-3">
            <button onClick={onNovo} className={`${cls.btnBlue} w-full`}>
              <Plus size={16} /> Novo Produto ou Serviço
            </button>
          </div>
          <div className="col-span-3 flex">
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Pesquisar por..."
              className={`${cls.field} rounded-r-none`}
            />
            <button className={`${cls.btnBlue} rounded-l-none px-4`}>
              <Search size={14} /> Pesquisar
            </button>
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => { setFiltroCategoria(e.target.value); setPage(1); }}
            className={`${cls.fieldSelect} col-span-2`}
          >
            <option value="">Grupo...</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.pai_nome ? `${c.pai_nome} > ${c.nome}` : c.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroMarca}
            onChange={(e) => { setFiltroMarca(e.target.value); setPage(1); }}
            className={`${cls.fieldSelect} col-span-2`}
          >
            <option value="">Marca...</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="col-span-2 flex border border-gray-300 rounded overflow-hidden h-11">
            <div className="bg-gray-700 text-white text-[11px] font-bold px-3 flex items-center">TOTAL</div>
            <div className="flex-1 text-center px-3 flex items-center justify-center text-sm font-semibold">
              {total} registros
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <button onClick={limparFiltros} className={`${cls.btnGray} col-span-3`}>
            <X size={14} /> Limpar Filtro
          </button>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={`${cls.fieldSelect} col-span-3`}
          >
            <option value="">Produto ou Serviço...</option>
            <option value="produto">Produtos</option>
            <option value="servico">Serviços</option>
          </select>
          <select className={`${cls.fieldSelect} col-span-2`}>
            <option value="">Controla Estoque...</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <select
            value={filtroAtivo}
            onChange={(e) => { setFiltroAtivo(e.target.value); setPage(1); }}
            className={`${cls.fieldSelect} col-span-2`}
          >
            <option value="">Ativo ou Inativo...</option>
            <option value="true">Apenas ativos</option>
            <option value="false">Apenas inativos</option>
          </select>
          <div className="col-span-2"></div>
        </div>
        <button className={`${cls.btnDarkBlue} w-full mt-2 py-2.5`}>
          Habilitar Modificação Simultânea
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader className="animate-spin mx-auto mb-2" size={32} />
            Carregando produtos...
          </div>
        ) : erro ? (
          <div className="p-6 bg-red-50 text-red-700 flex items-center gap-2">
            <AlertCircle size={20} /> {erro}
          </div>
        ) : produtos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            Nenhum produto encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3 hidden md:table-cell">Grupo</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Marca</th>
                    <th className="px-4 py-3 text-right">Custo</th>
                    <th className="px-4 py-3 text-right">Preço Venda</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">Estoque</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {produtos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">{p.nome}</div>
                        {p.modelo && <div className="text-xs text-gray-500">{p.modelo}{p.cor ? ` · ${p.cor}` : ''}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{p.categoria_nome || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{p.marca || '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{formatarMoeda(p.preco_custo)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{formatarMoeda(p.preco_venda)}</td>
                      <td className="px-4 py-3 text-sm text-right hidden md:table-cell">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          p.estoque_total > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.estoque_total} un
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEditar(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => desativar(p)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                            title="Desativar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">Página {page} de {totalPaginas}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                    disabled={page === totalPaginas}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// ============================================
// PÁGINA PRINCIPAL (controla lista vs form)
// ============================================
const PaginaProdutos = ({ onAbrirMenu }) => {
  const [view, setView] = useState('lista'); // 'lista' ou 'form'
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    categoriaService.listar()
      .then(r => setCategorias(r.categorias || []))
      .catch(() => {});
  }, []);

  const abrirNovo = () => {
    setProdutoEditando(null);
    setView('form');
  };

  const abrirEdicao = (produto) => {
    setProdutoEditando(produto);
    setView('form');
  };

  const voltarLista = () => {
    setView('lista');
    setProdutoEditando(null);
  };

  return (
    <div className="p-5">
      {view === 'lista' && (
        <ListaProdutos
          key={refreshKey}
          onNovo={abrirNovo}
          onEditar={abrirEdicao}
          onAbrirMenu={onAbrirMenu}
        />
      )}
      {view === 'form' && (
        <FormularioProduto
          produto={produtoEditando}
          categorias={categorias}
          onVoltar={voltarLista}
          onSalvo={() => {
            setRefreshKey(k => k + 1);
            voltarLista();
          }}
        />
      )}
    </div>
  );
};

export default PaginaProdutos;
