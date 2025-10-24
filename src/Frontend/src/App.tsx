import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PedidoPage } from './pages/PedidoPage.tsx';
import { PedidoDetalhe } from './components/pedidos/PedidoDetalhe.tsx';
import { Header } from './components/layout/Header.tsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
    <Router>
      <div className="container mx-auto p-4">
        <Routes>
          {/* Rota principal (Formulário + Lista, se houver) */}
          <Route path="/" element={<PedidoPage />} /> 

          {/* NOVA ROTA para os detalhes do pedido */}
          <Route path="/orders/:id" element={<PedidoDetalhe />} /> 
        </Routes>
      </div>
    </Router>
        <footer className="w-full py-4 text-center text-gray-500 text-sm">
          Sistema de Gestão de Pedidos TMB &copy; 2025
        </footer>
      </div>
  );
}

export default App;