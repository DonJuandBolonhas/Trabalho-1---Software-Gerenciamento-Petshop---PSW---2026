// Evita sobrescrever a classe caso este script seja importado mais de uma vez na página
if (typeof window.StorageService === 'undefined') {

    // Classe responsável por gerenciar a leitura e escrita no localStorage de forma genérica
    window.StorageService = class StorageService {
        constructor(key) {
            // Define a chave do localStorage (ex: 'petshop_clientes')
            this.key = key;
        }

        // Retorna todos os registros salvos na chave ou uma lista vazia se não houver nada
        obterTodos() {
            const dados = localStorage.getItem(this.key);
            return dados ? JSON.parse(dados) : [];
        }

        // Busca um item específico pelo seu ID único
        obterPorId(id) {
            const itens = this.obterTodos();
            return itens.find(item => item.id === String(id)) || null;
        }

        // Busca um cliente pelo CPF limpo (apenas os dígitos numéricos)
        obterPorCpf(cpf) {
            const itens = this.obterTodos();
            // Remove pontuações e traços do CPF para comparar apenas números
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            return itens.find(item => String(item.cpf).replace(/\D/g, '') === cpfLimpo) || null;
        }

        // Insere um novo registro ou atualiza um existente
        salvar(item) {
            const itens = this.obterTodos();
            
            if (!item.id) {
                // Se não tem ID, gera um novo utilizando a data/hora atual e adiciona à lista
                item.id = Date.now().toString();
                itens.push(item);
            } else {
                // Se já tem ID, atualiza os dados do registro correspondente
                const index = itens.findIndex(i => i.id === String(item.id));
                if (index !== -1) {
                    itens[index] = { ...itens[index], ...item };
                }
            }
            
            // Grava o array atualizado de volta no localStorage em formato JSON
            localStorage.setItem(this.key, JSON.stringify(itens));
            return item;
        }

        // Remove um registro com base no CPF fornecido
        removerPorCpf(cpf) {
            let itens = this.obterTodos();
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            itens = itens.filter(item => String(item.cpf).replace(/\D/g, '') !== cpfLimpo);
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}


// Gerencia as ações das telas de cadastro e edição de clientes
class ClienteController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new StorageService('petshop_clientes');
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Configura os escutadores de eventos para o formulário e botões de busca
    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault(); // Impede a página de recarregar no envio
            event.stopPropagation();
            this.salvarCliente();
        });

        // Escuta o clique do botão de busca por CPF na tela de alteração
        const btnCarregar = document.getElementById('btn-carregar-cpf');
        if (btnCarregar) {
            btnCarregar.addEventListener('click', () => {
                const cpfInput = document.getElementById('input-busca-cpf')?.value.trim();
                if (cpfInput) {
                    this.carregarClienteParaEdicao(cpfInput);
                }
            });
        }
    }

    // Verifica se o CPF foi passado via URL (ex: alteracao.html?cpf=123)
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            this.carregarClienteParaEdicao(cpfUrl);
        }
    }

    // Busca os dados do cliente e preenche os campos do formulário para edição
    carregarClienteParaEdicao(cpf) {
        const cliente = this.storage.obterPorCpf(cpf);

        if (!cliente) {
            alert('Cliente não encontrado com o CPF informado!');
            return;
        }

        // Guarda o ID no dataset do form para indicar que é uma edição e não um novo cadastro
        this.form.dataset.clienteId = cliente.id;

        // Preenchimento dos campos do formulário
        if (document.getElementById('nome')) document.getElementById('nome').value = cliente.nome || '';
        if (document.getElementById('cpf')) document.getElementById('cpf').value = cliente.cpf || '';
        if (document.getElementById('rg')) document.getElementById('rg').value = cliente.rg || '';
        if (document.getElementById('telefone')) document.getElementById('telefone').value = cliente.telefone || '';
        if (document.getElementById('email')) document.getElementById('email').value = cliente.email || '';
        if (document.getElementById('data')) document.getElementById('data').value = cliente.dataNascimento || '';
        if (document.getElementById('cidades-input')) document.getElementById('cidades-input').value = cliente.cidade || '';
        if (document.getElementById('quantidade')) document.getElementById('quantidade').value = cliente.qtdPets !== undefined ? cliente.qtdPets : '';
        if (document.getElementById('logradouro')) document.getElementById('logradouro').value = cliente.logradouro || '';
        if (document.getElementById('message')) document.getElementById('message').value = cliente.anotacoes || '';

        // Seleciona o radio button de gênero correspondente
        if (cliente.genero) {
            const radioGenero = this.form.querySelector(`input[name="sex"][value="${cliente.genero}"]`);
            if (radioGenero) radioGenero.checked = true;
        }

        // Ajusta os checkboxes de preferência de propaganda
        const chkEmail = document.getElementById('epropaganda');
        const chkWhatsapp = document.getElementById('wpropaganda');
        if (chkEmail) chkEmail.checked = Boolean(cliente.propaganda?.email);
        if (chkWhatsapp) chkWhatsapp.checked = Boolean(cliente.propaganda?.whatsapp);
    }

    // Monta o objeto com os dados preenchidos no formulário
    obterDadosFormulario() {
        const formData = new FormData(this.form);
        
        const propagandaEmail = document.getElementById('epropaganda')?.checked || false;
        const propagandaWhatsapp = document.getElementById('wpropaganda')?.checked || false;

        return {
            id: this.form.dataset.clienteId || null,
            nome: formData.get('nome')?.trim(),
            cpf: formData.get('cpf')?.trim(),
            rg: formData.get('rg')?.trim(),
            telefone: formData.get('telefone')?.trim(),
            email: formData.get('email')?.trim(),
            dataNascimento: formData.get('data'),
            genero: formData.get('sex'),
            cidade: document.getElementById('cidades-input')?.value || '',
            propaganda: {
                email: propagandaEmail,
                whatsapp: propagandaWhatsapp
            },
            qtdPets: formData.get('quantidade'),
            logradouro: formData.get('logradouro')?.trim(),
            anotacoes: formData.get('message')?.trim(),
            criadoEm: new Date().toISOString()
        };
    }

    // Validação simples dos campos obrigatórios
    validar(cliente) {
        if (!cliente.nome) {
            alert('Por favor, informe o Nome do cliente.');
            return false;
        }
        if (!cliente.cpf) {
            alert('Por favor, informe o CPF do cliente.');
            return false;
        }
        return true;
    }

    // Processa a gravação dos dados do cliente
    salvarCliente() {
        const cliente = this.obterDadosFormulario();

        if (!this.validar(cliente)) {
            return;
        }

        try {
            this.storage.salvar(cliente);
            const mensagem = cliente.id ? 'Cliente alterado com sucesso!' : 'Cliente cadastrado com sucesso!';
            alert(mensagem);
            
            // Se for alteração, redireciona para a consulta; se for novo cadastro, limpa o formulário
            if (this.form.dataset.clienteId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            alert('Ocorreu um erro ao salvar o cliente.');
        }
    }
}


