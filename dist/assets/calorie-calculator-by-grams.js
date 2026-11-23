(() => {
  const energyInput = document.getElementById("energy-per-100g");
  const weightInput = document.getElementById("portion-weight-g");
  const output = document.getElementById("portion-output");
  const status = document.getElementById("portion-status");
  const exampleButton = document.getElementById("fill-example");
  const clearButton = document.getElementById("clear-calculator");
  if (!energyInput || !weightInput || !output || !status || !exampleButton || !clearButton) return;

  const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  function clearInvalidState() {
    energyInput.removeAttribute("aria-invalid");
    weightInput.removeAttribute("aria-invalid");
  }

  function updateResult() {
    clearInvalidState();
    const energyRaw = energyInput.value.trim();
    const weightRaw = weightInput.value.trim();
    if (!energyRaw || !weightRaw) {
      output.textContent = "— kcal";
      status.textContent = "Enter both values to estimate a portion.";
      return;
    }

    const energy = Number(energyRaw);
    const grams = Number(weightRaw);
    const validEnergy = Number.isFinite(energy) && energy >= 0 && energy <= 10000;
    const validWeight = Number.isFinite(grams) && grams > 0 && grams <= 10000;
    if (!validEnergy) {
      energyInput.setAttribute("aria-invalid", "true");
      output.textContent = "— kcal";
      status.textContent = "Enter a value from 0 to 10,000 kcal per 100 g.";
      return;
    }
    if (!validWeight) {
      weightInput.setAttribute("aria-invalid", "true");
      output.textContent = "— kcal";
      status.textContent = "Enter a portion weight greater than 0 and no more than 10,000 g.";
      return;
    }

    const estimate = Math.round(energy * grams / 100);
    output.textContent = `≈ ${numberFormat.format(estimate)} kcal`;
    status.textContent = `Estimated for ${new Intl.NumberFormat("en-US", {maximumFractionDigits: 1}).format(grams)} g using ${new Intl.NumberFormat("en-US", {maximumFractionDigits: 1}).format(energy)} kcal per 100 g.`;
  }

  energyInput.addEventListener("input", updateResult);
  weightInput.addEventListener("input", updateResult);
  exampleButton.addEventListener("click", () => {
    energyInput.value = "250";
    weightInput.value = "40";
    updateResult();
    weightInput.focus();
  });
  clearButton.addEventListener("click", () => {
    energyInput.value = "";
    weightInput.value = "";
    updateResult();
    energyInput.focus();
  });
})();
