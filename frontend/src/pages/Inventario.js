import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, Plus, X, Loader, AlertCircle, Search, Menu,
  CheckCircle2, AlertTriangle, ArrowLeft, FileCheck, Ban,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { inventarioService, stockService, categoriaService } from '../services/api';

const STATUS_LABEL = {
  aberto: { label: 'Aberto', cor: 'bg-blue-100 text-blue-800' },
  fechado: { label: 'Fechado', cor: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', cor: 'bg-gray-100 text-gray-600' }
};

const formatarMoeda = (v) =>
  (parseFloat(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ============================================
// Modal de criar inventário
// ============================================
const NovoInventarioModal = ({ aberto, lojas, onFechar, onCriado }) => {
  const [lojaId, setLojaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setLojaId(lojas[0]?.id || '');
      setCategoriaId('');
      setObservacoes('');
      setErro('');
      categoriaService.listar()
        .then(r => setCategorias((r.categorias || []).filter(c => !c.pai_id)))
        .catch(() => {});
    }
  }, [aberto, lojas]);

  if (!aberto) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const resp = await inventarioService.criar({
        loja_id: parseInt(lojaId),
        categoria_id: categoriaId ? parseInt(categoriaId) : null,
        observacoes
      });
      onCriado(resp.inventario);
    } catch (err) {
      setErro(err.message || 'Erro ao criar inventário');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Novo Inventário</h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loja *</label>
            <select
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria <span className="text-xs text-gray-500">(opcional, limita a contagem)</span>
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os produtos da loja</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome} (e subcategorias)</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              rows="2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Inventário trimestral, conferência pós-mudança"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded text-xs text-blue-800">
            Ao abrir o inventário, o sistema vai congelar uma foto (snapshot) dos saldos atuais. Os ajustes
            só serão aplicados ao fechar — comparando contagem com saldo do momento do fechamento.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onFechar} disabled={salvando}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || !lojaId}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded flex items-center gap-2">
              {salvando && <Loader className="animate-spin" size={16} />}
              {salvando ? 'Abrindo...' : 'Abrir inventário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// Tela de fechamento (preview + confirmação)
// ============================================
const PreviewFechamento = ({ inventarioId, onFechar, onConfirmado }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    inventarioService.previewFechamento(inventarioId)
      .then(r => setDados(r))
      .catch(err => setErro(err.message))
      .finally(() => setLoading(false));
  }, [inventarioId]);

  const confirmar = async () => {
    setConfirmando(true);
    setErro('');
    try {
      const r = await inventarioService.fechar(inventarioId);
      onConfirmado(r);
    } catch (err) {
      setErro(err.message || 'Erro ao fechar inventário');
      setConfirmando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileCheck className="text-green-600" /> Fechar Inventário
          </h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <Loader className="animate-spin mx-auto mb-2" size={32} />
            </div>
          ) : erro ? (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{erro}</div>
          ) : (
            <>
              {dados.itens_pendentes > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={18} />
                  <div className="text-sm text-yellow-800">
                    <strong>{dados.itens_pendentes} produto(s) ainda não foram contados.</strong> Ao fechar agora,
                    esses produtos ficarão com o saldo original (sem ajuste).
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-xs text-gray-600">Divergências</div>
                  <div className="text-2xl font-bold text-orange-600">{dados.total_divergencias}</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-xs text-gray-600">Não contados</div>
                  <div className="text-2xl font-bold text-yellow-600">{dados.itens_pendentes}</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-xs text-gray-600">Impacto (custo)</div>
                  <div className={`text-lg font-bold ${dados.valor_impacto_custo < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatarMoeda(dados.valor_impacto_custo)}
                  </div>
                </div>
              </div>

              {dados.total_divergencias === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="mx-auto mb-2 text-green-500" size={48} />
                  Nenhuma divergência encontrada. O fechamento não vai alterar nada no estoque.
                </div>
              ) : (
                <div className="border rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Produto</th>
                        <th className="px-3 py-2 text-right">Atual</th>
                        <th className="px-3 py-2 text-right">Contado</th>
                        <th className="px-3 py-2 text-right">Δ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dados.divergencias.map(d => {
                        const delta = d.quantidade_contada - d.quantidade_atual;
                        return (
                          <tr key={d.id}>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">{d.produto_nome}</div>
                              <div className="text-xs text-gray-500 font-mono">{d.produto_codigo}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">{d.quantidade_atual}</td>
                            <td className="px-3 py-2 text-sm text-right font-semibold">{d.quantidade_contada}</td>
                            <td className={`px-3 py-2 text-sm text-right font-bold ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onFechar} disabled={confirmando}
            className="px-4 py-2 text-gray-700 bg-white border hover:bg-gray-100 rounded">
            Voltar
          </button>
          <button
            onClick={confirmar}
            disabled={confirmando || loading}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded flex items-center gap-2"
          >
            {confirmando && <Loader className="animate-spin" size={16} />}
            <FileCheck size={16} />
            {confirmando ? 'Aplicando ajustes...' : 'Confirmar fechamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Tela de contagem (detalhe do inventário)
// ============================================
const TelaContagem = ({ inventario, onVoltar, onFechado }) => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('pendentes');
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [edicoes, setEdicoes] = useState({});
  const [salvandoId, setSalvandoId] = useState(null);
  const [modalFechamento, setModalFechamento] = useState(false);
  const [cabecalho, setCabecalho] = useState(inventario);
  const buscaRef = useRef(null);

  const carregarCabecalho = useCallback(async () => {
    try {
      const r = await inventarioService.obter(inventario.id);
      setCabecalho(r.inventario);
    } catch (err) {
      console.error(err);
    }
  }, [inventario.id]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await inventarioService.listarItens(inventario.id, {
        busca,
        status_contagem: filtroStatus,
        page,
        limit: 50
      });
      setItens(resp.itens || []);
      setTotalPaginas(resp.paginacao?.total_paginas || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inventario.id, busca, filtroStatus, page]);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const registrarContagem = async (item, valor) => {
    const qtd = parseInt(valor);
    if (isNaN(qtd) || qtd < 0) return;
    setSalvandoId(item.id);
    try {
      await inventarioService.contarItem(inventario.id, item.id, { quantidade_contada: qtd });
      setEdicoes(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      await Promise.all([carregar(), carregarCabecalho()]);
    } catch (err) {
      alert(err.message || 'Erro ao salvar contagem');
    } finally {
      setSalvandoId(null);
    }
  };

  const cancelar = async () => {
    if (!window.confirm('Cancelar este inventário? Nenhum ajuste será aplicado.')) return;
    try {
      await inventarioService.cancelar(inventario.id);
      onFechado();
    } catch (err) {
      alert(err.message || 'Erro ao cancelar');
    }
  };

  const podeEditar = cabecalho.status === 'aberto';
  const progresso = cabecalho.total_itens > 0
    ? Math.round((cabecalho.itens_contados / cabecalho.total_itens) * 100)
    : 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onVoltar} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-800">Inventário #{cabecalho.id}</h3>
            <span className={`px-2 py-0.5 text-xs rounded ${STATUS_LABEL[cabecalho.status]?.cor}`}>
              {STATUS_LABEL[cabecalho.status]?.label}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {cabecalho.loja_nome}
            {cabecalho.categoria_nome && ` · ${cabecalho.categoria_nome}`}
            {' · '}
            Aberto em {new Date(cabecalho.iniciado_em).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">
            Progresso: {cabecalho.itens_contados} / {cabecalho.total_itens} itens
          </div>
          <div className="text-sm font-bold text-blue-600">{progresso}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progresso}%` }} />
        </div>
        {cabecalho.itens_com_divergencia > 0 && (
          <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            {cabecalho.itens_com_divergencia} produto(s) com divergência em relação ao sistema
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              ref={buscaRef}
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar produto por nome ou código..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="pendentes">Pendentes de contagem</option>
            <option value="contados">Já contados</option>
            <option value="divergencias">Apenas com divergência</option>
          </select>
        </div>
      </div>

      {/* Tabela de itens */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader className="animate-spin mx-auto mb-2" size={32} />
          </div>
        ) : itens.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-300" />
            Nenhum produto neste filtro.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-right">Sistema</th>
                    <th className="px-4 py-3 text-right">Contado</th>
                    <th className="px-4 py-3 text-right">Δ</th>
                    <th className="px-4 py-3 hidden md:table-cell">Quem contou</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itens.map(item => {
                    const editado = edicoes[item.id];
                    const valorAtual = editado !== undefined ? editado : (item.quantidade_contada ?? '');
                    const ehDiferente = item.quantidade_contada !== null && item.diferenca !== 0;
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${ehDiferente ? 'bg-orange-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{item.produto_nome}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.produto_codigo}</div>
                          {(item.marca || item.modelo) && (
                            <div className="text-xs text-gray-500">{[item.marca, item.modelo].filter(Boolean).join(' · ')}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{item.quantidade_sistema}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={valorAtual}
                              disabled={!podeEditar || salvandoId === item.id}
                              onChange={(e) => setEdicoes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  registrarContagem(item, e.target.value);
                                }
                              }}
                              onBlur={(e) => {
                                if (editado !== undefined && editado !== '' && parseInt(editado) !== item.quantidade_contada) {
                                  registrarContagem(item, e.target.value);
                                }
                              }}
                              className={`w-20 px-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 ${
                                item.quantidade_contada !== null ? 'border-green-400 bg-green-50' : 'border-gray-300'
                              }`}
                            />
                            {salvandoId === item.id && <Loader className="animate-spin text-blue-500" size={14} />}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${
                          item.diferenca === null ? 'text-gray-300'
                          : item.diferenca === 0 ? 'text-green-600'
                          : item.diferenca > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.diferenca === null ? '—' : (item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {item.contado_por_nome || '—'}
                          {item.contado_em && (
                            <div className="text-xs text-gray-400">
                              {new Date(item.contado_em).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">Página {page} de {totalPaginas}</div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-white">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-white">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botões de ação (apenas se aberto) */}
      {podeEditar && (
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={cancelar}
            className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded flex items-center gap-2"
          >
            <Ban size={16} /> Cancelar inventário
          </button>
          <button
            onClick={() => setModalFechamento(true)}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded flex items-center gap-2"
          >
            <FileCheck size={16} /> Fechar e aplicar ajustes
          </button>
        </div>
      )}

      {modalFechamento && (
        <PreviewFechamento
          inventarioId={inventario.id}
          onFechar={() => setModalFechamento(false)}
          onConfirmado={(r) => {
            alert(`Inventário fechado!\nAjustes aplicados: ${r.ajustes_aplicados}\n+${r.unidades_acrescentadas} unidades\n-${r.unidades_removidas} unidades`);
            onFechado();
          }}
        />
      )}
    </>
  );
};

// ============================================
// Lista de inventários (página principal)
// ============================================
const PaginaInventario = ({ onAbrirMenu, currentUser }) => {
  const [inventarios, setInventarios] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [inventarioSelecionado, setInventarioSelecionado] = useState(null);

  const ehAdmin = currentUser?.tipo === 'administrador';

  useEffect(() => {
    stockService.listar({ limit: 100 })
      .then(r => {
        const mapa = new Map();
        (r.estoque || []).forEach(e => {
          if (!mapa.has(e.loja_id)) mapa.set(e.loja_id, { id: e.loja_id, nome: e.loja_nome });
        });
        setLojas(Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome)));
      })
      .catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await inventarioService.listar({
        status: filtroStatus,
        loja_id: filtroLoja,
        limit: 50
      });
      setInventarios(r.inventarios || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, filtroLoja]);

  useEffect(() => { carregar(); }, [carregar]);

  if (inventarioSelecionado) {
    return (
      <div className="p-6">
        <TelaContagem
          inventario={inventarioSelecionado}
          onVoltar={() => setInventarioSelecionado(null)}
          onFechado={() => { setInventarioSelecionado(null); carregar(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onAbrirMenu} className="lg:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-blue-600" /> Inventário Físico
            </h2>
            <p className="text-sm text-gray-600">Contagem e ajuste de estoque</p>
          </div>
        </div>
        <button
          onClick={() => setModalNovo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus size={18} /> Novo Inventário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="aberto">Abertos</option>
            <option value="fechado">Fechados</option>
            <option value="cancelado">Cancelados</option>
          </select>
          {ehAdmin && (
            <select
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as lojas</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader className="animate-spin mx-auto mb-2" size={32} />
          </div>
        ) : inventarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
            <div>Nenhum inventário cadastrado.</div>
            <div className="text-sm mt-1">Clique em "Novo Inventário" para começar uma contagem.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Loja / Escopo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Progresso</th>
                  <th className="px-4 py-3 text-right">Divergências</th>
                  <th className="px-4 py-3 hidden md:table-cell">Iniciado em</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Aberto por</th>
                  <th className="px-4 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventarios.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">#{inv.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{inv.loja_nome}</div>
                      {inv.categoria_nome && (
                        <div className="text-xs text-gray-500">{inv.categoria_nome}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_LABEL[inv.status]?.cor}`}>
                        {STATUS_LABEL[inv.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div>{inv.itens_contados}/{inv.total_itens}</div>
                      <div className="text-xs text-gray-500">
                        {inv.total_itens > 0 ? Math.round((inv.itens_contados / inv.total_itens) * 100) : 0}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.itens_com_divergencia > 0 ? (
                        <span className="text-orange-600 font-semibold">{inv.itens_com_divergencia}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {new Date(inv.iniciado_em).toLocaleString('pt-BR')}
                      {inv.finalizado_em && (
                        <div>Fechado: {new Date(inv.finalizado_em).toLocaleString('pt-BR')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {inv.usuario_abertura_nome || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setInventarioSelecionado(inv)}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        {inv.status === 'aberto' ? 'Contar' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NovoInventarioModal
        aberto={modalNovo}
        lojas={lojas}
        onFechar={() => setModalNovo(false)}
        onCriado={(inv) => {
          setModalNovo(false);
          carregar();
          inventarioService.obter(inv.id).then(r => setInventarioSelecionado(r.inventario));
        }}
      />
    </div>
  );
};

export default PaginaInventario;