// Gerencia a listagem e filtro na página de consulta de clientes
class ClienteConsultaController {
    constructor() {
        this.storage = new StorageService('petshop_clientes');
        this.tabelaBody = document.getElementById('tabela-clientes-body');
        this.inputFiltro = document.getElementById('input-filtro');
        this.btnLimpar = document.getElementById('btn-limpar-filtro');

        if (this.tabelaBody) {
            this.iniciar();
        }
    }

    // Inicializa a tabela e define os escutadores de busca/filtro
    iniciar() {
        this.renderizarTabela();

        // Filtra a lista dinamicamente conforme a digitação no campo de busca
        if (this.inputFiltro) {
            this.inputFiltro.addEventListener('input', () => {
                const termo = this.inputFiltro.value.toLowerCase().trim();
                this.renderizarTabela(termo);
            });
        }

        // Reseta o filtro de busca
        if (this.btnLimpar) {
            this.btnLimpar.addEventListener('click', () => {
                this.inputFiltro.value = '';
                this.renderizarTabela();
            });
        }
    }

    // Constrói e exibe as linhas da tabela de acordo com o filtro digitado
    renderizarTabela(filtro = '') {
        const clientes = this.storage.obterTodos();
        
        // Filtra clientes buscando correspondência no Nome ou CPF
        const clientesFiltrados = clientes.filter(c => {
            const nomeMatch = c.nome && c.nome.toLowerCase().includes(filtro);
            const cpfMatch = c.cpf && c.cpf.includes(filtro);
            return nomeMatch || cpfMatch;
        });

        this.tabelaBody.innerHTML = '';

        // Exibe mensagem caso nenhum resultado seja encontrado
        if (clientesFiltrados.length === 0) {
            this.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum cliente encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        // Preenche as linhas da tabela com os dados filtrados
        clientesFiltrados.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${this.escaparHtml(cliente.nome || '-')}</strong></td>
                <td>${this.escaparHtml(cliente.cpf || '-')}</td>
                <td>${this.escaparHtml(cliente.telefone || '-')}</td>
                <td>${this.escaparHtml(cliente.cidade || '-')}</td>
                <td><span class="badge badge-info">${cliente.qtdPets || 0}</span></td>
                <td class="text-center">
                    <a href="alteracao.html?cpf=${encodeURIComponent(cliente.cpf)}" class="btn btn-sm btn-warning mr-1">Editar</a>
                    <a href="remocao.html?cpf=${encodeURIComponent(cliente.cpf)}" class="btn btn-sm btn-danger">Excluir</a>
                </td>
            `;
            this.tabelaBody.appendChild(tr);
        });
    }

    // Trata caracteres especiais para prevenir ataques de injecção de HTML (XSS)
    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}


// Gerencia a exclusão de registros na página de remoção
class ClienteRemocaoController {
    constructor() {
        this.storage = new StorageService('petshop_clientes');
        this.clienteAtual = null;

        this.container = document.getElementById('container-remocao-cliente');
        this.cardDados = document.getElementById('card-dados-cliente');
        this.painelVazio = document.getElementById('painel-vazio');

        if (this.container) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Associa eventos aos botões de busca e confirmação de exclusão
    iniciarEventos() {
        const btnBuscar = document.getElementById('btn-buscar-cliente');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarCliente());
        }

        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.executarExclusao());
        }
    }

    // Carrega o cliente automaticamente caso venha um parâmetro CPF na URL
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            const tipoSelect = document.getElementById('tipoBusca');
            const termoInput = document.getElementById('termoBusca');
            if (tipoSelect) tipoSelect.value = 'cpf';
            if (termoInput) termoInput.value = cpfUrl;
            this.carregarClientePorCpf(cpfUrl);
        }
    }

    // Executa a busca manual conforme o critério selecionado (CPF, ID ou Nome)
    buscarCliente() {
        const tipoBusca = document.getElementById('tipoBusca')?.value;
        const termo = document.getElementById('termoBusca')?.value.trim();

        if (!termo) {
            alert('Por favor, digite um termo para busca.');
            return;
        }

        const clientes = this.storage.obterTodos();
        let encontrado = null;

        if (tipoBusca === 'cpf') {
            encontrado = this.storage.obterPorCpf(termo);
        } else if (tipoBusca === 'id') {
            encontrado = this.storage.obterPorId(termo);
        } else if (tipoBusca === 'nome') {
            const termoLower = termo.toLowerCase();
            encontrado = clientes.find(c => c.nome && c.nome.toLowerCase().includes(termoLower));
        }

        if (encontrado) {
            this.exibirCliente(encontrado);
        } else {
            alert('Nenhum cliente foi localizado com os dados informados.');
            this.ocultarCliente();
        }
    }

    // Busca o registro diretamente pelo CPF
    carregarClientePorCpf(cpf) {
        const cliente = this.storage.obterPorCpf(cpf);
        if (cliente) {
            this.exibirCliente(cliente);
        } else {
            alert('Cliente não encontrado com o CPF informado.');
            this.ocultarCliente();
        }
    }

    // Exibe o card com os dados do cliente encontrado para confirmação
    exibirCliente(cliente) {
        this.clienteAtual = cliente;

        if (document.getElementById('info-id')) document.getElementById('info-id').textContent = cliente.id ? `#${cliente.id}` : '-';
        if (document.getElementById('info-nome')) document.getElementById('info-nome').textContent = cliente.nome || '-';
        if (document.getElementById('info-cpf')) document.getElementById('info-cpf').textContent = cliente.cpf || '-';
        if (document.getElementById('info-email')) document.getElementById('info-email').textContent = cliente.email || '-';
        if (document.getElementById('info-telefone')) document.getElementById('info-telefone').textContent = cliente.telefone || '-';
        if (document.getElementById('info-pets')) document.getElementById('info-pets').textContent = cliente.qtdPets || 0;

        if (document.getElementById('modal-nome-cliente')) {
            document.getElementById('modal-nome-cliente').textContent = cliente.nome || 'Cliente';
        }

        if (this.painelVazio) this.painelVazio.classList.add('d-none');
        if (this.cardDados) this.cardDados.classList.remove('d-none');
    }

    // Oculta os detalhes do cliente quando nenhum resultado é retornado
    ocultarCliente() {
        this.clienteAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

    // Remove o cliente selecionado do localStorage e redireciona para a consulta
    executarExclusao() {
        if (!this.clienteAtual || !this.clienteAtual.cpf) {
            alert('Nenhum cliente selecionado para remoção.');
            return;
        }

        try {
            this.storage.removerPorCpf(this.clienteAtual.cpf);

            if (typeof $ !== 'undefined') {
                $('#modalConfirmacao').modal('hide');
            }

            alert('Cliente removido com sucesso!');
            window.location.href = 'consulta.html';
        } catch (error) {
            console.error('Erro ao remover cliente:', error);
            alert('Ocorreu um erro ao tentar excluir o cliente.');
        }
    }
}


// Instancia os controladores de acordo com a página que está aberta no momento
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-cliente')) {
        new ClienteController('form-cliente');
    }
    
    if (document.getElementById('tabela-clientes-body')) {
        new ClienteConsultaController();
    }

    if (document.getElementById('container-remocao-cliente')) {
        new ClienteRemocaoController();
    }
});
