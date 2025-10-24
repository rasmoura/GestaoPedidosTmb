import React from 'react';
import { PedidoForm } from '../components/pedidos/PedidoForm.tsx';
import { PedidoList } from '../components/pedidos/PedidoList.tsx';

export const PedidoPage: React.FC = () => {
  // O estado dos pedidos será gerenciado aqui ou via Redux/Context futuramente

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <PedidoForm />
      </div>
      
      <div className="lg:col-span-2">
        <PedidoList />
      </div>
    </div>
  );
};