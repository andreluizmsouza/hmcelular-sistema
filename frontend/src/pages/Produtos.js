import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, X, Loader, AlertCircle,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { productService, categoriaService } from '../services/api';

const formatarMoeda = (v) => {
  const n = parseFloat(v) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ESTADO_INICIAL = {
  codigo: '',
  nome: '',
  descricao: '',
  categoria_id: '',
  marca: '',
  modelo: '',
  cor: '',
  tamanho: '',
  preco_custo: '',
  preco_venda: ''
};

const ProdutoModal = ({ aberto, produto, categorias, onFechar, onSalvo }) => {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setErro('');
      if (produto) {
        setForm({
          codigo: produto.codigo || '',
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          categoria_id: produto.categoria_id || '',
          marca: produto.marca || '',
          modelo: produto.modelo || '',
          cor: produto.cor || '',
          tamanho: produto.tamanho || '',
          preco_custo: produto.preco_custo || '',
          preco_venda: produto.preco_venda || ''
        });
      } else {
        setForm(ESTADO_INICIAL);
      }
    }
  }, [aberto, produto]);

  if (!aberto) return null;

  const margem = (() => {
    const c = parseFloat(form.preco_custo) || 0;
    const v = parseFloat(form.preco_venda) || 0;
    if (c <= 0) return null;
    return (((v - c) / c) * 100).toFixed(1);
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
        ...form,
        categoria_id: form.categoria_id || null,
        preco_custo: parseFloat(form.preco_custo) || 0,
        preco_venda: parseFloat(form.preco_venda) || 0
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código {!produto && <span className="text-xs text-gray-500">(deixe vazio para auto)</span>}
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex: EAN ou PROD-000001"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows="2"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.pai_nome ? `${c.pai_nome} > ${c.nome}` : c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Ex: JBL, Samsung, Apple"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ex: iPhone 15, S24"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <input
                type="text"
                value={form.cor}
                onChange={(e) => setForm({ ...form, cor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
              <input
                type="text"
                value={form.tamanho}
                onChange={(e) => setForm({ ...form, tamanho: e.target.value })}
                placeholder='Ex: 6.1", P, M, G'
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco_custo}
                onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco_venda}
                onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full p-2 bg-blue-50 rounded text-center">
                <div className="text-xs text-gray-600">Margem de lucro</div>
                <div className={`text-lg font-bold ${margem === null ? 'text-gray-400' : 'text-blue-600'}`}>
                  {margem === null ? '—' : `${margem}%`}
                </div>
              </div>
            </div>
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
              disabled={salvando}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded transition flex items-center gap-2"
            >
              {salvando && <Loader className="animate-spin" size={16} />}
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaginaProdutos = ({ onAbrirMenu }) => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const resp = await productService.listar({
        busca,
        categoria_id: filtroCategoria,
        page,
        limit: 20
      });
      setProdutos(resp.produtos || []);
      setTotalPaginas(resp.paginacao?.total_paginas || 1);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroCategoria, page]);

  useEffect(() => {
    categoriaService.listar()
      .then(r => setCategorias(r.categorias || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const abrirNovo = () => {
    setProdutoEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (produto) => {
    setProdutoEditando(produto);
    setModalAberto(true);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onAbrirMenu}
            className="lg:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" /> Produtos
            </h2>
            <p className="text-sm text-gray-600">Cadastro e gestão de produtos</p>
          </div>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar por nome, código, marca ou modelo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => { setFiltroCategoria(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.pai_nome ? `${c.pai_nome} > ${c.nome}` : c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Marca</th>
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
                            onClick={() => abrirEdicao(p)}
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

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Página {page} de {totalPaginas}
                </div>
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

      <ProdutoModal
        aberto={modalAberto}
        produto={produtoEditando}
        categorias={categorias}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => { setModalAberto(false); carregar(); }}
      />
    </div>
  );
};

export default PaginaProdutos;
