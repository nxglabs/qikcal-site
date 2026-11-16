(() => {
  const root = document.querySelector("[data-food-catalog]");
  if (!root) return;

  const queryInput = document.getElementById("catalog-query");
  const sourceSelect = document.getElementById("catalog-source");
  const resultList = document.getElementById("catalog-results");
  const status = document.getElementById("catalog-status");
  const retryButton = document.getElementById("catalog-retry");
  const quickSearches = Array.from(root.querySelectorAll("[data-catalog-query]"));
  const selectedPanel = document.getElementById("catalog-selected");
  const selectedName = document.getElementById("selected-food-name");
  const selectedSource = document.getElementById("selected-food-source");
  const selectedReference = document.getElementById("selected-food-reference");
  const selectedNotes = document.getElementById("selected-food-notes");
  const selectedEnergy = document.getElementById("selected-food-energy");
  const gramsInput = document.getElementById("portion-grams");
  const servingButton = document.getElementById("portion-serving");
  const result = document.getElementById("portion-result");
  const detail = document.getElementById("portion-detail");
  const sourceLink = document.getElementById("portion-source");
  const shareButton = document.getElementById("portion-share");
  const shareStatus = document.getElementById("portion-share-status");

  const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  let catalog = null;
  let records = [];
  let selectedRecord = null;
  let catalogLoading = false;

  const copy = {
    loading: "Loading food reference records…",
    allCollections: (count) => `All collections · ${numberFormat.format(count)}`,
    typeToSearch: (count) => `Type a food or ingredient to search ${numberFormat.format(count)} reference records.`,
    noMatches: "No matching records. Try fewer words or another spelling.",
    matchCount: (count) => `${numberFormat.format(count)} ${count === 1 ? "match" : "matches"}.`,
    moreMatches: (count, shown) => `${numberFormat.format(count)} matches · showing ${shown}. Add another word to narrow the list.`,
    resultEnergy: (record) => record.kcalPer100g === null ? "Energy unavailable" : `${numberFormat.format(Math.round(record.kcalPer100g))} kcal / 100 g`,
    energy: (kcal) => `${numberFormat.format(kcal)} kcal per 100 g`,
    energyMissing: "Energy is not available in this source record.",
    sourceDetail: (source) => source,
    estimate: (grams, name, source) => `for ${grams} g of ${name}, using this ${source} record`,
    invalidWeight: "Enter a portion weight from 1 to 3,000 g.",
    noEnergyEstimate: "This record has no energy value. Choose another record to calculate a portion estimate.",
    shareSummary: (name, kcal, grams, source) => `${name}: about ${kcal} kcal for ${grams} g, using one published ${source} record. Recipes and actual portions vary.`,
    shareTitle: "Food portion estimate",
    shared: "Estimate shared.",
    copied: "Estimate and guide link copied.",
    unavailable: "Sharing is not available here. Copy the estimate and guide link manually.",
    shareError: "Unable to share right now. You can copy the guide link from your browser.",
    loadError: "Could not load the food catalog. Check your connection, then retry.",
    noServing: "No listed serving weight",
    sourceAriaLabel: (name, source) => `Review ${name} in ${source} (opens in a new tab)`,
    resultAriaLabel: (name, source) => `Open ${name} in ${source} in a new tab`,
    useServing: (name, grams) => `Use ${name} · ${grams} g`,
  };

  const guideFeaturedRecordIds = new Set(
    Array.from(document.querySelectorAll("#quick-table [data-food-id]"), (row) => row.dataset.foodId),
  );

  function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US").trim();
  }

  function sourceLabel(source) {
    if (source.includes("CoFID")) return "U.K. CoFID 2021";
    if (source.includes("FNDDS")) return "FNDDS 2021–2023 · Oct 2024";
    if (source.includes("Foundation")) return "Foundation Foods · Oct 2026";
    if (source.includes("SR Legacy")) return "SR Legacy · Apr 2018";
    return source;
  }

  function recordUrl(record) {
    if (record.id.startsWith("cofid:")) {
      return "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid";
    }
    return `https://fdc.nal.usda.gov/food-details/${encodeURIComponent(record.id)}/nutrients`;
  }

  function displayGrams(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
  }

  function setBusy(isBusy) {
    queryInput.disabled = isBusy;
    sourceSelect.disabled = isBusy;
    quickSearches.forEach((button) => { button.disabled = isBusy; });
    retryButton.hidden = isBusy || Boolean(catalog);
  }

  function renderLoadingRows() {
    resultList.replaceChildren();
    for (const width of [78, 58, 70]) {
      const item = document.createElement("li");
      item.className = "catalog-loading-row";
      item.setAttribute("aria-hidden", "true");
      const primary = document.createElement("span");
      primary.className = "catalog-skeleton-line";
      primary.style.width = `${width}%`;
      const secondary = document.createElement("span");
      secondary.className = "catalog-skeleton-line catalog-skeleton-short";
      secondary.style.width = "28%";
      item.append(primary, secondary);
      resultList.append(item);
    }
  }

  function sortedMatches(query, sourceIndex) {
    const normalizedQuery = normalize(query);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const rankedQuery = terms.join(" ");

    const matches = [];
    for (const record of records) {
      if (sourceIndex !== "all" && record.source !== Number(sourceIndex)) continue;
      if (!terms.every((term) => record.searchName.includes(term))) continue;
      const words = record.searchName.split(/[^a-z0-9]+/);
      const rank = record.searchName === rankedQuery
        ? 0
        : record.searchName.startsWith(rankedQuery)
          ? 1
          : terms.every((term) => words.some((word) => word.startsWith(term)))
            ? 2
            : 3;
      const featuredRank = guideFeaturedRecordIds.has(record.id) ? -0.5 : 0;
      matches.push({ record, rank: rank + featuredRank });
    }

    matches.sort((left, right) => left.rank - right.rank || left.record.name.localeCompare(right.record.name, "en"));
    return matches.map((match) => match.record);
  }

  function updateEstimate() {
    if (!selectedRecord) return;

    const rawWeight = gramsInput.value.trim();
    const grams = Number(rawWeight);
    shareStatus.textContent = "";
    gramsInput.removeAttribute("aria-invalid");

    if (selectedRecord.kcalPer100g === null) {
      result.textContent = "— kcal";
      detail.textContent = copy.noEnergyEstimate;
      shareButton.disabled = true;
      return null;
    }

    if (rawWeight === "" || !Number.isFinite(grams) || grams < 1 || grams > 3000) {
      result.textContent = "— kcal";
      detail.textContent = copy.invalidWeight;
      gramsInput.setAttribute("aria-invalid", "true");
      shareButton.disabled = true;
      return null;
    }

    const kcal = Math.round(selectedRecord.kcalPer100g * grams / 100);
    const normalizedGrams = displayGrams(grams);
    const formattedKcal = numberFormat.format(kcal);
    result.textContent = `≈ ${formattedKcal} kcal`;
    const source = sourceLabel(catalog.sources[selectedRecord.source].name);
    detail.textContent = copy.estimate(normalizedGrams, selectedRecord.name, source);
    shareButton.disabled = false;
    shareButton.dataset.summary = copy.shareSummary(selectedRecord.name, formattedKcal, normalizedGrams, source);
    return { kcal: formattedKcal, grams: normalizedGrams };
  }

  function selectRecord(record) {
    selectedRecord = record;
    selectedPanel.hidden = false;
    selectedName.textContent = record.name;
    const source = sourceLabel(catalog.sources[record.source].name);
    selectedSource.textContent = copy.sourceDetail(source);
    if (selectedReference) {
      selectedReference.textContent = record.sourceReference ? `Source reference: ${record.sourceReference}` : "";
      selectedReference.hidden = !record.sourceReference;
    }
    if (selectedNotes) {
      selectedNotes.textContent = record.sourceNotes ? `Source note: ${record.sourceNotes}` : "";
      selectedNotes.hidden = !record.sourceNotes;
    }
    selectedEnergy.textContent = record.kcalPer100g === null
      ? copy.energyMissing
      : copy.energy(record.kcalPer100g);
    sourceLink.href = recordUrl(record);
    sourceLink.setAttribute("aria-label", copy.sourceAriaLabel(record.name, source));

    const hasEnergy = record.kcalPer100g !== null;
    gramsInput.disabled = !hasEnergy;
    gramsInput.value = record.serving ? displayGrams(record.serving.grams) : "100";
    servingButton.disabled = !hasEnergy || !record.serving;
    servingButton.textContent = record.serving
      ? copy.useServing(record.serving.name, displayGrams(record.serving.grams))
      : copy.noServing;

    updateEstimate();
    renderResults();
  }

  function renderResults() {
    resultList.replaceChildren();
    if (!catalog) return;

    const query = queryInput.value.trim();
    const matches = query ? sortedMatches(query, sourceSelect.value) : [];
    if (selectedRecord && !matches.some((record) => record.id === selectedRecord.id)) {
      selectedRecord = null;
      selectedPanel.hidden = true;
    }
    if (!query) {
      status.textContent = copy.typeToSearch(catalog.recordCount);
      return;
    }

    const shown = matches.slice(0, 12);
    if (!matches.length) {
      status.textContent = copy.noMatches;
      return;
    }

    status.textContent = matches.length > shown.length
      ? copy.moreMatches(matches.length, shown.length)
      : copy.matchCount(matches.length);

    const fragment = document.createDocumentFragment();
    for (const record of shown) {
      const item = document.createElement("li");
      item.className = "catalog-result";

      const chooseButton = document.createElement("button");
      chooseButton.type = "button";
      chooseButton.className = "catalog-result-choice";
      chooseButton.setAttribute("aria-pressed", String(selectedRecord?.id === record.id));
      chooseButton.addEventListener("click", () => selectRecord(record));

      const name = document.createElement("span");
      name.className = "catalog-result-name";
      name.textContent = record.name;
      const source = document.createElement("span");
      source.className = "catalog-result-source";
      source.textContent = sourceLabel(catalog.sources[record.source].name);
      chooseButton.append(name, source);

      const meta = document.createElement("div");
      meta.className = "catalog-result-meta";
      const energy = document.createElement("strong");
      energy.className = record.kcalPer100g === null ? "is-unavailable" : "";
      energy.textContent = copy.resultEnergy(record);
      const sourceLinkForRecord = document.createElement("a");
      sourceLinkForRecord.href = recordUrl(record);
      sourceLinkForRecord.target = "_blank";
      sourceLinkForRecord.rel = "noopener noreferrer";
      sourceLinkForRecord.textContent = "View source ↗";
      sourceLinkForRecord.setAttribute("aria-label", copy.resultAriaLabel(record.name, sourceLabel(catalog.sources[record.source].name)));
      meta.append(energy, sourceLinkForRecord);
      item.append(chooseButton, meta);
      fragment.append(item);
    }
    resultList.append(fragment);
  }

  async function loadCatalog() {
    if (catalog || catalogLoading) return;
    catalogLoading = true;
    setBusy(true);
    status.textContent = copy.loading;
    retryButton.hidden = true;
    renderLoadingRows();

    try {
      const response = await fetch(root.dataset.catalogUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Catalog request failed");
      catalog = await response.json();
      records = catalog.records.map((record) => ({
        ...record,
        searchName: normalize(record.name),
      }));

      sourceSelect.replaceChildren();
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = copy.allCollections(catalog.recordCount);
      sourceSelect.append(allOption);
      catalog.sources.forEach((source, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${sourceLabel(source.name)} · ${numberFormat.format(source.records)}`;
        sourceSelect.append(option);
      });

      setBusy(false);
      queryInput.setAttribute("aria-describedby", "catalog-status catalog-local-note");
      const defaultRecord = records.find((record) => record.id === root.dataset.defaultFood) ?? null;
      if (defaultRecord) selectRecord(defaultRecord);
      else renderResults();
    } catch {
      catalog = null;
      records = [];
      selectedPanel.hidden = true;
      status.textContent = copy.loadError;
      retryButton.hidden = false;
      setBusy(false);
    } finally {
      catalogLoading = false;
    }
  }

  function loadCatalogNearViewport() {
    if (!("IntersectionObserver" in window)) {
      void loadCatalog();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void loadCatalog();
      }
    }, { rootMargin: "360px 0px" });
    observer.observe(root);
  }

  queryInput.addEventListener("input", renderResults);
  sourceSelect.addEventListener("change", renderResults);
  gramsInput.addEventListener("input", updateEstimate);
  quickSearches.forEach((button) => {
    button.addEventListener("click", () => {
      queryInput.value = button.dataset.catalogQuery;
      renderResults();
    });
  });
  servingButton.addEventListener("click", () => {
    if (!selectedRecord?.serving) return;
    gramsInput.value = displayGrams(selectedRecord.serving.grams);
    updateEstimate();
  });
  retryButton.addEventListener("click", loadCatalog);
  shareButton.addEventListener("click", async () => {
    const estimate = updateEstimate();
    if (!estimate || !selectedRecord) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    const text = shareButton.dataset.summary;
    try {
      if (navigator.share) {
        await navigator.share({ title: copy.shareTitle, text, url: url.href });
        shareStatus.textContent = copy.shared;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url.href}`);
        shareStatus.textContent = copy.copied;
      } else {
        shareStatus.textContent = copy.unavailable;
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = copy.shareError;
    }
  });

  loadCatalogNearViewport();
})();
