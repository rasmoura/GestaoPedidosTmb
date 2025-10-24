namespace Domain.Entities
{
    public enum StatusPedido { Pendente, Processando, Finalizado }

    public class Pedido
    {
        public Guid Id { get; set; }
        public string Cliente { get; set; }
        public string Produto { get; set; }
        public decimal Valor { get; set; }
        public StatusPedido Status { get; set; } = StatusPedido.Pendente;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}