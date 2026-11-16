(() => {
  const table = document.querySelector(".food-table");
  const foodSelect = document.getElementById("portion-food");
  const gramsInput = document.getElementById("portion-grams");
  const servingButton = document.getElementById("portion-serving");
  const result = document.getElementById("portion-result");
  const detail = document.getElementById("portion-detail");
  const sourceLink = document.getElementById("portion-source");
  const shareButton = document.getElementById("portion-share");
  const shareStatus = document.getElementById("portion-share-status");

  if (!table || !foodSelect || !gramsInput || !servingButton || !result || !detail || !sourceLink || !shareButton || !shareStatus) return;

  const language = document.documentElement.lang.toLowerCase().startsWith("hi") ? "hi" : "en";
  const copy = language === "hi" ? {
    noRecords: "कोई लिंक किया हुआ खाद्य रिकॉर्ड उपलब्ध नहीं है।",
    invalidWeight: "1 से 3,000 g के बीच वजन दर्ज करें।",
    estimate: (grams, name) => `${grams} g ${name} के लिए, इस USDA रिकॉर्ड के अनुसार`,
    shareSummary: (name, kcal, grams) => `${name}: ${grams} g के लिए लगभग ${kcal} kcal, USDA FoodData Central के एक रिकॉर्ड के आधार पर। रेसिपी और वास्तविक मात्रा अलग हो सकती है।`,
    listedServing: "सूची में दी गई मात्रा चुनें",
    serving: (name, grams) => `सूची की मात्रा: ${name} · ${grams} g`,
    shareTitle: "भारतीय भोजन का कैलोरी अनुमान",
    shared: "अनुमान साझा किया गया।",
    copied: "अनुमान और गाइड का लिंक कॉपी हुआ।",
    unavailable: "यहाँ शेयरिंग उपलब्ध नहीं है। अनुमान और लिंक को स्वयं कॉपी करें।",
    error: "अभी शेयर नहीं हो पाया। आप ब्राउज़र से गाइड का लिंक कॉपी कर सकते हैं।"
  } : {
    noRecords: "No linked food records are available.",
    invalidWeight: "Enter a portion weight from 1 to 3,000 g.",
    estimate: (grams, name) => `for ${grams} g of ${name}, using this USDA record`,
    shareSummary: (name, kcal, grams) => `${name}: about ${kcal} kcal for ${grams} g, using one USDA FoodData Central record. Recipes and actual portions vary.`,
    listedServing: "Use listed serving",
    serving: (name, grams) => `Use ${name} · ${grams} g`,
    shareTitle: "Indian food portion estimate",
    shared: "Estimate shared.",
    copied: "Estimate and guide link copied.",
    unavailable: "Sharing is not available here. Copy the estimate and guide link manually.",
    error: "Unable to share right now. You can copy the guide link from your browser."
  };
  const numberFormat = new Intl.NumberFormat("en-IN");

  const records = Array.from(table.tBodies[0].rows).map((row) => {
    const link = row.querySelector("th a");
    return {
      id: row.dataset.foodId,
      name: link?.textContent.trim() ?? "",
      url: link?.href ?? "",
      kcalPer100g: Number(row.dataset.kcal),
      servingName: language === "hi" ? (row.dataset.servingNameHi ?? row.dataset.servingName ?? "") : (row.dataset.servingName ?? ""),
      servingGrams: Number(row.dataset.servingGrams),
    };
  }).filter((record) => record.id && record.name && record.url && Number.isFinite(record.kcalPer100g));

  foodSelect.replaceChildren();
  for (const record of records) {
    const option = document.createElement("option");
    option.value = record.id;
    option.textContent = record.name;
    foodSelect.append(option);
  }

  const firstRecord = records.find((record) => record.id === "2708346") ?? records[0];
  if (!firstRecord) {
    detail.textContent = copy.noRecords;
    return;
  }
  foodSelect.value = firstRecord.id;
  foodSelect.disabled = false;
  gramsInput.disabled = false;
  servingButton.disabled = false;
  shareButton.disabled = false;

  function currentRecord() {
    return records.find((record) => record.id === foodSelect.value);
  }

  function displayGrams(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
  }

  function updateEstimate() {
    const record = currentRecord();
    const rawGrams = gramsInput.value.trim();
    const grams = Number(rawGrams);
    shareStatus.textContent = "";

    if (!record || rawGrams === "" || !Number.isFinite(grams) || grams < 1 || grams > 3000) {
      result.textContent = "— kcal";
      detail.textContent = copy.invalidWeight;
      sourceLink.hidden = !record;
      shareButton.disabled = true;
      return null;
    }

    const kcal = Math.round(record.kcalPer100g * grams / 100);
    const normalizedGrams = displayGrams(grams);
    const formattedKcal = numberFormat.format(kcal);
    result.textContent = `≈ ${formattedKcal} kcal`;
    detail.textContent = copy.estimate(normalizedGrams, record.name);
    sourceLink.href = record.url;
    sourceLink.hidden = false;
    shareButton.disabled = false;
    shareButton.dataset.summary = copy.shareSummary(record.name, formattedKcal, normalizedGrams);
    return {record, kcal, grams: normalizedGrams};
  }

  function updateServingLabel(record) {
    if (!record || !record.servingName || !Number.isFinite(record.servingGrams)) {
      servingButton.textContent = copy.listedServing;
      servingButton.disabled = true;
      return;
    }
    servingButton.disabled = false;
    servingButton.textContent = copy.serving(record.servingName, displayGrams(record.servingGrams));
  }

  foodSelect.addEventListener("change", () => {
    const record = currentRecord();
    if (record && Number.isFinite(record.servingGrams)) gramsInput.value = displayGrams(record.servingGrams);
    updateServingLabel(record);
    updateEstimate();
  });
  gramsInput.addEventListener("input", updateEstimate);
  servingButton.addEventListener("click", () => {
    const record = currentRecord();
    if (!record || !Number.isFinite(record.servingGrams)) return;
    gramsInput.value = displayGrams(record.servingGrams);
    updateEstimate();
  });
  shareButton.addEventListener("click", async () => {
    const estimate = updateEstimate();
    if (!estimate) return;
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    const text = shareButton.dataset.summary;
    try {
      if (navigator.share) {
        await navigator.share({title: copy.shareTitle, text, url: url.href});
        shareStatus.textContent = copy.shared;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url.href}`);
        shareStatus.textContent = copy.copied;
      } else {
        shareStatus.textContent = copy.unavailable;
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = copy.error;
    }
  });

  updateServingLabel(firstRecord);
  updateEstimate();
})();
