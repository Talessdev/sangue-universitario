document.addEventListener('DOMContentLoaded', () => {
  initTriagemWizard();
});

function initTriagemWizard() {
  const form = document.getElementById('triagemForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.triagem-step'));
  const progressItems = Array.from(document.querySelectorAll('#progressList li'));
  const progressFill = document.getElementById('progressFill');
  const totalSteps = steps.length;
  let current = 1;

  // scroll=false no carregamento inicial, para a página não pular até o formulário
  const goToStep = (stepNumber, scroll = true) => {
    steps.forEach(step => {
      step.classList.toggle('active', Number(step.dataset.step) === stepNumber);
    });

    progressItems.forEach(item => {
      const n = Number(item.dataset.step);
      item.classList.remove('current', 'done');
      if (n < stepNumber) item.classList.add('done');
      else if (n === stepNumber) item.classList.add('current');
    });

    progressFill.style.width = `${(stepNumber / totalSteps) * 100}%`;
    current = stepNumber;
    if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateActiveStep = () => {
    const activeStep = form.querySelector('.triagem-step.active');
    let valid = true;
    activeStep.querySelectorAll('[required]').forEach(field => {
      const ok = Boolean(field.value);
      field.style.borderColor = ok ? 'transparent' : 'var(--color-red)';
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok) valid = false;
    });
    const firstInvalid = activeStep.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return valid;
  };

  form.addEventListener('change', (e) => {
    if (e.target.matches('select') && e.target.value) {
      e.target.style.borderColor = 'transparent';
      e.target.setAttribute('aria-invalid', 'false');
    }
  });

  form.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateActiveStep()) goToStep(current + 1);
    });
  });

  form.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => goToStep(current - 1));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (current !== 3) return;
    if (!validateActiveStep()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    renderResult(data);
    goToStep(4);
  });

  function restart() {
    form.reset();
    form.querySelectorAll('select').forEach(sel => {
      sel.style.borderColor = '';
      sel.removeAttribute('aria-invalid');
    });
    goToStep(1);
  }

  function renderResult(data) {
    const resultBox = document.getElementById('resultBox');
    const blockers = [];
    const warnings = [];

    // Idade e peso
    if (data.idade === 'menor16') blockers.push('A idade mínima para doar é 16 anos.');
    if (data.idade === '16-17') warnings.push('Menores de 18 anos precisam de autorização dos responsáveis e de documento oficial com foto.');
    if (data.idade === 'maior69') blockers.push('A idade máxima para doar é 69 anos.');
    if (data.peso === 'menor50') blockers.push('O peso mínimo exigido para doação é 50 kg.');

    // Intervalo desde a última doação
    if (data['ultima-doacao'] === 'menos2m' || data['ultima-doacao'] === 'menos3m') {
      blockers.push('O intervalo mínimo entre doações é de 2 meses para homens e 3 meses para mulheres. Aguarde para doar novamente.');
    }

    // Saúde geral
    if (data['saude-hoje'] === 'nao') blockers.push('É necessário estar sem sintomas de gripe, resfriado ou febre no dia da doação.');
    if (data['condicao-cronica'] === 'nao-controlada') blockers.push('Condições crônicas não controladas impedem a doação até estabilização clínica.');
    if (data['condicao-cronica'] === 'controlada') warnings.push('Informe sua condição crônica à equipe médica na triagem presencial.');
    if (data.gravidez === 'gravida') blockers.push('Gestantes não podem doar sangue durante a gravidez.');
    if (data.gravidez === 'amamentando') blockers.push('Lactantes só podem doar após 12 meses do parto.');

    // Hábitos recentes
    if (data.tatuagem === 'sim') blockers.push('É necessário aguardar 12 meses após tatuagem, piercing ou procedimento estético invasivo.');
    if (data.alcool === 'sim') warnings.push('Aguarde pelo menos 12 horas após consumo de álcool antes de doar.');
    if (data.fumo === 'sim') warnings.push('Aguarde pelo menos 2 horas sem fumar antes da doação.');
    if (data.medicamento === 'sim') warnings.push('Leve a lista de medicamentos em uso para avaliação da equipe médica no local.');

    let status = 'apto';
    if (blockers.length) status = 'inapto';
    else if (warnings.length) status = 'atencao';

    const content = {
      apto: {
        icon: 'bi-check-circle-fill',
        title: 'Você está apto a doar!',
        text: 'Com base nas suas respostas, você atende aos critérios básicos para doação. A confirmação final é feita presencialmente pela equipe do HEMOAM.',
      },
      atencao: {
        icon: 'bi-exclamation-circle-fill',
        title: 'Atenção a alguns pontos',
        text: 'Você pode doar, mas alguns cuidados precisam ser observados antes de ir até o HEMOAM.',
      },
      inapto: {
        icon: 'bi-x-circle-fill',
        title: 'Ainda não é possível doar',
        text: 'Identificamos um ou mais impedimentos temporários ou permanentes com base nas suas respostas.',
      },
    }[status];

    const reasons = [...blockers, ...warnings];
    const reasonsHtml = reasons.length
      ? `<ul class="result-reasons">${reasons.map(r => `<li><i class="bi bi-dot"></i>${r}</li>`).join('')}</ul>`
      : '';

    resultBox.className = `result-box ${status}`;
    resultBox.innerHTML = `
      <div class="result-icon"><i class="bi ${content.icon}"></i></div>
      <h2>${content.title}</h2>
      <p>${content.text}</p>
      ${reasonsHtml}
      <div class="result-actions">
        <a href="login.html#cadastro" class="btn btn-primary btn-lg">Criar minha conta <i class="bi bi-arrow-right"></i></a>
        <a href="index.html#onde-doar" class="btn btn-outline btn-lg">Ver locais de doação</a>
        <button type="button" class="btn btn-outline btn-lg" id="restartBtn"><i class="bi bi-arrow-counterclockwise"></i> Refazer</button>
      </div>
    `;
    document.getElementById('restartBtn').addEventListener('click', restart);
  }

  goToStep(1, false);
}
