import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, X, Loader, AlertCircle, Plus, Minus, Settings,
  ArrowRightLeft, History, Menu, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { stockService, productService } from '../services/api';

const TIPO_LABELS = {
  entrada: { label: 'Entrada', cor: 'bg-green-100 text-green-800', icone: Plus },
  saida: { label: 'Saída', cor: 'bg-red-100 text-red-800', icone: Minus },
  ajuste: { label: 'Ajuste', cor: 'bg-yellow-100 text-yellow-800', icone: Settings },
  transferencia_saida: { label: 'Transf. saída', cor: 'bg-orange-100 text-orange-800', icone: ArrowRightLeft },
  transferencia_entrada: { label: 'Transf. entrada', cor: 'bg-blue-100 text-blue-800', icone: ArrowRightLeft },
  venda: { label: 'Venda', cor: 'bg-purple-100 text-purple-800', icone: Minus },
  devolucao: { label: 'Devolução', cor: 'bg-indigo-100 text-indigo-800', icone: Plus }
};

const MovimentacaoModal = ({ aberto, item, lojas, onFechar, onSalvo }) => {
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [lojaDestinoId, setLojaDestinoId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setTipo('entrada');
      setQuantidade('');
      setMotivo('');
      setObservacoes('');
      setLojaDestinoId('');
      setErro('');
    }
  }, [aberto]);

  if (!aberto || !item) return null;

  const submit = async (e) => {
    e.preventDefault();
    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd < 0) {
      setErro('Informe uma quantidade válida');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      if (tipo === 'transferencia') {
        if (!lojaDestinoId) {
          setErro('Selecione a loja de destino');
          setSalvando(false);
          return;
        }
        if (qtd <= 0) {
          setErro('Quantidade da transferência deve ser maior que zero');
          setSalvando(false);
          return;
        }
        await stockService.transferir({
          produto_id: item.produto_id,
          loja_origem_id: item.loja_id,
          loja_destino_id: parseInt(lojaDestinoId),
          quantidade: qtd,
          observacoes
        });
      } else {
        await stockService.movimentar({
          produto_id: item.produto_id,
          loja_id: item.loja_id,
          tipo,
          quantidade: qtd,
          motivo,
          observacoes
        });
      }
      onSalvo();
    } catch (err) {
      setErro(err.message || 'Erro ao registrar movimentação');
    } finally {
      setSalvando(false);
    }
  };

  const novaQuantidade = (() => {
    const q = parseInt(quantidade) || 0;
    const atual = item.quantidade;
    if (tipo === 'entrada') return atual + q;
    if (tipo === 'saida' || tipo === 'transferencia') return atual - q;
    if (tipo === 'ajuste') return q;
    return atual;
  })();

  const outrasLojas = lojas.filter(l => l.id !== item.loja_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Movimentar Estoque</h3>
            <p className="text-sm text-gray-600 mt-1">{item.produto_nome}</p>
            <p className="text-xs text-gray-500">{item.loja_nome} · Atual: <span className="font-semibold">{item.quantidade} un</span></p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimentação</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'entrada', l: 'Entrada', cor: 'green' },
                { v: 'saida', l: 'Saída', cor: 'red' },
                { v: 'ajuste', l: 'Ajuste', cor: 'yellow' },
                { v: 'transferencia', l: 'Transferência', cor: 'blue' }
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setTipo(opt.v)}
                  className={`px-3 py-2 rounded border-2 transition text-sm font-medium ${
                    tipo === opt.v
                      ? `border-${opt.cor}-500 bg-${opt.cor}-50 text-${opt.cor}-700`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'transferencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loja de destino *</label>
              <select
                value={lojaDestinoId}
                onChange={(e) => setLojaDestinoId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {outrasLojas.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipo === 'ajuste' ? 'Nova quantidade absoluta' : 'Quantidade'} *
            </label>
            <input
              type="number"
              min="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <div className="text-xs text-gray-500 mt-1">
              {quantidade !== '' && (
                <span>
                  Quantidade após movimentação: <span className={`font-semibold ${novaQuantidade < 0 ? 'text-red-600' : 'text-gray-800'}`}>{novaQuantidade}</span>
                  {novaQuantidade < 0 && ' (estoque insuficiente)'}
                </span>
              )}
            </div>
          </div>

          {tipo !== 'transferencia' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={
                  tipo === 'entrada' ? 'Ex: Compra fornecedor, devolução cliente'
                  : tipo === 'saida' ? 'Ex: Perda, danificado'
                  : 'Ex: Conferência de inventário'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              rows="2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || novaQuantidade < 0}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded transition flex items-center gap-2"
            >
              {salvando && <Loader className="animate-spin" size={16} />}
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LimitesModal = ({ aberto, item, onFechar, onSalvo }) => {
  const [minimo, setMinimo] = useState('');
  const [maximo, setMaximo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto && item) {
      setMinimo(item.quantidade_minima ?? 0);
      setMaximo(item.quantidade_maxima ?? 0);
      setLocalizacao(item.localizacao || '');
      setErro('');
    }
  }, [aberto, item]);

  if (!aberto || !item) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await stockService.atualizarLimites(item.id, {
        quantidade_minima: parseInt(minimo) || 0,
        quantidade_maxima: parseInt(maximo) || 0,
        localizacao
      });
      onSalvo();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar limites');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Configurar Limites</h3>
            <p className="text-sm text-gray-600 mt-1">{item.produto_nome}</p>
            <p className="text-xs text-gray-500">{item.loja_nome}</p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{erro}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo (alerta)</label>
              <input
                type="number"
                min="0"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máximo (referência)</label>
              <input
                type="number"
                min="0"
                value={maximo}
                onChange={(e) => setMaximo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização física</label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex: Prateleira A3, Gaveta 12"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onFechar} disabled={salvando}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListaEstoque = ({ lojas, lojaUsuario, ehAdmin }) => {
  const [estoque, setEstoque] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroLoja, setFiltroLoja] = useState(ehAdmin ? '' : (lojaUsuario || ''));
  const [apenasBaixo, setApenasBaixo] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalMov, setModalMov] = useState(null);
  const [modalLimites, setModalLimites] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resp, resumoResp] = await Promise.all([
        stockService.listar({
          busca,
          loja_id: filtroLoja,
          baixo_estoque: apenasBaixo ? 'true' : '',
          page,
          limit: 30
        }),
        page === 1 ? stockService.resumo() : Promise.resolve(null)
      ]);
      setEstoque(resp.estoque || []);
      setTotalPaginas(resp.paginacao?.total_paginas || 1);
      if (resumoResp) setResumo(resumoResp.resumo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [busca, filtroLoja, apenasBaixo, page]);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const formatarMoeda = (v) => (parseFloat(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600">Produtos ativos</div>
            <div className="text-2xl font-bold text-gray-800">{resumo.total_produtos}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600">Unidades em estoque</div>
            <div className="text-2xl font-bold text-blue-600">{resumo.total_unidades}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600">Valor em estoque (venda)</div>
            <div className="text-lg font-bold text-green-600">{formatarMoeda(resumo.valor_venda)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <AlertTriangle size={12} className="text-orange-500" /> Alertas
            </div>
            <div className="text-2xl font-bold text-orange-600">{resumo.produtos_estoque_baixo}</div>
            <div className="text-xs text-gray-500">{resumo.produtos_sem_estoque} sem estoque</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {ehAdmin && (
            <select
              value={filtroLoja}
              onChange={(e) => { setFiltroLoja(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as lojas</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          )}
        </div>
        <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={apenasBaixo}
            onChange={(e) => { setApenasBaixo(e.target.checked); setPage(1); }}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Apenas estoque baixo</span>
        </label>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader className="animate-spin mx-auto mb-2" size={32} />
            Carregando...
          </div>
        ) : estoque.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            Nenhum registro de estoque encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 hidden md:table-cell">Loja</th>
                    <th className="px-4 py-3 text-right">Atual</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">Mín / Máx</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Localização</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {estoque.map(e => (
                    <tr key={e.id} className={`hover:bg-gray-50 ${e.alerta_baixo ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">{e.produto_nome}</div>
                        <div className="text-xs text-gray-500 font-mono">{e.produto_codigo}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{e.loja_nome}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${e.quantidade === 0 ? 'text-red-600' : e.alerta_baixo ? 'text-orange-600' : 'text-gray-800'}`}>
                          {e.quantidade}
                        </span>
                        {e.alerta_baixo && <AlertTriangle className="inline ml-1 text-orange-500" size={14} />}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right hidden lg:table-cell">
                        {e.quantidade_minima} / {e.quantidade_maxima}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{e.localizacao || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setModalMov(e)}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            Movimentar
                          </button>
                          <button
                            onClick={() => setModalLimites(e)}
                            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                            title="Limites"
                          >
                            <Settings size={14} />
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

      <MovimentacaoModal
        aberto={!!modalMov}
        item={modalMov}
        lojas={lojas}
        onFechar={() => setModalMov(null)}
        onSalvo={() => { setModalMov(null); carregar(); }}
      />
      <LimitesModal
        aberto={!!modalLimites}
        item={modalLimites}
        onFechar={() => setModalLimites(null)}
        onSalvo={() => { setModalLimites(null); carregar(); }}
      />
    </>
  );
};

const Historico = ({ lojas, ehAdmin }) => {
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await stockService.historico({
        loja_id: filtroLoja,
        tipo: filtroTipo,
        page,
        limit: 50
      });
      setMovs(resp.movimentacoes || []);
      setTotalPaginas(resp.paginacao?.total_paginas || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroLoja, filtroTipo, page]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3">
        {ehAdmin && (
          <select
            value={filtroLoja}
            onChange={(e) => { setFiltroLoja(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as lojas</option>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        )}
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <Loader className="animate-spin mx-auto mb-2" size={32} />
        </div>
      ) : movs.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <History size={48} className="mx-auto mb-3 text-gray-300" />
          Nenhuma movimentação registrada.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 hidden md:table-cell">Loja</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Saldo</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movs.map(m => {
                  const info = TIPO_LABELS[m.tipo] || { label: m.tipo, cor: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${info.cor}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">{m.produto_nome}</div>
                        <div className="text-xs text-gray-500 font-mono">{m.produto_codigo}</div>
                        {m.motivo && <div className="text-xs text-gray-500 italic">{m.motivo}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {m.loja_nome}
                        {m.loja_origem_nome && m.loja_destino_nome && (
                          <div className="text-xs text-gray-500">
                            {m.loja_origem_nome} → {m.loja_destino_nome}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-sm">{m.quantidade}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 hidden lg:table-cell">
                        {m.quantidade_antes} → {m.quantidade_depois}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{m.usuario_nome || '—'}</td>
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
  );
};

const PaginaEstoque = ({ onAbrirMenu, currentUser }) => {
  const [aba, setAba] = useState('lista');
  const [lojas, setLojas] = useState([]);

  const ehAdmin = currentUser?.tipo === 'administrador';

  // Carrega lista de lojas a partir dos produtos/estoque (não temos endpoint de lojas ainda)
  // Workaround: extrai do próprio estoque na primeira chamada
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onAbrirMenu} className="lg:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" /> Estoque
            </h2>
            <p className="text-sm text-gray-600">Controle de estoque por loja</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setAba('lista')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              aba === 'lista'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={16} className="inline mr-1" /> Posição atual
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              aba === 'historico'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} className="inline mr-1" /> Histórico
          </button>
        </nav>
      </div>

      {aba === 'lista' && (
        <ListaEstoque lojas={lojas} lojaUsuario={currentUser?.loja_id} ehAdmin={ehAdmin} />
      )}
      {aba === 'historico' && (
        <Historico lojas={lojas} ehAdmin={ehAdmin} />
      )}
    </div>
  );
};

export default PaginaEstoque;
