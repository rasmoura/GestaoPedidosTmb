using Api.Mappers;
using Api.Models;
using Azure.Messaging.ServiceBus;
using Domain.Entities;
using Infrastructure.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/orders")]
    public class PedidosController : ControllerBase
    {
        private readonly PedidosContext _contexto;
        private readonly ServiceBusSender _serviceBusSender;

        // Injeção de Dependência
        public PedidosController(PedidosContext contexto, ServiceBusSender serviceBusSender)
        {
            _contexto = contexto;
            _serviceBusSender = serviceBusSender;
        }

        // POST /orders → Cria um novo pedido
        // [POST] Criar Pedido e Publicar Mensagem
        [HttpPost]
        public async Task<IActionResult> CriarPedido([FromBody] CriarPedidoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

           // Mapear DTO para Entidade e Definir Status Inicial
            var pedido = new Pedido
            {
                Id = Guid.NewGuid(),
                Cliente = dto.Cliente,
                Produto = dto.Produto,
                Valor = dto.Valor,
                Status = StatusPedido.Pendente,
                DataCriacao = DateTime.UtcNow
            };

            // Persistir no DB
            _contexto.Pedidos.Add(pedido);
            await _contexto.SaveChangesAsync();

            // Publicar Mensagem no Azure Service Bus
            try
            {
                var mensagemPayload = new { PedidoId = pedido.Id, TipoEvento = "PedidoCriado", Data = DateTime.UtcNow };
                var corpoMensagem = JsonSerializer.Serialize(mensagemPayload);

                var mensagemASB = new ServiceBusMessage(corpoMensagem)
                {
                    CorrelationId = pedido.Id.ToString(),
                    Subject = "PedidoCriado" // Usado pelo Worker para roteamento, se necessário
                };

                await _serviceBusSender.SendMessageAsync(mensagemASB);
            }
            catch (Exception ex)
            {
                // Em um ambiente de produção, este erro deve ser logado (e-mail de alerta).
                // O Outbox Pattern é o que resolve a falha na publicação de forma confiável.
                // Por enquanto, logamos e permitimos que o cliente receba a resposta.
                Console.WriteLine($"ERRO ao publicar mensagem no ASB: {ex.Message}");
            }

            // 4. Responder ao Cliente
            return CreatedAtAction(nameof(ObterPedidoPorId), new { id = pedido.Id }, pedido.ToRespostaPedidoDto());
        }

        // GET /orders → Lista todos os pedidos
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<RespostaPedidoDto>>> ObterTodosPedidos()
        {
            var pedidos = await _contexto.Pedidos.ToListAsync();

            // Mapeia a lista de Entidades para DTOs
            return Ok(pedidos.Select(p => p.ToRespostaPedidoDto()));
        }
        
        // GET /orders/{id} → Obtém detalhes de um pedido
        [HttpGet("{id:Guid}", Name = nameof(ObterPedidoPorId))]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<RespostaPedidoDto>> ObterPedidoPorId(Guid id)
        {
            var pedido = await _contexto.Pedidos.FindAsync(id);

            if (pedido == null)
            {
                return NotFound($"Pedido com ID {id} não encontrado.");
            }

            // Mapeia a Entidade para DTO
            return Ok(pedido.ToRespostaPedidoDto());
        }
    }
}