using Azure.Messaging.ServiceBus;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using PedidosWorker;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        var configuration = hostContext.Configuration;

        // 1. Configuração do DB Context
        var connectionString = configuration.GetValue<string>("DB_CONNECTION_STRING") 
            ?? throw new InvalidOperationException("DB_CONNECTION_STRING não configurada.");

        services.AddDbContext<PedidosContext>(options =>
            options.UseNpgsql(connectionString));
        
        // 2. Configuração do Azure Service Bus Client
        var asbConnectionString = configuration.GetValue<string>("AZURE_SERVICE_BUS_CONNECTION_STRING")
            ?? throw new InvalidOperationException("ASB_CONNECTION_STRING não configurada.");
        
        // Injetar ServiceBusClient como Singleton
        services.AddSingleton(new ServiceBusClient(asbConnectionString));
        
        // 3. Adicionar o Consumidor como Serviço Hospedado (BackgroundService)
        services.AddHostedService<ConsumidorPedidos>();
    })
    .Build();

await host.RunAsync();