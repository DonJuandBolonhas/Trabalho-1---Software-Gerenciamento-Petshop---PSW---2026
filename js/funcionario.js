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

/**
 * Controller responsável pelo Formulário de Cadastro/Edição de Funcionários
 */
class FuncionarioController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new StorageService('funcionarios');
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.salvarFuncionario();
        });

        const btnCarregar = document.getElementById('btn-carregar-cpf');
        if (btnCarregar) {
            btnCarregar.addEventListener('click', () => {
                const cpfInput = document.getElementById('input-busca-cpf')?.value.trim();
                if (cpfInput) {
                    this.carregarFuncionarioParaEdicao(cpfInput);
                }
            });
        }
    }

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            this.carregarFuncionarioParaEdicao(cpfUrl);
        }
    }

    carregarFuncionarioParaEdicao(cpf) {
        const funcionario = this.storage.obterPorCpf(cpf);

        if (!funcionario) {
            alert('Funcionário não encontrado com o CPF informado!');
            return;
        }

        // Armazena o ID interno do registro no dataset para indicar edição
        this.form.dataset.funcionarioId = funcionario.id;

        // Preenchimento dos campos conforme o HTML do formulário
        if (document.getElementById('nome')) document.getElementById('nome').value = funcionario.nome || '';
        if (document.getElementById('cpf')) document.getElementById('cpf').value = funcionario.cpf || '';
        if (document.getElementById('rg')) document.getElementById('rg').value = funcionario.rg || '';
        if (document.getElementById('matricula')) document.getElementById('matricula').value = funcionario.matricula || '';
        if (document.getElementById('telefone')) document.getElementById('telefone').value = funcionario.telefone || '';
        if (document.getElementById('email')) document.getElementById('email').value = funcionario.email || '';
        if (document.getElementById('data')) document.getElementById('data').value = funcionario.dataNascimento || '';
        
        // Selects
        const selectCargo = this.form.querySelector('select[name="tipocargo"]');
        if (selectCargo) selectCargo.value = funcionario.tipoCargo || 'operacional';

        const selectQualificacao = this.form.querySelector('select[name="qualificacao"]');
        if (selectQualificacao) selectQualificacao.value = funcionario.qualificacao || 'ensinofundamentalc';

        if (document.getElementById('quantidade')) document.getElementById('quantidade').value = funcionario.cargaHoraria || '';
        if (document.getElementById('message')) document.getElementById('message').value = funcionario.descricaoCargo || '';

        // Radio do Gênero
        if (funcionario.genero) {
            const radioGenero = this.form.querySelector(`input[name="sex"][value="${funcionario.genero}"]`);
            if (radioGenero) radioGenero.checked = true;
        }
    }

    obterDadosFormulario() {
        const formData = new FormData(this.form);

        return {
            id: this.form.dataset.funcionarioId || null,
            nome: formData.get('nome')?.trim(),
            cpf: formData.get('cpf')?.trim(),
            rg: formData.get('rg')?.trim(),
            matricula: formData.get('matricula')?.trim(),
            telefone: formData.get('telefone')?.trim(),
            email: formData.get('email')?.trim(),
            dataNascimento: formData.get('data'),
            genero: formData.get('sex'),
            tipoCargo: formData.get('tipocargo'),
            qualificacao: formData.get('qualificacao'),
            cargaHoraria: formData.get('quantidade'),
            descricaoCargo: formData.get('message'),
            criadoEm: new Date().toISOString()
        };
    }

    validar(funcionario) {
        if (!funcionario.nome) {
            alert('Por favor, informe o Nome do funcionário.');
            return false;
        }
        if (!funcionario.cpf) {
            alert('Por favor, informe o CPF do funcionário.');
            return false;
        }
        return true;
    }

    salvarFuncionario() {
        const funcionario = this.obterDadosFormulario();

        if (!this.validar(funcionario)) {
            return;
        }

        try {
            this.storage.salvar(funcionario);
            const mensagem = funcionario.id ? 'Funcionário alterado com sucesso!' : 'Funcionário cadastrado com sucesso!';
            alert(mensagem);
            
            if (this.form.dataset.funcionarioId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar funcionário:', error);
            alert('Ocorreu um erro ao salvar o funcionário.');
        }
    }
}

/**
 * Controladora para Tabela de Consulta de Funcionários
 */
