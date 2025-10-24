using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Context
{
    public class PedidosContext : DbContext
    {
        public PedidosContext(DbContextOptions<PedidosContext> options) : base(options) { }

        public DbSet<Pedido> Pedidos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configurações de mapeamento específicas (índices, etc.)
            modelBuilder.Entity<Pedido>().Property(p => p.Status).HasConversion<string>();
            base.OnModelCreating(modelBuilder);
        }
    }
}