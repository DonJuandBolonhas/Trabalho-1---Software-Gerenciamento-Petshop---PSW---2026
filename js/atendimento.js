// Garante o reuso da classe genérica StorageService apenas se ela ainda não existir na janela
if (typeof window.StorageService === 'undefined') {
    window.StorageService = class StorageService {
        constructor(key) {
            this.key = key;
        }

        // Recupera todos os registros armazenados na chave indicada ou retorna lista vazia
        obterTodos() {
            const dados = localStorage.getItem(this.key);
            return dados ? JSON.parse(dados) : [];
        }

        // Procura um item na lista através do seu ID único
        obterPorId(id) {
            const itens = this.obterTodos();
            return itens.find(item => item.id === String(id)) || null;
        }

        // Grava um novo item no array ou atualiza as informações do item existente
        salvar(item) {
            const itens = this.obterTodos();
            
            if (!item.id) {
                // Se o item não tem ID, cria um usando o timestamp atual como identificador
                item.id = Date.now().toString();
                itens.push(item);
            } else {
                // Caso já tenha ID, localiza a posição e faz o merge dos dados antigos com os novos
                const index = itens.findIndex(i => i.id === String(item.id));
                if (index !== -1) {
                    itens[index] = { ...itens[index], ...item };
                }
            }
            
            // Salva a lista atualizada no localStorage em formato textual (JSON)
            localStorage.setItem(this.key, JSON.stringify(itens));
            return item;
        }

        // Exclui um item da lista filtrando pelo ID
        removerPorId(id) {
            let itens = this.obterTodos();
            itens = itens.filter(item => String(item.id) !== String(id));
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}

// Especialização da classe base para lidar com particularidades da chave de Atendimentos
class AtendimentoStorageService extends StorageService {
    constructor() {
        // Inicializa o serviço base passando a chave específica dos atendimentos
        super('petshop_atendimentos');
    }

    // Busca rápida usando o número do atendimento em vez do ID interno
    obterPorNumero(numero) {
        const itens = this.obterTodos();
        return itens.find(item => String(item.numeroAtendimento) === String(numero)) || null;
    }

    // Remove o registro da chave utilizando o número do atendimento
    removerPorNumero(numero) {
        let itens = this.obterTodos();
        itens = itens.filter(item => String(item.numeroAtendimento) !== String(numero));
        localStorage.setItem(this.key, JSON.stringify(itens));
    }
}

// Controlador para gerenciar o formulário de inclusão e edição de atendimentos
class AtendimentoController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new AtendimentoStorageService();
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Associa eventos de envio do formulário e buscas manuais
    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault(); // Cancela a atualização padrão do formulário
            event.stopPropagation();
            this.salvarAtendimento();
        });

        // Clique para carregar o atendimento pelo número na tela de edição
        const btnCarregar = document.getElementById('btn-carregar-numero');
        if (btnCarregar) {
            btnCarregar.addEventListener('click', () => {
                const numInput = document.getElementById('input-busca-numero')?.value.trim();
                if (numInput) {
                    this.carregarAtendimentoParaEdicao(numInput);
                }
            });
        }
    }

    // Identifica se foi passado um parâmetro ?numero=... na URL do navegador
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const numeroUrl = urlParams.get('numero');
        if (numeroUrl) {
            this.carregarAtendimentoParaEdicao(numeroUrl);
        }
    }

    // Preenche os campos do formulário com as informações registradas no atendimento
    carregarAtendimentoParaEdicao(numero) {
        const atendimento = this.storage.obterPorNumero(numero);

        if (!atendimento) {
            alert('Atendimento não encontrado com o número informado!');
            return;
        }

        // Registra o ID no atributo de dados do form para controlar o modo de edição
        this.form.dataset.atendimentoId = atendimento.id;

        if (document.getElementById('atendimento')) document.getElementById('atendimento').value = atendimento.numeroAtendimento || '';
        if (document.getElementById('nomea')) document.getElementById('nomea').value = atendimento.nomeAnimal || '';
        if (document.getElementById('nomet')) document.getElementById('nomet').value = atendimento.nomeTutor || '';
        if (document.getElementById('nomef')) document.getElementById('nomef').value = atendimento.nomeFuncionario || '';
        if (document.getElementById('data')) document.getElementById('data').value = atendimento.dataAtendimento || '';
        if (document.getElementById('message')) document.getElementById('message').value = atendimento.anotacoes || '';
    }

    // Coleta as entradas do formulário e organiza em um objeto JavaScript
    obterDadosFormulario() {
        const formData = new FormData(this.form);

        return {
            id: this.form.dataset.atendimentoId || null,
            numeroAtendimento: formData.get('atendimento')?.trim(),
            nomeAnimal: formData.get('nomea')?.trim(),
            nomeTutor: formData.get('nomet')?.trim(),
            nomeFuncionario: formData.get('nomef')?.trim(),
            dataAtendimento: formData.get('data'),
            anotacoes: formData.get('message')?.trim(),
            criadoEm: new Date().toISOString()
        };
    }

    // Valida o preenchimento de campos essenciais antes do envio
    validar(atendimento) {
        if (!atendimento.numeroAtendimento) {
            alert('Por favor, informe o número do atendimento.');
            return false;
        }
        if (!atendimento.nomeAnimal) {
            alert('Por favor, informe o nome do animal.');
            return false;
        }
        if (!atendimento.nomeTutor) {
            alert('Por favor, informe o nome do tutor.');
            return false;
        }
        return true;
    }

    // Efetua a gravação do registro no localStorage
    salvarAtendimento() {
        const atendimento = this.obterDadosFormulario();

        if (!this.validar(atendimento)) {
            return;
        }

        try {
            this.storage.salvar(atendimento);
            const mensagem = atendimento.id ? 'Atendimento alterado com sucesso!' : 'Atendimento cadastrado com sucesso!';
            alert(mensagem);
            
            // Redireciona para a consulta caso esteja editando ou reseta a tela em novo registro
            if (this.form.dataset.atendimentoId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar atendimento:', error);
            alert('Ocorreu um erro ao salvar o atendimento.');
        }
    }
}

