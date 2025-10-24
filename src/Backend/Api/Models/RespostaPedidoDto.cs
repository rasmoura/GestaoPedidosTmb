using Domain.Entities;

namespace Api.Models
{
    public class RespostaPedidoDto
    {
        public Guid Id { get; set; }
        public string Cliente { get; set; }
        public string Produto { get; set; }
        public decimal Valor { get; set; }
        public StatusPedido Status { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}