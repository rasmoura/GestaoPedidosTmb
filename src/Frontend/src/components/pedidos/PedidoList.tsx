import React, { useEffect, useState } from 'react';
import { apiClient } from '../../apiClient';
import { Link } from 'react-router-dom'; 

interface PedidoSummary {
    id: string;
    cliente: string;
    valor: number;
    status: string;
}
const STATUS_MAP: { [key: string]: string } = {
    '0': 'Pendente',
    '1': 'Processando',
    '2': 'Finalizado',
};

const getStatusName = (statusCode: string): string => {
    // Retorna o nome mapeado, ou o próprio código/status se não for encontrado
    return STATUS_MAP[statusCode] || statusCode; 
};

// Componente simples para simular o Toast (E.2)
const ToastNotification: React.FC<{ message: string | null, type: 'error' | 'success' }> = ({ message, type }) => {
    if (!message) return null;
    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50";
    const colorStyle = type === 'error' ? "bg-red-600" : "bg-green-600";

    return (
        <div className={`${baseStyle} ${colorStyle}`}>
            {message}
        </div>
    );
};

const getStatusProps = (status: string) => {
    const statusName = getStatusName(status)
    switch (statusName) {
        case 'Finalizado':
            return { text: 'Finalizado', color: 'bg-green-100 text-green-800' };
        case 'Processando':
            return { text: 'Processando', color: 'bg-yellow-100 text-yellow-800' };
        case 'Pendente':
            default:
            return { text: 'Pendente', color: 'bg-blue-100 text-blue-800' };
    }
};

// 2. Card de Pedido com o novo layout
const PedidoCard: React.FC<{ pedido: PedidoSummary }> = ({ pedido }) => {
    const statusProps = getStatusProps(pedido.status);
    const valorFormatado = pedido.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-indigo-600 flex flex-col justify-between h-full transition transform hover:scale-[1.01] duration-200">
            <div>
                {/* Cabeçalho: Cliente e Status */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 truncate" title={pedido.cliente}>
                        {pedido.cliente}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusProps.color} whitespace-nowrap`}>
                        {statusProps.text}
                    </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">ID: {pedido.id}</p>
                <div className="flex justify-between items-center">
                    {/* Valor Formatado */}
                    <p className="text-2xl font-extrabold text-green-700">
                        {valorFormatado}
                    </p>
                    
                    {/* Botão Ver Detalhes */}
                    <Link 
                        to={`/orders/${pedido.id}`}
                        className="py-1 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-150 text-sm font-medium shadow-md"
                    >
                        Detalhes &rarr;
                    </Link>
                </div>
            </div>

            {/* Rodapé: Valor e Detalhes */}
            <div className="pt-3 border-t border-gray-100 mt-auto">
            </div>
        </div>
    );
};

// 3. Componente Shimmer para Loading
const ShimmerCard: React.FC = () => (
    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-gray-300 animate-pulse h-40">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-8 bg-indigo-200 rounded w-1/4"></div>
        </div>
    </div>
);


// --- Componente Principal ---
export const PedidoList: React.FC = () => {
    const [orders, setOrders] = useState<PedidoSummary[]>([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null); 
    
    const fetchOrders = async () => {
        // Apenas mostra o spinner completo se não houver dados anteriores
        if (orders.length === 0) {
            setLoading(true);
        }
        
        try {
            const response = await apiClient.get<PedidoSummary[]>('/orders');
            setOrders(response.data);
            setError(null);
        } catch (err: any) {
            const errorMessage = err.response?.data?.title || "Não foi possível carregar a lista de pedidos.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(); 
        // Polling a cada 10 segundos
        const intervalId = setInterval(fetchOrders, 10000); 
        return () => clearInterval(intervalId);
    }, []);
    
    
    const renderContent = () => {
        if (loading && orders.length === 0) { 
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <ShimmerCard key={i} />)}
                </div>
            );
        }

        if (error) { 
            return (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-lg mx-auto">
                    <p className="font-bold">Falha ao buscar pedidos:</p>
                    <p>{error}</p>
                    <button 
                        onClick={fetchOrders} 
                        className="mt-2 text-sm text-red-700 underline"
                    >
                        Tentar Novamente
                    </button>
                    <ToastNotification message={error} type="error" />
                </div>
            );
        }

        if (orders.length === 0) {
            return (
                <div className="text-center py-10 bg-white rounded-xl shadow-md">
                    <p className="text-xl text-gray-500">Nenhum pedido encontrado. Crie um novo pedido para começar.</p>
                </div>
            );
        }
        
        // Renderiza a lista usando o novo layout de Grid
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <PedidoCard key={order.id} pedido={order} />
                ))}
            </div>
        );
    }


    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h3 className="text-3xl font-extrabold text-gray-900">
                    Monitoramento de Pedidos
                </h3>
                <p className="text-gray-500 mt-1">
                    Lista atualizada a cada 10 segundos. Status: <span className={loading ? "text-yellow-600" : "text-green-600"}>
                        {loading ? 'Atualizando...' : 'Online'}
                    </span>
                </p>
            </header>

            {renderContent()}

            {/* O Toast de erro é exibido dentro da renderização de erro condicional */}
        </div>
    );
};