// Controladora da página de consulta e listagem dos atendimentos
class AtendimentoConsultaController {
    constructor() {
        this.storage = new AtendimentoStorageService();
        this.tabelaBody = document.getElementById('tabela-atendimentos-body');
        this.inputFiltro = document.getElementById('input-filtro');
        this.btnLimpar = document.getElementById('btn-limpar-filtro');

        if (this.tabelaBody) {
            this.iniciar();
        }
    }

    // Ativa a listagem inicial e a escuta do campo de filtro por pesquisa
    iniciar() {
        this.renderizarTabela();

        if (this.inputFiltro) {
            this.inputFiltro.addEventListener('input', () => {
                const termo = this.inputFiltro.value.toLowerCase().trim();
                this.renderizarTabela(termo);
            });
        }

        if (this.btnLimpar) {
            this.btnLimpar.addEventListener('click', () => {
                this.inputFiltro.value = '';
                this.renderizarTabela();
            });
        }
    }

    // Renderiza a estrutura da tabela filtrando por número, animal, tutor ou funcionário
    renderizarTabela(filtro = '') {
        const atendimentos = this.storage.obterTodos();
        
        const filtrados = atendimentos.filter(a => {
            const numMatch = a.numeroAtendimento && String(a.numeroAtendimento).includes(filtro);
            const animalMatch = a.nomeAnimal && a.nomeAnimal.toLowerCase().includes(filtro);
            const tutorMatch = a.nomeTutor && a.nomeTutor.toLowerCase().includes(filtro);
            const funcMatch = a.nomeFuncionario && a.nomeFuncionario.toLowerCase().includes(filtro);
            return numMatch || animalMatch || tutorMatch || funcMatch;
        });

        this.tabelaBody.innerHTML = '';

        if (filtrados.length === 0) {
            this.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum atendimento encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        // Monta o elemento HTML para cada linha de atendimento encontrada
        filtrados.forEach(atendimento => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${this.escaparHtml(atendimento.numeroAtendimento || '-')}</strong></td>
                <td>${this.escaparHtml(atendimento.nomeAnimal || '-')}</td>
                <td>${this.escaparHtml(atendimento.nomeTutor || '-')}</td>
                <td>${this.escaparHtml(atendimento.nomeFuncionario || '-')}</td>
                <td>${this.escaparHtml(atendimento.dataAtendimento || '-')}</td>
                <td class="text-center">
                    <a href="alteracao.html?numero=${encodeURIComponent(atendimento.numeroAtendimento)}" class="btn btn-sm btn-warning mr-1">Editar</a>
                    <a href="remocao.html?numero=${encodeURIComponent(atendimento.numeroAtendimento)}" class="btn btn-sm btn-danger">Excluir</a>
                </td>
            `;
            this.tabelaBody.appendChild(tr);
        });
    }

    // Sanitiza strings dinâmicas inseridas nas células contra códigos maliciosos (XSS)
    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// Controller que gerencia a busca e exclusão de um atendimento selecionado
class AtendimentoRemocaoController {
    constructor() {
        this.storage = new AtendimentoStorageService();
        this.atendimentoAtual = null;

        this.container = document.getElementById('container-remocao-atendimento');
        this.cardDados = document.getElementById('card-dados-atendimento');
        this.painelVazio = document.getElementById('painel-vazio');

        if (this.container) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Registra as escutas do botão de pesquisa e da ação de confirmação do modal
    iniciarEventos() {
        const btnBuscar = document.getElementById('btn-buscar-atendimento');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarAtendimento());
        }

        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.executarExclusao());
        }
    }

    // Lê os parâmetros de URL caso o usuário venha direto da tela de consulta
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const numeroUrl = urlParams.get('numero');
        if (numeroUrl) {
            const tipoSelect = document.getElementById('tipoBusca');
            const termoInput = document.getElementById('termoBusca');
            if (tipoSelect) tipoSelect.value = 'numero';
            if (termoInput) termoInput.value = numeroUrl;
            this.carregarAtendimentoPorNumero(numeroUrl);
        }
    }

    // Procura o registro conforme o tipo de busca selecionado no elemento select (número, ID ou tutor)
    buscarAtendimento() {
        const tipoBusca = document.getElementById('tipoBusca')?.value;
        const termo = document.getElementById('termoBusca')?.value.trim();

        if (!termo) {
            alert('Por favor, digite um termo para busca.');
            return;
        }

        const todos = this.storage.obterTodos();
        let encontrado = null;

        if (tipoBusca === 'numero') {
            encontrado = this.storage.obterPorNumero(termo);
        } else if (tipoBusca === 'id') {
            encontrado = this.storage.obterPorId(termo);
        } else if (tipoBusca === 'tutor') {
            const termoLower = termo.toLowerCase();
            encontrado = todos.find(a => a.nomeTutor && a.nomeTutor.toLowerCase().includes(termoLower));
        }

        if (encontrado) {
            this.exibirAtendimento(encontrado);
        } else {
            alert('Nenhum atendimento foi localizado com os dados informados.');
            this.ocultarAtendimento();
        }
    }

    // Busca rápida utilizando a chave do número do atendimento
    carregarAtendimentoPorNumero(numero) {
        const atendimento = this.storage.obterPorNumero(numero);
        if (atendimento) {
            this.exibirAtendimento(atendimento);
        } else {
            alert('Atendimento não encontrado com o número informado.');
            this.ocultarAtendimento();
        }
    }

    // Mostra as informações do atendimento na área de confirmação de exclusão
    exibirAtendimento(atendimento) {
        this.atendimentoAtual = atendimento;

        if (document.getElementById('info-numero')) document.getElementById('info-numero').textContent = atendimento.numeroAtendimento ? `#${atendimento.numeroAtendimento}` : '-';
        if (document.getElementById('info-animal')) document.getElementById('info-animal').textContent = atendimento.nomeAnimal || '-';
        if (document.getElementById('info-tutor')) document.getElementById('info-tutor').textContent = atendimento.nomeTutor || '-';
        if (document.getElementById('info-funcionario')) document.getElementById('info-funcionario').textContent = atendimento.nomeFuncionario || '-';
        if (document.getElementById('info-data')) document.getElementById('info-data').textContent = atendimento.dataAtendimento || '-';

        if (document.getElementById('modal-numero-atendimento')) {
            document.getElementById('modal-numero-atendimento').textContent = atendimento.numeroAtendimento ? `#${atendimento.numeroAtendimento}` : 'Atendimento';
        }

        if (this.painelVazio) this.painelVazio.classList.add('d-none');
        if (this.cardDados) this.cardDados.classList.remove('d-none');
    }

    // Oculta a área de detalhes quando a busca falha ou não traz dados
    ocultarAtendimento() {
        this.atendimentoAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

    // Executa a exclusão definitiva do registro do localStorage
    executarExclusao() {
        if (!this.atendimentoAtual || !this.atendimentoAtual.numeroAtendimento) {
            alert('Nenhum atendimento selecionado para remoção.');
            return;
        }

        try {
            this.storage.removerPorNumero(this.atendimentoAtual.numeroAtendimento);

            if (typeof $ !== 'undefined') {
                $('#modalConfirmacao').modal('hide');
            }

            alert('Atendimento removido com sucesso!');
            window.location.href = 'consulta.html';
        } catch (error) {
            console.error('Erro ao remover atendimento:', error);
            alert('Ocorreu um erro ao tentar excluir o atendimento.');
        }
    }
}

// Inicializa a classe controladora correspondente aos elementos HTML presentes no DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-atendimento')) {
        new AtendimentoController('form-atendimento');
    }
    
    if (document.getElementById('tabela-atendimentos-body')) {
        new AtendimentoConsultaController();
    }

    if (document.getElementById('container-remocao-atendimento')) {
        new AtendimentoRemocaoController();
    }
});
