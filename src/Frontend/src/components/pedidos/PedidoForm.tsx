import React, { useState } from 'react';
import { apiClient } from '../../apiClient';

// Componente simples para simular o Toast (E.2)
const ToastNotification: React.FC<{ message: string | null, type: 'error' | 'success' }> = ({ message, type }) => {
    if (!message) return null;
    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl text-white transition-opacity duration-300 z-50 transform translate-y-0 opacity-100";
    const colorStyle = type === 'error' ? "bg-red-600" : "bg-green-600";

    return (
        <div className={`${baseStyle} ${colorStyle}`}>
            <p className="font-semibold">{type === 'success' ? 'Sucesso!' : 'Erro'}</p>
            <p className="text-sm">{message}</p>
        </div>
    );
};

// DTO de Payload
interface OrderPayload {
    Cliente: string; 
    Produto: string;
    Valor: number;
}

const initialPayload: OrderPayload = {
    Cliente: '', 
    Produto: '', 
    Valor: 0
};

// Componente Principal
export const PedidoForm: React.FC = () => {
    const [pedido, setPedido] = useState<OrderPayload>(initialPayload);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    // Estado para controle da máscara de valor
    const [displayValue, setDisplayValue] = useState('R$ 0,00'); 
    
    // O useEffect que causava o conflito durante a digitação foi removido.
    // A formatação inicial é definida no useState e a formatação pós-edição é feita no onBlur.

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000); // Exibe por 5 segundos
    };

    // Handlers de Input
    const handleInputChangeCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPedido(prev => ({ ...prev, Cliente: e.target.value }));
        setToast(null);
    };

    const handleInputChangeProduto = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPedido(prev => ({ ...prev, Produto: e.target.value }));
        setToast(null);
    };

    const handleInputChangeValor = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // 1. Remove tudo exceto dígitos e vírgula
        let sanitized = input.replace(/[^\d,]/g, '');

        // 2. Garante que só haja uma vírgula (decimal separator)
        const parts = sanitized.split(',');
        if (parts.length > 2) {
            sanitized = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // 3. Limita a duas casas decimais
        const finalParts = sanitized.split(',');
        if (finalParts.length > 1 && finalParts[1].length > 2) {
            sanitized = finalParts[0] + ',' + finalParts[1].substring(0, 2);
        }

        // 4. Atualiza a string de exibição (crua)
        setDisplayValue(sanitized); 

        // 5. Converte para float (trocando a vírgula por ponto)
        const cleanNumericString = sanitized.replace(',', '.');
        const numericValue = parseFloat(cleanNumericString) || 0;
        
        // 6. Salva o número LIMPO no estado de Payload
        setPedido(prev => ({ ...prev, Valor: numericValue }));
        setToast(null);
    };
    
    // HANDLER DE FOCO: Prepara o campo para edição (valor cru)
    const handleFocusValor = (e: React.FocusEvent<HTMLInputElement>) => {
        // Mostra o número puro (ex: '123,45') para fácil edição
        const rawDecimalString = pedido.Valor.toFixed(2).replace('.', ',');
        setDisplayValue(rawDecimalString);
        e.target.select();
    }

    // HANDLER DE DESFOQUE: Formata o valor para exibição (R$ 1.234,50)
    const handleBlurValor = () => {
        const numericValue = pedido.Valor; 
        // Formata o valor salvo para o padrão brasileiro
        const formattedValue = `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        setDisplayValue(formattedValue);
    }

    // Handler de Submissão (mantido inalterado)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validações
        if (!pedido.Cliente.trim() || !pedido.Produto.trim() || pedido.Valor <= 0) {
            showToast("Preencha todos os campos obrigatórios e garanta que o valor seja positivo.", 'error');
            return;
        }

        setLoading(true);
        setToast(null);

        try {
            await apiClient.post('/orders', pedido);
            
            showToast("Pedido enviado com sucesso! O status será atualizado na lista.", 'success');
            setPedido(initialPayload); 
            // Garante que o display volte ao formato inicial
            setDisplayValue('R$ 0,00');
            
        } catch (err: any) {
            let errorMessage = "Ocorreu um erro desconhecido ao enviar o pedido.";

            if (err.response && err.response.data) {
                if (err.response.data.errors) {
                    const firstErrorKey = Object.keys(err.response.data.errors)[0];
                    errorMessage = `${firstErrorKey}: ${err.response.data.errors[firstErrorKey][0]}`;
                } else if (err.response.data.title) {
                    errorMessage = err.response.data.title;
                }
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl transform transition duration-300 hover:shadow-indigo-300/50">
                <header className="mb-8 border-b pb-4 border-gray-100">
                    <h3 className="text-3xl font-extrabold text-indigo-700">
                        Novo Pedido
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Insira os detalhes para criar um novo pedido no sistema.
                    </p>
                </header>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Campo Nome do Cliente */}
                    <div>
                        <label htmlFor="clienteNome" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Cliente <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="clienteNome"
                            value={pedido.Cliente} 
                            onChange={handleInputChangeCliente} 
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 
                                        focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base"
                            placeholder="Ex: Pedro Álvares Cabral"
                            required
                        />
                    </div>
                    
                    {/* Campo Nome do Produto */}
                    <div>
                        <label htmlFor="produto" className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição do Produto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="produto"
                            value={pedido.Produto}
                            onChange={handleInputChangeProduto} 
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 
                                        focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base"
                            placeholder="Ex: Software de Gestão"
                            required
                        />
                    </div>
                    
                    {/* Campo Valor Total (Destacado) */}
                    <div>
                        <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                            Valor Total <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" 
                            id="valor"
                            value={displayValue}
                            onChange={handleInputChangeValor} 
                            onFocus={handleFocusValor}
                            onBlur={handleBlurValor}
                            className="w-full border-2 border-green-500 rounded-lg shadow-inner p-4 
                                        text-2xl font-extrabold text-green-700 text-right
                                        focus:ring-green-600 focus:border-green-600 transition duration-150"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {/* Botão de Submissão */}
                    <button
                        type="submit"
                        disabled={loading || !pedido.Cliente.trim() || !pedido.Produto.trim() || pedido.Valor <= 0}
                        className={`w-full py-3 px-4 rounded-lg shadow-md text-base font-semibold text-white 
                            flex items-center justify-center transition duration-200 ease-in-out 
                            ${loading || !pedido.Cliente.trim() || !pedido.Produto.trim() || pedido.Valor <= 0
                                ? 'bg-indigo-300 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`
                        }
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enviando Pedido...
                            </>
                        ) : (
                            'Finalizar e Enviar Pedido'
                        )}
                    </button>
                    
                </form>
                
                {toast && <ToastNotification message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
};
