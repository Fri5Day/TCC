window.addEventListener('DOMContentLoaded', (event) => {
    const professorForm = document.getElementById('professor-form');
    const nomeInput = document.getElementById('nome');
    const disciplinaInput = document.getElementById('disciplina');
    const salaInput = document.getElementById('sala');
    const diasSemanaContainer = document.getElementById('diasSemanaContainer');
    const diasSemanaPlaceholder = document.querySelector('.custom-select .placeholder');
    const diasSemanaOptions = document.querySelectorAll('.custom-select .option');
    const inicioInput = document.getElementById('inicio');
    const fimInput = document.getElementById('fim');
    const errorMessage = document.getElementById('error-message');
    const professorTable = document.getElementById('professor-table-body');
    const gradeCurricularTable = document.getElementById('grade-curricular');

    // Variável para armazenar os dias selecionados
    const diasAula = [];

    // Adicionar um evento de clique para abrir/fechar as opções
    diasSemanaContainer.addEventListener('click', () => {
        diasSemanaContainer.classList.toggle('open');
    });

    // Adicionar um evento de clique para selecionar/deselecionar opções
    diasSemanaOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (diasAula.includes(option.textContent)) {
                const index = diasAula.indexOf(option.textContent);
                diasAula.splice(index, 1);
            } else {
                diasAula.push(option.textContent);
            }
            diasSemanaPlaceholder.textContent = diasAula.length > 0 ? diasAula.join(', ') : 'Selecione os dias';
        });
    });

    // Carregar professores do armazenamento local, se disponível
    let professores = JSON.parse(localStorage.getItem('professores')) || [];

    // Estrutura de dados para a grade curricular
    let gradeCurricular = {
        'Segunda-feira': {},
        'Terça-feira': {},
        'Quarta-feira': {},
        'Quinta-feira': {},
        'Sexta-feira': {},
    };

    // Função para salvar professores no armazenamento local
    function salvarProfessores() {
        localStorage.setItem('professores', JSON.stringify(professores));
    }

    // Atualiza a tabela com os dados dos professores
    function atualizarTabela() {
        professorTable.innerHTML = '';
        for (const professor of professores) {
            const row = document.createElement('tr');
            const nomeCell = document.createElement('td');
            const disciplinaCell = document.createElement('td');
            const salaCell = document.createElement('td');
            const diasAulaCell = document.createElement('td');
            const inicioCell = document.createElement('td');
            const fimCell = document.createElement('td');
            const excluirCell = document.createElement('td'); // Adicionando uma coluna de botões

            nomeCell.textContent = professor.nome;
            disciplinaCell.textContent = professor.disciplina;
            salaCell.textContent = professor.sala;
            diasAulaCell.textContent = professor.diasAula.join(', ');
            inicioCell.textContent = professor.inicio;
            fimCell.textContent = professor.fim;

            // Adicionar um botão "Excluir" para cada professor na tabela
            const excluirButton = document.createElement('button');
            excluirButton.textContent = 'Excluir';
            excluirButton.classList.add('btn', 'btn-danger', 'btn-sm');
            excluirButton.addEventListener('click', () => {
                excluirProfessor(professor.nome); // Chame a função para excluir o professor
            });

            excluirCell.appendChild(excluirButton);

            row.appendChild(nomeCell);
            row.appendChild(disciplinaCell);
            row.appendChild(salaCell);
            row.appendChild(diasAulaCell);
            row.appendChild(inicioCell);
            row.appendChild(fimCell);
            row.appendChild(excluirCell);

            professorTable.appendChild(row);

            // Adiciona as aulas à grade curricular
            for (const diaAula of professor.diasAula) {
                if (!gradeCurricular[diaAula][professor.inicio]) {
                    gradeCurricular[diaAula][professor.inicio] = {
                        nome: professor.nome,
                        disciplina: professor.disciplina,
                        sala: professor.sala,
                        inicio: professor.inicio,
                        fim: professor.fim,
                    };
                }
            }
        }

        // Atualiza a grade curricular
        atualizarGradeCurricular();
    }

    // Função para atualizar a grade curricular
    function atualizarGradeCurricular() {
        gradeCurricularTable.innerHTML = '';

        const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

        for (const diaSemana of diasSemana) {
            console.log("aaaaaaaa")
            const row = document.createElement('tr');
            const diaSemanaCell = document.createElement('td');
            diaSemanaCell.textContent = diaSemana;
            row.appendChild(diaSemanaCell);

            for (const hora in gradeCurricular[diaSemana]) {
                const aula = gradeCurricular[diaSemana][hora];
                const cell = document.createElement('td');
                cell.textContent = `Aula: ${aula.nome}, Disciplina: ${aula.disciplina}, Sala: ${aula.sala}, Inicio: ${aula.inicio}, Termino: ${aula.fim}`;
                row.appendChild(cell);
            }

            gradeCurricularTable.appendChild(row);
        }
    }

    // Função para excluir um professor da lista
    function excluirProfessor(nome) {
        const index = professores.findIndex(p => p.nome === nome);
        if (index !== -1) {
            // Remova o professor da lista
            professores.splice(index, 1);
            salvarProfessores();
            // Remova as aulas do professor da grade curricular
            for (const dia in gradeCurricular) {
                if (gradeCurricular[dia][nome]) {
                    delete gradeCurricular[dia][nome];
                }
            }
            // Atualize a tabela e a grade curricular

            atualizarTabela();
            atualizarGradeCurricular();
        }

    }

    professorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const nome = nomeInput.value.trim();
        const disciplina = disciplinaInput.value.trim();
        const sala = salaInput.value.trim();
        const inicio = inicioInput.value.trim();
        const fim = fimInput.value.trim();

        if (nome === '' || disciplina === '' || sala === '' || diasAula.length === 0 || inicio === '' || fim === '') {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        if (!validarHorario(inicio) || !validarHorario(fim)) {
            errorMessage.textContent = 'Formato de horário inválido. Utilize o formato HH:MM.';
            return;
        }

        if (fim <= inicio) {
            errorMessage.textContent = 'O horário de fim deve ser maior que o horário de início.';
            return;
        }

        if (verificarConflitoHorario(nome, sala, diasAula, inicio, fim)) {
            errorMessage.textContent = 'O professor já possui uma aula agendada no mesmo horário ou sala.';
            return;
        }

        errorMessage.textContent = '';
        adicionarProfessor(nome, disciplina, sala, diasAula, inicio, fim);
        atualizarTabela(); // Atualizar a tabela após adicionar um novo professor
        salvarProfessores(); // Salvar professores no armazenamento local
        professorForm.reset();
    });

    function adicionarProfessor(nome, disciplina, sala, diasAula, inicio, fim) {
        const professor = {
            nome: nome,
            disciplina: disciplina,
            sala: sala,
            diasAula: diasAula,
            inicio: inicio,
            fim: fim
        };
        professores.push(professor);
    }

    function verificarConflitoHorario(nome, sala, diasAula, inicio, fim) {
        for (const professor of professores) {
            if ((professor.nome === nome || professor.sala === sala) &&
                professor.diasAula.some(dia => diasAula.includes(dia)) &&
                ((inicio >= professor.inicio && inicio < professor.fim) ||
                    (fim > professor.inicio && fim <= professor.fim) ||
                    (inicio <= professor.inicio && fim >= professor.fim))) {
                return true;
            }
        }
        return false;
    }

    function validarHorario(horario) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(horario);
    }

    // Exibir os professores iniciais
    atualizarTabela();

    professorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        // Resto do seu código...

        // Após adicionar o professor com sucesso, redefina o formulário
        professorForm.reset();

        // Além de redefinir o formulário, redefina o campo de seleção de dias da semana
        diasSemanaPlaceholder.textContent = 'Selecione os dias';
        diasAula.length = 0; // Limpa o array de diasAula
    });

});
