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

    // Variável para armazenar os professores
    let professores = JSON.parse(localStorage.getItem('professores')) || [];

    // Variável para gerar IDs únicos para os professores
    let professorId = 1;

    // Estrutura de dados para a grade curricular
    let gradeCurricular = JSON.parse(localStorage.getItem('gradeCurricular')) || {
        'Segunda-feira': {},
        'Terça-feira': {},
        'Quarta-feira': {},
        'Quinta-feira': {},
        'Sexta-feira': {},
    };

    // Função para carregar professores do localStorage
    function carregarProfessoresDoLocalStorage() {
        const professoresLocalStorage = localStorage.getItem('professores');
        if (professoresLocalStorage) {
            professores = JSON.parse(professoresLocalStorage);
            atualizarTabela();
            atualizarGradeCurricular();
        }
    }

    // Adicionar um evento de clique para abrir/fechar as opções
    diasSemanaContainer.addEventListener('click', () => {
        diasSemanaContainer.classList.toggle('open');
    });

    // Adicionar um evento de clique para selecionar/deselecionar opções
    diasSemanaOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
            const selectedDays = Array.from(diasSemanaOptions).filter(option => option.classList.contains('selected')).map(option => option.textContent);
            diasSemanaPlaceholder.textContent = selectedDays.length > 0 ? selectedDays.join(', ') : 'Selecione os dias';
        });
    });

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
            const acoesCell = document.createElement('td'); // Coluna para botões de Atualizar e Excluir

            nomeCell.textContent = professor.nome;
            disciplinaCell.textContent = professor.disciplina;
            salaCell.textContent = professor.sala;
            diasAulaCell.textContent = professor.diasAula.join(', ');
            inicioCell.textContent = professor.inicio;
            fimCell.textContent = professor.fim;

            const excluirButton = document.createElement('button');
            excluirButton.textContent = 'Excluir';
            excluirButton.addEventListener('click', () => {
                excluirProfessor(professor.id);
            });

            acoesCell.appendChild(excluirButton);

            row.appendChild(nomeCell);
            row.appendChild(disciplinaCell);
            row.appendChild(salaCell);
            row.appendChild(diasAulaCell);
            row.appendChild(inicioCell);
            row.appendChild(fimCell);
            row.appendChild(acoesCell); // Adicionar a coluna de ações à linha

            professorTable.appendChild(row);
        }

        // Atualiza a grade curricular
        atualizarGradeCurricular();
    }

    // Função para atualizar a grade curricular
    function atualizarGradeCurricular() {
        gradeCurricularTable.innerHTML = '';

        const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

        for (const diaSemana of diasSemana) {
            const row = document.createElement('tr');
            const diaSemanaCell = document.createElement('td');
            diaSemanaCell.textContent = diaSemana;
            row.appendChild(diaSemanaCell);

            for (const horaInicio in gradeCurricular[diaSemana]) {
                const aulas = gradeCurricular[diaSemana][horaInicio];
                const cell = document.createElement('td');
                const aulaText = aulas.map(aula => `Aula: ${aula.nome}, Disciplina: ${aula.disciplina}, Sala: ${aula.sala}, Inicio: ${aula.inicio}, Termino: ${aula.fim}`).join('<br>');
                cell.innerHTML = aulaText;
                row.appendChild(cell);
            }

            gradeCurricularTable.appendChild(row);
            localStorage.setItem('gradeCurricular', JSON.stringify(gradeCurricular));
        }
    }

    // Função para excluir um professor
    function excluirProfessor(professorId) {
        const index = professores.findIndex(professor => professor.id === professorId);
        if (index !== -1) {
            const professor = professores[index];
            professores.splice(index, 1);
            salvarProfessores();
            atualizarTabela();
            // Limpar as aulas da grade curricular quando um professor é excluído
            for (const diaAula of professor.diasAula) {
                for (const horaInicio in gradeCurricular[diaAula]) {
                    gradeCurricular[diaAula][horaInicio] = gradeCurricular[diaAula][horaInicio].filter(aula => aula.id !== professor.id);
                }
            }
            atualizarGradeCurricular(); // Atualiza a grade curricular após a exclusão
        }
    }

    professorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const nome = nomeInput.value.trim();
        const disciplina = disciplinaInput.value.trim();
        const sala = salaInput.value.trim();
        const inicio = inicioInput.value.trim();
        const fim = fimInput.value.trim();
        const diasAula = Array.from(diasSemanaOptions).filter(option => option.classList.contains('selected')).map(option => option.textContent);

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
        atualizarTabela();
        salvarProfessores();
        professorForm.reset();
        diasSemanaPlaceholder.textContent = 'Selecione os dias';
        diasSemanaOptions.forEach(option => option.classList.remove('selected')); // Limpa a seleção dos dias
    });

    function adicionarProfessor(nome, disciplina, sala, diasAula, inicio, fim) {
        const professor = {
            id: professorId++,
            nome: nome,
            disciplina: disciplina,
            sala: sala,
            diasAula: diasAula,
            inicio: inicio,
            fim: fim
        };
        professores.push(professor);
        for (const diaAula of diasAula) {
            adicionarAulaGradeCurricular(diaAula, inicio, professor);
        }
    }

    // Função para adicionar uma aula à grade curricular
    function adicionarAulaGradeCurricular(diaAula, horaInicio, professor) {
        if (!gradeCurricular[diaAula][horaInicio]) {
            gradeCurricular[diaAula][horaInicio] = [];
        }

        gradeCurricular[diaAula][horaInicio].push({
            id: professor.id,
            nome: professor.nome,
            disciplina: professor.disciplina,
            sala: professor.sala,
            inicio: professor.inicio,
            fim: professor.fim
        });
    }


    function verificarConflitoHorario(nome, sala, diasAula, inicio, fim) {
        for (const professor of professores) {
            if (professor.id !== undefined && (
                (professor.nome === nome || professor.sala === sala) &&
                professor.diasAula.some(dia => diasAula.includes(dia)) &&
                ((inicio >= professor.inicio && inicio < professor.fim) ||
                    (fim > professor.inicio && fim <= professor.fim) ||
                    (inicio <= professor.inicio && fim >= professor.fim))
            )) {
                return true;
            }
        }
        return false;
    }

    function validarHorario(horario) {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(horario);
    }

    atualizarTabela();
    atualizarGradeCurricular();
    carregarProfessoresDoLocalStorage();
});
