// Garante o reuso da classe genérica StorageService
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

        removerPorId(id) {
            let itens = this.obterTodos();
            itens = itens.filter(item => String(item.id) !== String(id));
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}

class AtendimentoStorageService extends StorageService {
    constructor() {
        super('petshop_atendimentos');
    }

    obterPorNumero(numero) {
        const itens = this.obterTodos();
        return itens.find(item => String(item.numeroAtendimento) === String(numero)) || null;
    }

    removerPorNumero(numero) {
        let itens = this.obterTodos();
        itens = itens.filter(item => String(item.numeroAtendimento) !== String(numero));
        localStorage.setItem(this.key, JSON.stringify(itens));
    }
}

class AtendimentoController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new AtendimentoStorageService();
        
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.salvarAtendimento();
        });

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

    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const numeroUrl = urlParams.get('numero');
        if (numeroUrl) {
            this.carregarAtendimentoParaEdicao(numeroUrl);
        }
    }

    carregarAtendimentoParaEdicao(numero) {
        const atendimento = this.storage.obterPorNumero(numero);

        if (!atendimento) {
            alert('Atendimento não encontrado com o número informado!');
            return;
        }

        this.form.dataset.atendimentoId = atendimento.id;

        if (document.getElementById('atendimento')) document.getElementById('atendimento').value = atendimento.numeroAtendimento || '';
        if (document.getElementById('nomea')) document.getElementById('nomea').value = atendimento.nomeAnimal || '';
        if (document.getElementById('nomet')) document.getElementById('nomet').value = atendimento.nomeTutor || '';
        if (document.getElementById('nomef')) document.getElementById('nomef').value = atendimento.nomeFuncionario || '';
        if (document.getElementById('data')) document.getElementById('data').value = atendimento.dataAtendimento || '';
        if (document.getElementById('message')) document.getElementById('message').value = atendimento.anotacoes || '';
    }

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

    salvarAtendimento() {
        const atendimento = this.obterDadosFormulario();

        if (!this.validar(atendimento)) {
            return;
        }

        try {
            this.storage.salvar(atendimento);
            const mensagem = atendimento.id ? 'Atendimento alterado com sucesso!' : 'Atendimento cadastrado com sucesso!';
            alert(mensagem);
            
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

    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

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

    carregarAtendimentoPorNumero(numero) {
        const atendimento = this.storage.obterPorNumero(numero);
        if (atendimento) {
            this.exibirAtendimento(atendimento);
        } else {
            alert('Atendimento não encontrado com o número informado.');
            this.ocultarAtendimento();
        }
    }

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

    ocultarAtendimento() {
        this.atendimentoAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

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