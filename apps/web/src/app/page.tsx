'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  ShoppingBag,
  Bell,
  CheckCircle2,
  Loader2,
  LogIn,
  Zap,
  Package,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const [email, setEmail] = useState('vinicius@email.com');
  const [password, setPassword] = useState('senha123secura');

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('saas_user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser).id;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Handler para atualizar o estoque na UI via WebSocket em tempo real
  const handleStockUpdate = useCallback((productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  }, []);

  const { notifications } = useWebSocket(userId, handleStockUpdate);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get('/products');
        setProducts(response.data.products || []);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      }
    }
    fetchProducts();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('saas_token', token);
      localStorage.setItem('saas_user', JSON.stringify(user));
      setToken(token);
      setUserId(user.id);
    } catch (err) {
      alert('Erro ao realizar login. Verifique suas credenciais.');
    }
  }

  async function handleCheckout(productId: string, price: string) {
    if (!token) {
      alert('Faça login primeiro para realizar uma compra.');
      return;
    }

    setLoadingOrderId(productId);
    try {
      const response = await api.post('/orders/checkout', {
        items: [{ productId, quantity: 1, unitPrice: parseFloat(price) }],
      });

      setProcessingOrder(response.data.orderId);
      setTimeout(() => setProcessingOrder(null), 2500);
    } catch (err) {
      alert('Erro ao processar o checkout.');
    } finally {
      setLoadingOrderId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Decorativo */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

      {/* Header Superior */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              SaaS Engine
            </span>
            <span className="text-xs bg-slate-800 border border-slate-700/80 text-slate-400 px-2 py-0.5 rounded-md font-mono">
              v1.0 Real-Time
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicadores de Status */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Redis + BullMQ Active
              </span>
            </div>

            <div className="relative">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-[10px] font-extrabold text-slate-950 w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {notifications.length}
                </span>
              )}
            </div>

            {userId ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-slate-300">{userId.slice(0, 8)}...</span>
              </div>
            ) : (
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Autenticação Pendente
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Hero / Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Resposta HTTP</p>
              <h4 className="text-lg font-bold text-slate-100">&lt; 50ms (202)</h4>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Processamento</p>
              <h4 className="text-lg font-bold text-slate-100">BullMQ + Redis</h4>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Banco de Dados</p>
              <h4 className="text-lg font-bold text-slate-100">Drizzle PostgreSQL</h4>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Notificação</p>
              <h4 className="text-lg font-bold text-slate-100">WebSocket Live</h4>
            </div>
          </div>
        </div>

        {/* Modal/Banner de Processamento Assíncrono */}
        {processingOrder && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg animate-spin">
                <Loader2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Pedido #{processingOrder.slice(0, 8)} recebido!
                </p>
                <p className="text-xs text-slate-400">
                  A API respondeu instantaneamente. O Worker do BullMQ está processando o pagamento no Redis e atualizando o estoque...
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-mono border border-emerald-500/30">
              202 Accepted
            </span>
          </div>
        )}

        {/* Form de Autenticação Rápida */}
        {!token && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-base">Autenticar na Plataforma</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 mt-1 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 mt-1 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                Entrar e Conectar WebSocket
              </button>
            </form>
          </div>
        )}

        {/* Grade Principal: Catálogo + Feed em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Catálogo de Produtos */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-400" />
                  Catálogo de Produtos
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione um produto para disparar a fila de pagamento assíncrona
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-12 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
                Nenhum produto encontrado. Crie produtos via API para exibi-los aqui.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-lg">
                          ID: {product.id.slice(0, 6)}...
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            product.stock > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg text-slate-100 mt-4 group-hover:text-emerald-300 transition-colors">
                        {product.name}
                      </h3>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xs text-slate-400 font-medium">R$</span>
                        <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
                          {parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckout(product.id, product.price)}
                      disabled={loadingOrderId === product.id || !token || product.stock <= 0}
                      className="mt-6 w-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-200 text-slate-200 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                    >
                      {loadingOrderId === product.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Adicionando à fila...</span>
                        </>
                      ) : (
                        <>
                          <span>Comprar Agora</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feed de Eventos Real-Time */}
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                Eventos WebSocket
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Atualizações recebidas instantaneamente sem reload
              </p>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Aguardando notificações de pedidos da fila BullMQ...</p>
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl space-y-2 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-3 duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{notif.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>STATUS: COMPLETED</span>
                      <span>WORKER: BULLMQ_01</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}