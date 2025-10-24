Sistema de Gestão de Pedidos TMB

Este repositório contém dois componentes principais:

Backend/Worker (C#/.NET Core): O serviço de fundo (Background Service) responsável por consumir mensagens do Azure Service Bus e atualizar o status dos pedidos no banco de dados PostgreSQL.

Frontend (React/TypeScript): A interface web para visualização e gerenciamento dos detalhes dos pedidos.

⚙️ Pré-requisitos

Para rodar o projeto localmente, você precisará ter instalado:

.NET SDK 8.0 ou superior.

Node.js e npm (LTS recomendado).

PostgreSQL ou acesso a uma instância de banco de dados.

Acesso a um Azure Service Bus Namespace e uma Fila configurada (ex: pedidos-criados).

1. Configuração do Backend/Worker

O Worker Service precisa de duas variáveis de ambiente cruciais para funcionar: a string de conexão do banco de dados e a string de conexão do Azure Service Bus.

A. Variáveis de Ambiente

Você deve configurar estas variáveis no arquivo src/Backend/Worker/Properties/launchSettings.json (para rodar via dotnet run) ou diretamente no seu ambiente (se usar Docker/VM).

Exemplo de launchSettings.json (apenas a seção de variáveis):

"environmentVariables": {
  "ASPNETCORE_ENVIRONMENT": "Development",
  "DB_CONNECTION_STRING": "Host=localhost;Port=5432;Database=gestaopedidos;Username=user;Password=mypassword",
  "AZURE_SERVICE_BUS_CONNECTION_STRING": "Endpoint=sb://your-namespace.servicebus.windows.net/..."
}


Variável

Descrição

DB_CONNECTION_STRING

String de conexão completa para o seu banco de dados PostgreSQL.

AZURE_SERVICE_BUS_CONNECTION_STRING

String de conexão para o seu Azure Service Bus Namespace.

B. Migrações e Banco de Dados

Navegue até o diretório do seu projeto de Data Access ou o projeto Worker:

cd src/Backend/Worker


Aplique as migrações do Entity Framework Core para criar o banco de dados e as tabelas:

dotnet ef database update


(Ajuste o comando se as migrações estiverem em um projeto separado).

C. Execução do Worker

Execute o Worker Service no terminal:

dotnet run --project src/Backend/Worker/Worker.csproj


O serviço será iniciado e começará a escutar a fila do Azure Service Bus, processando e atualizando o status dos pedidos no PostgreSQL.

2. Configuração e Execução do Frontend

O Frontend é uma aplicação React que se comunica com uma API de Pedidos (que, neste guia, assumimos que está rodando em um endereço base).

A. Instalação de Dependências

Navegue até o diretório do Frontend:

cd src/Frontend
npm install


B. Configuração da API

A variável apiClient no seu arquivo PedidoDetalhe.tsx geralmente depende de um endereço base para a API. Verifique o arquivo de configuração do seu apiClient (src/apiClient.ts ou similar) e assegure-se de que a baseURL aponte para o endereço correto da sua API de Pedidos (ex: http://localhost:5000/api).

C. Execução do Frontend

Inicie o servidor de desenvolvimento do React:

npm start


A aplicação abrirá automaticamente no seu navegador, geralmente em http://localhost:3000.

🚀 Como Testar o Sistema

Worker Service: Deve estar rodando e pronto para consumir mensagens.

API de Pedidos: Deve estar rodando (supondo que é um projeto separado).

Frontend: Deve estar acessível no navegador.

Para testar o fluxo completo:

Crie um novo pedido através da API (ou pelo próprio frontend, se tiver um formulário de criação).

O endpoint de criação deve salvar o pedido no PostgreSQL (status 0 - Pendente) e publicar uma mensagem na fila do Azure Service Bus.

O Worker Service deve consumir esta mensagem, atualizar o status do pedido para 1 (Processando) e, em seguida, para 2 (Finalizado) no PostgreSQL.

No Frontend, ao visualizar o detalhe do pedido, o status deverá refletir o valor final (Finalizado).
