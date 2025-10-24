using System.ComponentModel.DataAnnotations;

namespace Api.Models
{
    public class CriarPedidoDto
    {
        [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
        public string Cliente { get; set; }

        [Required(ErrorMessage = "O produto é obrigatório.")]
        public string Produto { get; set; }

        [Required(ErrorMessage = "O valor é obrigatório.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor deve ser positivo")]
        public decimal Valor{ get; set; }
    }
}