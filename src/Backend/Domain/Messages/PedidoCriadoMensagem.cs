namespace Domain.Messages
{
    // Representa o payload JSON enviado ao Service Bus
    public class PedidoCriadoMensagem
    {
        public Guid PedidoId { get; set; }
        public string TipoEvento { get; set; }
        public DateTime Data { get; set; }
    }
}