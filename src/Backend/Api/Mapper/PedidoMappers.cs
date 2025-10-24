using Api.Models;
using Domain.Entities;

namespace Api.Mappers
{
    public static class PedidoMappers
    {
        /// <summary>
        /// Converte a Entidade Pedido para o DTO de Resposta.
        /// </summary>
        public static RespostaPedidoDto ToRespostaPedidoDto(this Pedido pedido)
        {
            if (pedido == null)
            {
                return null;
            }

            return new RespostaPedidoDto
            {
                Id = pedido.Id,
                Cliente = pedido.Cliente,
                Produto = pedido.Produto,
                Valor = pedido.Valor,
                Status = pedido.Status,
                DataCriacao = pedido.DataCriacao
            };
        }
    }
}