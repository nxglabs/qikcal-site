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
  const sharePreview = document.getElementById("challenge-share-preview");
  const shareImage = document.getElementById("challenge-share-image");
  const downloadCard = document.getElementById("challenge-card-download");
  let questions = [];
  let questionIndex = 0;
  let score = 0;
  let currentChoices = [];
  let answered = false;
  let scoreCardUrl = "";

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
    sharePreview.hidden = true;
    downloadCard.hidden = true;
    if (scoreCardUrl) URL.revokeObjectURL(scoreCardUrl);
    scoreCardUrl = "";
    renderQuestion();
  }

  function makeScoreCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return Promise.resolve(null);

    context.fillStyle = "#f6f1e6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(36, 91, 69, .18)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(920, 220, 255, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(184, 73, 43, .2)";
    context.beginPath();
    context.ellipse(918, 220, 190, 220, -0.28, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#245b45";
    context.beginPath();
    context.moveTo(99, 78);
    context.lineTo(129, 78);
    context.quadraticCurveTo(150, 78, 150, 99);
    context.lineTo(150, 129);
    context.quadraticCurveTo(150, 150, 129, 150);
    context.lineTo(99, 150);
    context.quadraticCurveTo(78, 150, 78, 129);
    context.lineTo(78, 99);
    context.quadraticCurveTo(78, 78, 99, 78);
    context.fill();
    context.fillStyle = "#fffdf7";
    context.font = "700 45px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Q", 114, 114);
    context.textAlign = "left";
    context.fillStyle = "#1e2f28";
    context.font = "700 36px Arial, sans-serif";
    context.fillText("QikCal", 170, 116);
    context.fillStyle = "#b8492b";
    context.font = "700 19px Arial, sans-serif";
    context.letterSpacing = "3px";
    context.fillText("FOOD FACTS CHALLENGE", 82, 304);
    context.letterSpacing = "0px";

    context.fillStyle = "#1e2f28";
    context.font = "400 82px Georgia, serif";
    context.fillText("I scored", 78, 438);
    context.fillStyle = "#245b45";
    context.font = "700 210px Arial, sans-serif";
    context.fillText(`${score}`, 68, 700);
    context.fillStyle = "#65726a";
    context.font = "400 65px Georgia, serif";
    context.fillText("out of 5", 270, 692);

    context.strokeStyle = "rgba(30, 47, 40, .18)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(80, 810);
    context.lineTo(1000, 810);
    context.stroke();
    context.fillStyle = "#1e2f28";
    context.font = "400 54px Georgia, serif";
    context.fillText("Can you beat my score?", 80, 920);
    context.fillStyle = "#52645a";
    context.font = "400 29px Arial, sans-serif";
    context.fillText("Five quick food comparisons. Play in your browser.", 80, 984);

    context.fillStyle = "#245b45";
    context.beginPath();
    context.moveTo(124, 1070);
    context.lineTo(466, 1070);
    context.quadraticCurveTo(510, 1070, 510, 1114);
    context.quadraticCurveTo(510, 1158, 466, 1158);
    context.lineTo(124, 1158);
    context.quadraticCurveTo(80, 1158, 80, 1114);
    context.quadraticCurveTo(80, 1070, 124, 1070);
    context.fill();
    context.fillStyle = "#fffdf7";
    context.font = "700 30px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("Try the challenge", 295, 1115);
    context.textAlign = "left";
    context.fillStyle = "#65726a";
    context.font = "400 25px Arial, sans-serif";
    context.fillText("cal.qik.ai/challenge", 80, 1235);

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
  }

  async function shareScore() {
    const url = `${window.location.origin}/challenge/`;
    const message = `I scored ${score} out of 5 on the QikCal Food Facts Challenge. Can you beat me?`;
    const copyMessage = `${message} ${url}`;
    shareStatus.textContent = "";
    shareFallback.hidden = true;
    let blob = null;
    try {
      blob = await makeScoreCard();
    } catch {
      blob = null;
    }
    let file = null;
    if (blob) {
      if (scoreCardUrl) URL.revokeObjectURL(scoreCardUrl);
      scoreCardUrl = URL.createObjectURL(blob);
      shareImage.src = scoreCardUrl;
      shareImage.alt = `QikCal Food Facts Challenge score card: ${score} out of 5.`;
      downloadCard.href = scoreCardUrl;
      sharePreview.hidden = false;
      downloadCard.hidden = false;
      if (typeof File === "function") file = new File([blob], "qikcal-food-facts-score.png", { type: "image/png" });
      shareStatus.textContent = "Score card ready. Choose whether to share or download it.";
    } else {
      shareStatus.textContent = "Your score is ready to share as a message and link.";
    }

    if (file && navigator.share && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "QikCal Food Facts Challenge", text: message, url });
          shareStatus.textContent = "Your score card was shared.";
          return;
        }
      } catch (error) {
        if (error && error.name === "AbortError") {
          shareStatus.textContent = "Sharing canceled. Your score stayed on this device.";
          return;
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "QikCal Food Facts Challenge", text: message, url });
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
      await navigator.clipboard.writeText(copyMessage);
      shareStatus.textContent = "Score and challenge link copied. Paste them where you like.";
    } catch {
      shareFallback.value = copyMessage;
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
