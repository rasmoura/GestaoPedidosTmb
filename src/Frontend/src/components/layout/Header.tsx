import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Gestão de Pedidos - TMB
        </h2>
      </div>
    </header>
  );
};