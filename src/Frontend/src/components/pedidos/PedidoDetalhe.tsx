import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'; // Para obter o ID da URL
import { apiClient } from '../../apiClient';

const STATUS_MAP: { [key: string]: string } = {
    '0': 'Pendente',
    '1': 'Processando',
    '2': 'Finalizado',
};

const getStatusName = (statusCode: string): string => {
    // Retorna o nome mapeado, ou o próprio código/status se não for encontrado
    return STATUS_MAP[statusCode] || statusCode; 
};

// Interface do DTO de resposta do Backend
interface PedidoDetalheDto {
    id: string;
    cliente: string;
    produto: string;
    valor: number;
    status: string;
    dataCriacao: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const rawStatusName = getStatusName(status); 
    const statusName = rawStatusName.trim(); 

    // 2. Determina a cor com base no nome traduzido
    let color = 'bg-gray-400';
    switch (statusName) {
        case 'Pendente':
            color = 'bg-yellow-500';
            break;
        case 'Processando':
            color = 'bg-blue-500';
            break;
        case 'Finalizado':
            color = 'bg-green-500';
            break;
        default:
            // Caso o nome não seja mapeado
            color = 'bg-gray-400';
            break;
    }

    return (
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${color} text-white`}>
            {/* Exibe o nome traduzido */}
            {statusName} 
        </span>
    );
};

export const PedidoDetalhe: React.FC = () => {
    const { id } = useParams<{ id: string }>(); 
    
    const [pedido, setPedido] = useState<PedidoDetalheDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("ID do pedido não fornecido.");
            setLoading(false);
            return;
        }

        const fetchPedidoDetalhe = async () => {
            try {
                const response = await apiClient.get<PedidoDetalheDto>(`/orders/${id}`);
                setPedido(response.data);
                setError(null);
            } catch (err: any) {
                const errorMessage = err.response?.data?.title || err.response?.data || "Pedido não encontrado ou erro de comunicação.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchPedidoDetalhe();
    }, [id]);


    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    if (loading) {
        return (
            <div className="text-center p-8">
                <p className="text-blue-500 animate-pulse">Carregando detalhes do pedido...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-lg mx-auto">
                <p className="font-bold">Erro!</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (!pedido) {
        // Isso deve ser coberto pelo 'error' 404, mas é uma boa prática
        return (
            <div className="p-4 bg-gray-100 border border-gray-400 text-gray-700 rounded-lg max-w-lg mx-auto">
                <p>Detalhes do pedido não disponíveis.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-3xl font-extrabold mb-2 text-gray-800">
                Detalhes do Pedido
            </h3>
            <Link
            to={`/`}
                        className="py-1 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-150 text-sm font-medium shadow-md"
                    >
                        &larr; Voltar
            </Link>
            <p className="text-sm text-gray-500 mb-6">ID: {pedido.id}</p>

            <div className="space-y-6">
                
                <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-lg font-semibold text-gray-700">Status Atual:</span>
                    <StatusBadge status={pedido.status} /> 
                </div>

                {/* Cliente */}
                <div className="border-b pb-3">
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="text-xl font-bold text-gray-900">{pedido.cliente}</p>
                </div>
                
                {/* Produto */}
                <div className="border-b pb-3">
                    <p className="text-sm font-medium text-gray-500">Produto Principal</p>
                    <p className="text-lg text-gray-800">{pedido.produto}</p>
                </div>

                {/* Valor Total */}
                <div className="border-b pb-3">
                    <p className="text-sm font-medium text-gray-500">Valor Total</p>
                    <p className="text-2xl font-extrabold text-green-600">
                        {pedido.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                {/* Data de Criação Formatada */}
                <div className="pt-4">
                    <p className="text-xs text-gray-500">Data de Criação</p>
                    <p className="text-sm font-medium text-gray-700">
                        {formatDate(pedido.dataCriacao)}
                    </p>
                </div>
            </div>
            
        </div>
        );
};