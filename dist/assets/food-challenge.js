(() => {
  const board = document.querySelector("[data-food-challenge]");
  if (!board) return;

  const foods = {
    oatmeal: { name: "Oatmeal, Uncooked", kcal: 374 },
    egg: { name: "Egg, Whole, Cooked, Hard-Boiled", kcal: 155 },
    potato: { name: "Potato, baked, flesh and skin, without salt", kcal: 93 },
    milk: { name: "Milk, whole, 3.25% milkfat, with added vitamin D", kcal: 61 },
    apple: { name: "Gala Apple, Raw, with Skin", kcal: 57 },
    porridge: { name: "Horse Gram Porridge with Milk", kcal: 102 },
  };
  const questionBank = [
    ["oatmeal", "egg"],
    ["egg", "porridge"],
    ["potato", "milk"],
    ["milk", "apple"],
    ["porridge", "potato"],
  ];
  const buttons = [...board.querySelectorAll("[data-choice]")];
  const step = document.getElementById("challenge-step");
  const scoreLabel = document.getElementById("challenge-score");
  const feedback = document.getElementById("challenge-feedback");
  const next = document.getElementById("challenge-next");
  const result = document.getElementById("challenge-result");
  const resultTitle = document.getElementById("challenge-result-title");
  const resultCopy = document.getElementById("challenge-result-copy");
  const share = document.getElementById("challenge-share");
  const restart = document.getElementById("challenge-restart");
  const shareStatus = document.getElementById("challenge-share-status");
  const shareFallback = document.getElementById("challenge-share-fallback");
  let questions = [];
  let questionIndex = 0;
  let score = 0;
  let currentChoices = [];
  let answered = false;

  const shuffle = (items) => items.map((item) => [Math.random(), item]).sort((a, b) => a[0] - b[0]).map((entry) => entry[1]);
  const rounded = (food) => Math.round(food.kcal);

  function updateScore() {
    scoreLabel.textContent = `${score} correct`;
  }

  function showResult() {
    document.getElementById("challenge-options").hidden = true;
    document.getElementById("challenge-question").hidden = true;
    feedback.hidden = true;
    next.hidden = true;
    result.hidden = false;
    resultTitle.textContent = `You got ${score} out of ${questions.length}.`;
    resultCopy.textContent = score === questions.length
      ? "A perfect round. Send the challenge to someone who knows their food facts."
      : "Every round is a fresh mix. Share your score and challenge someone to try it."
  }

  function renderQuestion() {
    if (questionIndex >= questions.length) {
      showResult();
      return;
    }
    const pair = questions[questionIndex];
    currentChoices = Math.random() < 0.5 ? pair : [...pair].reverse();
    answered = false;
    step.textContent = `Question ${questionIndex + 1} of ${questions.length}`;
    updateScore();
    feedback.textContent = "";
    feedback.hidden = true;
    next.hidden = true;
    buttons.forEach((button, index) => {
      const food = foods[currentChoices[index]];
      button.textContent = food.name;
      button.disabled = false;
      button.removeAttribute("data-state");
    });
  }

  function choose(button) {
    if (answered) return;
    answered = true;
    const selected = currentChoices[Number(button.dataset.choice)];
    const higher = currentChoices.reduce((best, id) => foods[id].kcal > foods[best].kcal ? id : best, currentChoices[0]);
    const correct = selected === higher;
    if (correct) score += 1;
    buttons.forEach((choice, index) => {
      const id = currentChoices[index];
      choice.disabled = true;
      choice.dataset.state = id === higher ? "correct" : id === selected ? "incorrect" : "missed";
    });
    const first = foods[currentChoices[0]];
    const second = foods[currentChoices[1]];
    feedback.textContent = `${correct ? "Correct." : "Not quite."} ${first.name}: ${rounded(first)} kcal. ${second.name}: ${rounded(second)} kcal per 100 g.`;
    feedback.hidden = false;
    updateScore();
    next.textContent = questionIndex === questions.length - 1 ? "See my score" : "Next question";
    next.hidden = false;
  }

  function startRound() {
    questions = shuffle([...questionBank]);
    questionIndex = 0;
    score = 0;
    board.querySelector("#challenge-options").hidden = false;
    board.querySelector("#challenge-question").hidden = false;
    feedback.hidden = false;
    result.hidden = true;
    shareStatus.textContent = "";
    shareFallback.hidden = true;
    renderQuestion();
  }

  async function shareScore() {
    const url = `${window.location.origin}/challenge/`;
    const message = `I scored ${score} out of 5 on the QikCal Food Facts Challenge. Can you beat me? ${url}`;
    shareStatus.textContent = "";
    shareFallback.hidden = true;
    if (navigator.share) {
      try {
        await navigator.share({ title: "QikCal Food Facts Challenge", text: message });
        shareStatus.textContent = "Your score was shared.";
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          shareStatus.textContent = "Sharing canceled. Your score stayed on this device.";
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      shareStatus.textContent = "Score and challenge link copied. Paste them where you like.";
    } catch {
      shareFallback.value = message;
      shareFallback.hidden = false;
      shareFallback.focus();
      shareFallback.select();
      shareStatus.textContent = "Copy the selected score message to share your result.";
    }
  }

  buttons.forEach((button) => button.addEventListener("click", () => choose(button)));
  next.addEventListener("click", () => {
    questionIndex += 1;
    renderQuestion();
  });
  restart.addEventListener("click", startRound);
  share.addEventListener("click", shareScore);
  board.hidden = false;
  startRound();
})();
