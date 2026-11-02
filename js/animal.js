// Verifica se o StorageService já foi definido no escopo global para não dar erro de redeclaração
if (typeof window.StorageService === 'undefined') {

    // Classe responsável por intermediar todas as operações no localStorage para os animais
    window.StorageService = class StorageService {
        constructor(key) {
            // Guarda a chave utilizada no banco do navegador (ex: 'petshop_animais')
            this.key = key;
        }

        // Lê e converte os registros do localStorage em um array de objetos
        obterTodos() {
            const dados = localStorage.getItem(this.key);
            return dados ? JSON.parse(dados) : [];
        }

        // Procura um animal específico com base no seu ID único
        obterPorId(id) {
            const itens = this.obterTodos();
            return itens.find(item => item.id === String(id)) || null;
        }

        // Salva um novo registro ou atualiza as informações de um animal existente
        salvar(item) {
            const itens = this.obterTodos();
            
            if (!item.id) {
                // Se não possui ID, gera um identificador único com base no timestamp
                item.id = Date.now().toString();
                itens.push(item);
            } else {
                // Se o ID já existe, atualiza os dados do registro mantendo os campos anteriores
                const index = itens.findIndex(i => i.id === String(item.id));
                if (index !== -1) {
                    itens[index] = { ...itens[index], ...item };
                }
            }
            
            // Grava a lista atualizada no localStorage no formato JSON
            localStorage.setItem(this.key, JSON.stringify(itens));
            return item;
        }

        // Filtra a lista removendo o item que possui o ID informado
        removerPorId(id) {
            let itens = this.obterTodos();
            itens = itens.filter(item => String(item.id) !== String(id));
            localStorage.setItem(this.key, JSON.stringify(itens));
        }
    };
}

/**
 * Controller responsável pelo Formulário de Cadastro e Alteração de Animais
 */
class AnimalController {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.storage = new StorageService('petshop_animais');
        
        // Se o formulário de cadastro/edição existir na página atual, dispara as verificações
        if (this.form) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Configura os escutadores para captura de envio do formulário e busca manual por ID
    iniciarEventos() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita a recarga padrão da página ao enviar
            event.stopPropagation();
            this.salvarAnimal();
        });

        // Evento do botão que permite buscar um animal digitando o ID na página de alteração
        const btnCarregar = document.getElementById('btn-carregar-id');
        if (btnCarregar) {
            btnCarregar.addEventListener('click', () => {
                const idInput = document.getElementById('input-busca-id')?.value.trim();
                if (idInput) {
                    this.carregarAnimalParaEdicao(idInput);
                }
            });
        }
    }

    // Verifica se a URL contém um parâmetro de ID (ex: alteracao.html?id=123) vindo de outra tela
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idUrl = urlParams.get('id');
        if (idUrl) {
            this.carregarAnimalParaEdicao(idUrl);
        }
    }

    // Busca os dados do animal pelo ID e preenche os campos do formulário para edição
    carregarAnimalParaEdicao(id) {
        const animal = this.storage.obterPorId(id);

        if (!animal) {
            alert('Animal não encontrado com o ID informado!');
            return;
        }

        // Armazena o ID no dataset do form para o script identificar que se trata de uma edição
        this.form.dataset.animalId = animal.id;

        // Preenche os campos de texto do formulário com as informações do cadastro
        if (document.getElementById('nome')) document.getElementById('nome').value = animal.nome || '';
        if (document.getElementById('tutor')) document.getElementById('tutor').value = animal.tutor || '';
        if (document.getElementById('cpftutor')) document.getElementById('cpftutor').value = animal.cpfTutor || '';
        if (document.getElementById('rganimal')) document.getElementById('rganimal').value = animal.rgAnimal || '';
        if (document.getElementById('peso')) document.getElementById('peso').value = animal.peso || '';
        if (document.getElementById('altura')) document.getElementById('altura').value = animal.altura || '';
        if (document.getElementById('especie')) document.getElementById('especie').value = animal.especie || '';
        if (document.getElementById('data')) document.getElementById('data').value = animal.dataNascimento || '';
        if (document.getElementById('message')) document.getElementById('message').value = animal.anotacoes || '';

        // Seleciona a opção do radio button referente ao gênero (macho/fêmea)
        if (animal.genero) {
            const radioGenero = this.form.querySelector(`input[name="sex"][value="${animal.genero}"]`);
            if (radioGenero) radioGenero.checked = true;
        }

        // Marca a opção de microchip caso o animal possua
        const chkMicro = document.getElementById('micro');
        if (chkMicro) chkMicro.checked = Boolean(animal.microchip);
    }

    // Captura as informações digitadas nos campos e estrutura o objeto do animal
    obterDadosFormulario() {
        const formData = new FormData(this.form);
        const possuiMicrochip = document.getElementById('micro')?.checked || false;

        return {
            id: this.form.dataset.animalId || null,
            nome: formData.get('nome')?.trim(),
            tutor: formData.get('tutor')?.trim(),
            cpfTutor: formData.get('cpftutor')?.trim(),
            rgAnimal: formData.get('rganimal')?.trim(),
            peso: formData.get('peso')?.trim(),
            altura: formData.get('altura'),
            especie: formData.get('especie')?.trim(),
            genero: formData.get('sex'),
            dataNascimento: formData.get('data'),
            microchip: possuiMicrochip,
            anotacoes: formData.get('message')?.trim(),
            criadoEm: new Date().toISOString()
        };
    }

    // Valida se os dados mínimos e obrigatórios foram preenchidos
    validar(animal) {
        if (!animal.nome) {
            alert('Por favor, informe o Nome do animal.');
            return false;
        }
        if (!animal.tutor) {
            alert('Por favor, informe o Nome do Tutor.');
            return false;
        }
        return true;
    }

    // Salva o animal e redireciona para a consulta ou limpa o formulário
    salvarAnimal() {
        const animal = this.obterDadosFormulario();

        if (!this.validar(animal)) {
            return;
        }

        try {
            this.storage.salvar(animal);
            const mensagem = animal.id ? 'Animal alterado com sucesso!' : 'Animal cadastrado com sucesso!';
            alert(mensagem);
            
            // Redireciona para a listagem se estiver editando ou limpa os campos se for novo registro
            if (this.form.dataset.animalId) {
                window.location.href = 'consulta.html';
            } else {
                this.form.reset();
            }
        } catch (error) {
            console.error('Erro ao salvar animal:', error);
            alert('Ocorreu um erro ao salvar o animal.');
        }
    }
}

