using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration; // Necessário para ler o appsettings

namespace Infrastructure.Context
{
    // A classe deve implementar IDesignTimeDbContextFactory com seu DbContext
    public class PedidosContextFactory : IDesignTimeDbContextFactory<PedidosContext>
    {
        public PedidosContext CreateDbContext(string[] args)
        {
            // 1. Configurar a leitura do appsettings (ou variáveis de ambiente, se preferir)
            // O EF Core Tools tentará ler as configurações do projeto de startup (Api)
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                // O .AddJsonFile deve ser ajustado para ler a partir da pasta do projeto Api
                // Se o comando for executado de 'src/Backend', precisamos direcionar para 'Api'
                .AddJsonFile("Api/appsettings.json", optional: true) 
                .AddEnvironmentVariables()
                .Build();

            // 2. Tentar obter a Connection String (usando a chave que você usaria na API)
            // Para Migrações, usaremos uma Connection String dummy ou a que estiver na config
            // No seu caso, o ideal é ler de uma variável de ambiente, se DB_CONNECTION_STRING for usada.
            // Para fins de design-time, vamos simular:
            
            // NOTE: Para ambiente Docker, Host=postgres. Para rodar a migration localmente, pode ser 'localhost'.
            // Vamos usar 'localhost' aqui para garantir que a migration rode localmente, se necessário.
            const string connectionString = "Host=localhost;Port=5432;Database=pedidosdb;Username=appuser;Password=supersecret"; 

            // 3. Criar as opções do DbContext
            var optionsBuilder = new DbContextOptionsBuilder<PedidosContext>();
            
            // Usar Npgsql com a Connection String
            optionsBuilder.UseNpgsql(connectionString);

            // 4. Retornar a instância do contexto
            return new PedidosContext(optionsBuilder.Options);
        }
    }
}