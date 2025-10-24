using Azure.Messaging.ServiceBus;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionStringDb = builder.Configuration.GetValue<string>("DB_CONNECTION_STRING") 
    ?? throw new InvalidOperationException("DB_CONNECTION_STRING não configurada.");

var connectionStringAsb = builder.Configuration.GetValue<string>("AZURE_SERVICE_BUS_CONNECTION_STRING")
    ?? throw new InvalidOperationException("AZURE_SERVICE_BUS_CONNECTION_STRING não configurada.");

var queueName = builder.Configuration.GetValue<string>("AZURE_SERVICE_BUS_QUEUE_NAME")
    ?? throw new InvalidOperationException("AZURE_SERVICE_BUS_QUEUE_NAME não configurada.");
    
// Configurar o Service Bus
builder.Services.AddSingleton(sp =>
{
    return new ServiceBusClient(connectionStringAsb);
});

// Registrar o ServiceBusSender (Producer)
builder.Services.AddScoped<ServiceBusSender>(sp =>
{
    var client = sp.GetRequiredService<ServiceBusClient>();
    return client.CreateSender(queueName);
});

//Configurar Health Checks

builder.Services.AddHealthChecks()
    // Health Check para PostgreSQL
    // Verifica a conexão com o DB
    .AddNpgSql(
        connectionString: connectionStringDb,
        name: "PostgreSQL Check",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "db", "ready" })

    // Health Check para Azure Service Bus (Fila)
    // Verifica se consegue se conectar ao ASB e se a fila existe
    .AddAzureServiceBusQueue(
        connectionString: connectionStringAsb,
        queueName: queueName,
        name: "Azure Service Bus Queue Check",
        failureStatus: HealthStatus.Degraded, // Um status mais suave para mensageria
        tags: new[] { "messaging", "ready" });

builder.Services.AddDbContext<Infrastructure.Context.PedidosContext>(options =>
    options.UseNpgsql(connectionStringDb));

// Define a política de CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins"; 

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Permite que o Front em localhost:3000 (ou a porta que você usa) acesse
                          policy.WithOrigins("http://localhost:5173","http://localhost:3000", "http://127.0.0.1:3000") 
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();

// Habilita a política de CORS ANTES de UseAuthorization
app.UseCors(MyAllowSpecificOrigins);

// Mapear o endpoint padrão /health
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    // Apenas verifica se a aplicação está rodando (pode ser um check simples)
    Predicate = (_) => false // Retorna sempre OK, a menos que a app falhe
});

// Mapear o endpoint /health/ready (pronto para receber tráfego)
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    // Verifica todos os checks com a tag "ready" (DB e ASB)
    Predicate = (check) => check.Tags.Contains("ready"),

    // Opção: Formatar a saída para JSON (padrão)
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapControllers();

app.Run();