/**
 * Controller responsável pela Consulta/Listagem de Animais
 */
class AnimalConsultaController {
    constructor() {
        this.storage = new StorageService('petshop_animais');
        this.tabelaBody = document.getElementById('tabela-animais-body');
        this.inputFiltro = document.getElementById('input-filtro');
        this.btnLimpar = document.getElementById('btn-limpar-filtro');

        if (this.tabelaBody) {
            this.iniciar();
        }
    }

    // Inicia a renderização da tabela e adiciona a busca dinâmica conforme a digitação
    iniciar() {
        this.renderizarTabela();

        // Filtra os animais em tempo real conforme a digitação no input
        if (this.inputFiltro) {
            this.inputFiltro.addEventListener('input', () => {
                const termo = this.inputFiltro.value.toLowerCase().trim();
                this.renderizarTabela(termo);
            });
        }

        // Limpa o campo de filtro e restaura a lista completa
        if (this.btnLimpar) {
            this.btnLimpar.addEventListener('click', () => {
                this.inputFiltro.value = '';
                this.renderizarTabela();
            });
        }
    }

    // Monta o HTML da tabela aplicando o filtro por nome do animal, tutor ou espécie
    renderizarTabela(filtro = '') {
        const animais = this.storage.obterTodos();
        
        const animaisFiltrados = animais.filter(a => {
            const nomeMatch = a.nome && a.nome.toLowerCase().includes(filtro);
            const tutorMatch = a.tutor && a.tutor.toLowerCase().includes(filtro);
            const especieMatch = a.especie && a.especie.toLowerCase().includes(filtro);
            return nomeMatch || tutorMatch || especieMatch;
        });

        this.tabelaBody.innerHTML = '';

        // Se a busca não encontrar correspondências na base
        if (animaisFiltrados.length === 0) {
            this.tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum animal encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        // Insere cada linha na tabela de consulta com os botões de editar e excluir
        animaisFiltrados.forEach(animal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${this.escaparHtml(animal.nome || '-')}</strong></td>
                <td>${this.escaparHtml(animal.especie || '-')}</td>
                <td>${this.escaparHtml(animal.tutor || '-')}</td>
                <td>${this.escaparHtml(animal.cpfTutor || '-')}</td>
                <td><span class="badge badge-info">${animal.microchip ? 'Sim' : 'Não'}</span></td>
                <td class="text-center">
                    <a href="alteracao.html?id=${encodeURIComponent(animal.id)}" class="btn btn-sm btn-warning mr-1">Editar</a>
                    <a href="remocao.html?id=${encodeURIComponent(animal.id)}" class="btn btn-sm btn-danger">Excluir</a>
                </td>
            `;
            this.tabelaBody.appendChild(tr);
        });
    }

    // Trata os textos para impedir ataques do tipo XSS ao renderizar na tela
    escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

/**
 * Controller responsável pela Remoção de Animais
 */
class AnimalRemocaoController {
    constructor() {
        this.storage = new StorageService('petshop_animais');
        this.animalAtual = null;

        this.container = document.getElementById('container-remocao-animal');
        this.cardDados = document.getElementById('card-dados-animal');
        this.painelVazio = document.getElementById('painel-vazio');

        if (this.container) {
            this.iniciarEventos();
            this.checarParametroUrl();
        }
    }

    // Configura os escutadores de clique para pesquisar e confirmar a remoção
    iniciarEventos() {
        const btnBuscar = document.getElementById('btn-buscar-animal');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.buscarAnimal());
        }

        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.executarExclusao());
        }
    }

    // Carrega o registro direto se um ID for informado no parâmetro da URL
    checarParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idUrl = urlParams.get('id');
        if (idUrl) {
            const termoInput = document.getElementById('termoBusca');
            if (termoInput) termoInput.value = idUrl;
            this.carregarAnimalPorId(idUrl);
        }
    }

    // Busca o animal por ID ou pelo nome fornecido no campo de pesquisa
    buscarAnimal() {
        const termo = document.getElementById('termoBusca')?.value.trim();

        if (!termo) {
            alert('Por favor, digite o ID ou Nome do animal para buscar.');
            return;
        }

        const animais = this.storage.obterTodos();
        let encontrado = animais.find(a => String(a.id) === termo) || 
                         animais.find(a => a.nome && a.nome.toLowerCase().includes(termo.toLowerCase()));

        if (encontrado) {
            this.exibirAnimal(encontrado);
        } else {
            alert('Nenhum animal foi localizado com os dados informados.');
            this.ocultarAnimal();
        }
    }

    // Carrega os detalhes do animal utilizando diretamente o ID
    carregarAnimalPorId(id) {
        const animal = this.storage.obterPorId(id);
        if (animal) {
            this.exibirAnimal(animal);
        } else {
            alert('Animal não encontrado com o ID informado.');
            this.ocultarAnimal();
        }
    }

    // Exibe os dados do animal encontrado no card de confirmação de exclusão
    exibirAnimal(animal) {
        this.animalAtual = animal;

        if (document.getElementById('info-id')) document.getElementById('info-id').textContent = animal.id ? `#${animal.id}` : '-';
        if (document.getElementById('info-nome')) document.getElementById('info-nome').textContent = animal.nome || '-';
        if (document.getElementById('info-especie')) document.getElementById('info-especie').textContent = animal.especie || '-';
        if (document.getElementById('info-tutor')) document.getElementById('info-tutor').textContent = animal.tutor || '-';
        if (document.getElementById('info-cpftutor')) document.getElementById('info-cpftutor').textContent = animal.cpfTutor || '-';

        if (document.getElementById('modal-nome-animal')) {
            document.getElementById('modal-nome-animal').textContent = animal.nome || 'Animal';
        }

        if (this.painelVazio) this.painelVazio.classList.add('d-none');
        if (this.cardDados) this.cardDados.classList.remove('d-none');
    }

    // Oculta as informações da tela caso o registro não seja encontrado
    ocultarAnimal() {
        this.animalAtual = null;
        if (this.cardDados) this.cardDados.classList.add('d-none');
        if (this.painelVazio) this.painelVazio.classList.remove('d-none');
    }

    // Apaga o registro do localStorage e redireciona de volta para a consulta
    executarExclusao() {
        if (!this.animalAtual || !this.animalAtual.id) {
            alert('Nenhum animal selecionado para remoção.');
            return;
        }

        try {
            this.storage.removerPorId(this.animalAtual.id);

            // Se houver modal Bootstrap ativo, fecha antes do aviso
            if (typeof $ !== 'undefined') {
                $('#modalConfirmacao').modal('hide');
            }

            alert('Animal removido com sucesso!');
            window.location.href = 'consulta.html';
        } catch (error) {
            console.error('Erro ao remover animal:', error);
            alert('Ocorreu um erro ao tentar excluir o animal.');
        }
    }
}

// Inicializa as instâncias dos controllers conforme os elementos presentes na tela atual
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-animal')) {
        new AnimalController('form-animal');
    }
    
    if (document.getElementById('tabela-animais-body')) {
        new AnimalConsultaController();
    }

    if (document.getElementById('container-remocao-animal')) {
        new AnimalRemocaoController();
    }
});
