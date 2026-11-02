// Garante que o StorageService só será declarado se ainda não existir
if (typeof window.StorageService === 'undefined') {
    window.StorageService = class StorageService {
        constructor(key) {
            this.key = key;
        }

        obterTodos() {
            const dados = localStorage.getItem(this.key);
            return dados ? JSON.parse(dados) : [];
        }

        obterPorId(id) {
            const itens = this.obterTodos();
            return itens.find(item => item.id === String(id)) || null;
        }

        obterPorCpf(cpf) {
            const itens = this.obterTodos();
            // Normaliza apenas números para garantir o confronto correto
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            return itens.find(item => String(item.cpf).replace(/\D/g, '') === cpfLimpo) || null;
        }

        salvar(item) {
            const itens = this.obterTodos();
            
            if (!item.id) {
                item.id = Date.now().toString();
                itens.push(item);
            } else {
                const index = itens.findIndex(i => i.id === String(item.id));
                if (index !== -1) {
                    itens[index] = { ...itens[index], ...item };
                }
            }
            
            localStorage.setItem(this.key, JSON.stringify(itens));
            return item;
        }

        removerPorCpf(cpf) {
            let itens = this.obterTodos();
            const cpfLimpo = String(cpf).replace(/\D/g, '');
            itens = itens.filter(item => String(item.cpf).replace(/\D/g, '') !== cpfLimpo);
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}


class ClienteController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new StorageService('petshop_clientes');
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.salvarCliente();
        });

        // Botão manual de carregar por CPF (na página de alteração)
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

    /**
     * Código para tentar pegar o parametro da URL
     */
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            this.carregarClienteParaEdicao(cpfUrl);
        }
    }

    /**
     * Busca o cliente por CPF e preenche o formulário.
     */
    carregarClienteParaEdicao(cpf) {
        const cliente = this.storage.obterPorCpf(cpf);

        if (!cliente) {
            alert('Cliente não encontrado com o CPF informado!');
            return;
        }

        // Armazena o ID interno do registro no dataset para saber que é edição
        this.form.dataset.clienteId = cliente.id;

        // Preenchimento dos campos simples
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

        // Preenchimento do Gênero
        if (cliente.genero) {
            const radioGenero = this.form.querySelector(`input[name="sex"][value="${cliente.genero}"]`);
            if (radioGenero) radioGenero.checked = true;
        }

        // Preenchimento de Checkboxes
        const chkEmail = document.getElementById('epropaganda');
        const chkWhatsapp = document.getElementById('wpropaganda');
        if (chkEmail) chkEmail.checked = Boolean(cliente.propaganda?.email);
        if (chkWhatsapp) chkWhatsapp.checked = Boolean(cliente.propaganda?.whatsapp);
    }

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

    salvarCliente() {
        const cliente = this.obterDadosFormulario();

        if (!this.validar(cliente)) {
            return;
        }

        try {
            this.storage.salvar(cliente);
            const mensagem = cliente.id ? 'Cliente alterado com sucesso!' : 'Cliente cadastrado com sucesso!';
            alert(mensagem);
            
            // Redireciona para a tela de consulta após salvar a edição
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

/**
 * Controladora para Tabela de Consulta de Clientes
 */
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

    renderizarTabela(filtro = '') {
        const clientes = this.storage.obterTodos();
        
        const clientesFiltrados = clientes.filter(c => {
            const nomeMatch = c.nome && c.nome.toLowerCase().includes(filtro);
            const cpfMatch = c.cpf && c.cpf.includes(filtro);
            return nomeMatch || cpfMatch;
        });

        this.tabelaBody.innerHTML = '';

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

    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

/**
 * Controladora para Remoção de Cliente
 */
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

    /**
     * Verifica se existe parametro ?cpf=... na URL (ex: redirecionado da Consulta)
     */
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

    carregarClientePorCpf(cpf) {
        const cliente = this.storage.obterPorCpf(cpf);
        if (cliente) {
            this.exibirCliente(cliente);
        } else {
            alert('Cliente não encontrado com o CPF informado.');
            this.ocultarCliente();
        }
    }

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

    ocultarCliente() {
        this.clienteAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

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