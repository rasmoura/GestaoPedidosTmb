using Azure.Messaging.ServiceBus;
using Domain.Entities;
using Domain.Messages;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace PedidosWorker
{
    // BackgroundService para hospedar o consumidor ASB
    public class ConsumidorPedidos : BackgroundService
    {
        private readonly ServiceBusProcessor _processor;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ConsumidorPedidos> _logger;

        public ConsumidorPedidos(ServiceBusClient serviceBusClient, 
                                 IConfiguration configuration,
                                 IServiceScopeFactory scopeFactory,
                                 ILogger<ConsumidorPedidos> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            
            var queueName = configuration["AZURE_SERVICE_BUS_QUEUE_NAME"];
            
            // Cria o processador para a fila
            _processor = serviceBusClient.CreateProcessor(queueName, new ServiceBusProcessorOptions());
            
            // Define os handlers
            _processor.ProcessMessageAsync += ProcessarMensagemAsync;
            _processor.ProcessErrorAsync += TratarErroAsync;
        }

        // Método principal do BackgroundService
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Iniciando Processador de Pedidos no Service Bus...");
            await _processor.StartProcessingAsync(stoppingToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Parando Processador de Pedidos...");
            await _processor.StopProcessingAsync(cancellationToken);
            await base.StopAsync(cancellationToken);
        }
        
        private async Task ProcessarMensagemAsync(ProcessMessageEventArgs args)
        {
            string body = args.Message.Body.ToString();
            _logger.LogInformation("Mensagem recebida: {body}", body);
            
            try
            {
                // 1. Desserializar Payload
                var payload = JsonSerializer.Deserialize<PedidoCriadoMensagem>(body);
                if (payload == null)
                {
                    _logger.LogError("Payload inválido. Abandonando mensagem.");
                    await args.AbandonMessageAsync(args.Message);
                    return;
                }

                // 2. Criar um escopo para o DbContext (garante DbContext por mensagem)
                using (var scope = _scopeFactory.CreateScope())
                {
                    var contexto = scope.ServiceProvider.GetRequiredService<PedidosContext>();
                    await ProcessarPedido(contexto, payload, args.CancellationToken);
                }
                
                // 3. Concluir a mensagem (Sucesso!)
                await args.CompleteMessageAsync(args.Message);
            }
            catch (DbUpdateConcurrencyException)
            {
                // Conflito de concorrência (outro worker atualizou). Apenas logar e completar.
                _logger.LogWarning("Conflito de concorrência ao processar o pedido. O status será verificado na próxima execução.");
                await args.CompleteMessageAsync(args.Message);
            }
            catch (Exception ex)
            {
                // Abandonar para reprocessamento (retorna à fila)
                _logger.LogError(ex, "Erro no processamento da mensagem. Tentando Abandonar.");
                await args.AbandonMessageAsync(args.Message);
            }
        }
        
        private async Task ProcessarPedido(PedidosContext contexto, PedidoCriadoMensagem payload, CancellationToken cancellationToken)
        {
            var pedido = await contexto.Pedidos.FirstOrDefaultAsync(p => p.Id == payload.PedidoId, cancellationToken);

            if (pedido == null)
            {
                _logger.LogWarning("Pedido {Id} não encontrado. Mensagem irrelevante.", payload.PedidoId);
                return; 
            }

            // 1. Processa pedido se estiver 'Pendente'
            if (pedido.Status != StatusPedido.Pendente)
            {
                _logger.LogInformation("Pedido {Id} já está em status {Status}. Processamento ignorado.", payload.PedidoId, pedido.Status);
                return;
            }
            
            // 2. Atualizar para 'Processando'
            pedido.Status = StatusPedido.Processando;
            contexto.Update(pedido);
            await contexto.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Pedido {Id} alterado para Processando.", pedido.Id);

            // 3. Simular Processamento (5 segundos)
            _logger.LogInformation("Simulando processamento para Pedido {Id}...", pedido.Id);
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);

            // 4. Atualizar para 'Finalizado'
            pedido.Status = StatusPedido.Finalizado;
            contexto.Update(pedido);
            await contexto.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Pedido {Id} alterado para Finalizado.", pedido.Id);
        }

        private Task TratarErroAsync(ProcessErrorEventArgs args)
        {
            _logger.LogError(args.Exception, 
                     "Erro na infraestrutura do Azure Service Bus. Fonte: {Source}", 
                     args.FullyQualifiedNamespace);
            return Task.CompletedTask;
        }
    }
}