class FuncionarioConsultaController {
    constructor() {
        this.storage = new StorageService('funcionarios');
        this.tabelaBody = document.getElementById('tabela-funcionarios-body');
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
        const funcionarios = this.storage.obterTodos();
        
        const funcionariosFiltrados = funcionarios.filter(f => {
            const nomeMatch = f.nome && f.nome.toLowerCase().includes(filtro);
            const cpfMatch = f.cpf && f.cpf.includes(filtro);
            const matriculaMatch = f.matricula && f.matricula.toLowerCase().includes(filtro);
            return nomeMatch || cpfMatch || matriculaMatch;
        });

        this.tabelaBody.innerHTML = '';

        if (funcionariosFiltrados.length === 0) {
            this.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum funcionário encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        funcionariosFiltrados.forEach(funcionario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${this.escaparHtml(funcionario.nome || '-')}</strong></td>
                <td>${this.escaparHtml(funcionario.cpf || '-')}</td>
                <td><span class="badge badge-secondary">${this.escaparHtml(funcionario.tipoCargo || '-')}</span></td>
                <td>${this.escaparHtml(funcionario.telefone || '-')}</td>
                <td>${this.escaparHtml(funcionario.email || '-')}</td>
                <td class="text-center">
                    <a href="alteracao.html?cpf=${encodeURIComponent(funcionario.cpf)}" class="btn btn-sm btn-warning mr-1">Editar</a>
                    <a href="remocao.html?cpf=${encodeURIComponent(funcionario.cpf)}" class="btn btn-sm btn-danger">Excluir</a>
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
 * Controladora para Remoção de Funcionário
 */
class FuncionarioRemocaoController {
    constructor() {
        this.storage = new StorageService('funcionarios');
        this.funcionarioAtual = null;

        this.container = document.getElementById('container-remocao-funcionario');
        this.cardDados = document.getElementById('card-dados-funcionario');
        this.painelVazio = document.getElementById('painel-vazio');

        if (this.container) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        const btnBuscar = document.getElementById('btn-buscar-funcionario');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarFuncionario());
        }

        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.executarExclusao());
        }
    }

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cpfUrl = urlParams.get('cpf');
        if (cpfUrl) {
            document.getElementById('tipoBusca').value = 'cpf';
            document.getElementById('termoBusca').value = cpfUrl;
            this.carregarFuncionarioPorCpf(cpfUrl);
        }
    }

    buscarFuncionario() {
        const tipoBusca = document.getElementById('tipoBusca').value;
        const termo = document.getElementById('termoBusca').value.trim();

        if (!termo) {
            alert('Por favor, digite um termo para busca.');
            return;
        }

        const funcionarios = this.storage.obterTodos();
        let encontrado = null;

        if (tipoBusca === 'cpf') {
            encontrado = this.storage.obterPorCpf(termo);
        } else if (tipoBusca === 'id') {
            encontrado = this.storage.obterPorId(termo);
        } else if (tipoBusca === 'nome') {
            const termoLower = termo.toLowerCase();
            encontrado = funcionarios.find(f => f.nome && f.nome.toLowerCase().includes(termoLower));
        }

        if (encontrado) {
            this.exibirFuncionario(encontrado);
        } else {
            alert('Nenhum funcionário foi localizado com os dados informados.');
            this.ocultarFuncionario();
        }
    }

    carregarFuncionarioPorCpf(cpf) {
        const funcionario = this.storage.obterPorCpf(cpf);
        if (funcionario) {
            this.exibirFuncionario(funcionario);
        } else {
            alert('Funcionário não encontrado com o CPF informado.');
            this.ocultarFuncionario();
        }
    }

    exibirFuncionario(funcionario) {
        this.funcionarioAtual = funcionario;

        document.getElementById('info-id').textContent = funcionario.id ? `#${funcionario.id}` : '-';
        document.getElementById('info-nome').textContent = funcionario.nome || '-';
        document.getElementById('info-cpf').textContent = funcionario.cpf || '-';
        document.getElementById('info-cargo').textContent = funcionario.tipoCargo || '-';
        document.getElementById('info-email').textContent = funcionario.email || '-';
        document.getElementById('info-telefone').textContent = funcionario.telefone || '-';

        document.getElementById('modal-nome-funcionario').textContent = funcionario.nome || 'Funcionário';

        if (this.painelVazio) this.painelVazio.classList.add('d-none');
        if (this.cardDados) this.cardDados.classList.remove('d-none');
    }

    ocultarFuncionario() {
        this.funcionarioAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

    executarExclusao() {
        if (!this.funcionarioAtual || !this.funcionarioAtual.cpf) {
            alert('Nenhum funcionário selecionado para remoção.');
            return;
        }

        try {
            this.storage.removerPorCpf(this.funcionarioAtual.cpf);

            if (typeof $ !== 'undefined') {
                $('#modalConfirmacao').modal('hide');
            }

            alert('Funcionário removido com sucesso!');
            window.location.href = 'consulta.html';
        } catch (error) {
            console.error('Erro ao remover funcionário:', error);
            alert('Ocorreu um erro ao tentar excluir o funcionário.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-funcionario')) {
        new FuncionarioController('form-funcionario');
    }

    if (document.getElementById('tabela-funcionarios-body')) {
        new FuncionarioConsultaController();
    }

    if (document.getElementById('container-remocao-funcionario')) {
        new FuncionarioRemocaoController();
    }
});