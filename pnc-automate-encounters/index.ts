const EncounterType = {
  Initial: "Initial",
  FollowUp: "FollowUp",
} as const;
type EncounterType = keyof typeof EncounterType;

const cssSelectors = {
  [EncounterType.Initial]: {
    assessmentTextMarkdownLabel: "#popup-83-body label[for='85-markdown']",
    riskAssessmentLink: "#popup-385",
    mentalStatusExamLink: "#popup-504",
    reasonsForServicesEcounterCodeLink: "#popup-928-body a",
    interventionsAppliedTextMarkdownLabel:
      "#popup-941-body label[for='942-markdown']",
    caseFormulationEditableDiv: "[id='921']",
  },
  [EncounterType.FollowUp]: {
    assessmentTextMarkdownLabel: "#popup-57-body label[for='58-markdown']",
    riskAssessmentLink: "#popup-64",
    mentalStatusExamLink: "#popup-179",
    reasonsForServicesEcounterCodeLink: "#popup-603-body a",
    interventionsAppliedTextMarkdownLabel:
      "#popup-616-body label[for='617-markdown']",
    caseFormulationEditableDiv: "[id='596']",
  },
} as const;

const buttonText = {
  [EncounterType.Initial]: "Fill in defaults for an initial",
  [EncounterType.FollowUp]: "Fill in defaults for a follow up",
} as const;

let patientFrameDocument: Document;

(async function () {
  // Assume that the page takes max 5 seconds to load, and only check if the script should run after waiting 5 seconds.
  await sleep(5000);

  // Only run the script if the current page has the relevant elements.
  if (!shouldRunOnPage()) {
    console.log("should not run");
    return;
  }

  // Run the script: add a button that, when clicked, sets the default options.
  console.log("should run");
  patientFrameDocument = getPatientFrameDocument();
  insertButton();
})();

function shouldRunOnPage(): boolean {
  const doc = document
    .querySelector<HTMLIFrameElement>("iframe[aria-label=PncChart]")
    ?.contentWindow?.document?.querySelector<HTMLIFrameElement>(
      "iframe#patient-frame"
    )?.contentWindow?.document;
  if (!doc) {
    console.log("no doc");
    return false;
  }

  const encounterForm = doc.querySelector<HTMLElement>("div#encounterform");
  if (!encounterForm) {
    console.log("no encounter form");
    return false;
  }

  return true;
}

function getEncounterType(): EncounterType {
  // Using the presence of these elements as proxies for the encounter type.
  if (patientFrameDocument.querySelector<HTMLElement>("#popup-83-body")) {
    return EncounterType.Initial;
  } else if (
    patientFrameDocument.querySelector<HTMLElement>("#popup-57-body")
  ) {
    return EncounterType.FollowUp;
  } else {
    throw new Error("Invalid encounter type");
  }
}

function insertButton() {
  const encounterType = getEncounterType();

  const setDefaultsButton = document.createElement("button");
  setDefaultsButton.innerText = buttonText[encounterType];
  setDefaultsButton.addEventListener("click", async (e) => {
    e.preventDefault();

    if (encounterType == EncounterType.Initial) {
      await setDefaultOptionsForInitial();
    } else if (encounterType == EncounterType.FollowUp) {
      await setDefaultOptionsForFollowUp();
    }

    if (e.target instanceof HTMLElement) {
      e.target.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Insert the button towards the top of the page.

  const firstElementOfEncounterForm = patientFrameDocument.querySelector(
    "div#encounterform > div"
  );
  if (!firstElementOfEncounterForm)
    throw new Error("Could not find encounter form");

  firstElementOfEncounterForm.insertAdjacentElement(
    "beforebegin",
    setDefaultsButton
  );
}

async function setDefaultOptionsForInitial() {
  setAssessmentTextToUseMarkdown(EncounterType.Initial);
  await sleep();

  await setRiskAssessmentInputsToNone(EncounterType.Initial);
  await sleep();

  await setMentalStatusExamInputsToUnremarkable(EncounterType.Initial);
  await sleep();

  await setReasonsForServicesEcounterCodeToNotApplicable(EncounterType.Initial);
  await sleep();

  setInterventionsAppliedTextToUseMarkdown(EncounterType.Initial);
  await sleep();

  fillInCaseFormulation(EncounterType.Initial);
  await sleep();
}

async function setDefaultOptionsForFollowUp() {
  setProgressNotesTextToUseMarkdown();
  await sleep();

  await setReasonsForServicesEcounterCodeToNotApplicable(
    EncounterType.FollowUp
  );
  await sleep();

  setInterventionsAppliedTextToUseMarkdown(EncounterType.FollowUp);
  await sleep();
}

function fillInCaseFormulation(encounterType: EncounterType) {
  const caseFormulationEditableDiv =
    patientFrameDocument.querySelector<HTMLDivElement>(
      cssSelectors[encounterType].caseFormulationEditableDiv
    );
  if (!caseFormulationEditableDiv)
    throw new Error("Could not find Case formulation text box");

  caseFormulationEditableDiv.scrollIntoView({ behavior: "smooth" });
  caseFormulationEditableDiv.innerText = `Presenting: 
Precipitating: 
Predisposing: 
Perpetuating: 
Protective:`;
}

function setAssessmentTextToUseMarkdown(encounterType: EncounterType) {
  const markdownLabel = patientFrameDocument.querySelector<HTMLLabelElement>(
    cssSelectors[encounterType].assessmentTextMarkdownLabel
  );
  if (!markdownLabel)
    throw new Error("Could not find Assessment markdown button");

  markdownLabel.scrollIntoView({ behavior: "smooth" });
  markdownLabel.click();
}

function setInterventionsAppliedTextToUseMarkdown(
  encounterType: EncounterType
) {
  const markdownLabel = patientFrameDocument.querySelector<HTMLLabelElement>(
    cssSelectors[encounterType].interventionsAppliedTextMarkdownLabel
  );
  if (!markdownLabel)
    throw new Error("Could not find Interventions applied markdown button");

  markdownLabel.scrollIntoView({ behavior: "smooth" });
  markdownLabel.click();
}

// Only used in follow up
function setProgressNotesTextToUseMarkdown() {
  const markdownLabel = patientFrameDocument.querySelector<HTMLLabelElement>(
    "#popup-60-body label[for='61-markdown']"
  );
  if (!markdownLabel)
    throw new Error("Could not find Progress notes markdown button");

  markdownLabel.scrollIntoView({ behavior: "smooth" });
  markdownLabel.click();
}

async function setRiskAssessmentInputsToNone(encounterType: EncounterType) {
  /* Open risk assessment modal */

  const riskAssessmentLink =
    patientFrameDocument.querySelector<HTMLAnchorElement>(
      cssSelectors[encounterType].riskAssessmentLink
    );

  if (
    !riskAssessmentLink ||
    !riskAssessmentLink.innerText.includes("RISK ASSESSMENT")
  ) {
    throw new Error("RISK ASSESSMENT link could not be found");
  }

  riskAssessmentLink.scrollIntoView({ behavior: "smooth" });
  await sleep();
  riskAssessmentLink.click();

  /* Make sure modal is open */

  await sleep();

  const modal =
    patientFrameDocument.querySelector<HTMLElement>("div[role=dialog]");
  if (!modal) throw new Error("RISK ASSESSMENT modal not found");

  const modalTitleText =
    modal.querySelector<HTMLElement>(".modal-title")?.innerText;
  if (!modalTitleText || !modalTitleText.includes("RISK ASSESSMENT")) {
    throw new Error("RISK ASSESSMENT modal not open");
  }

  /* Select each 'None' option */

  const allNoneRadioOptions = modal.querySelectorAll<HTMLElement>(
    "input[type=radio][value=None]"
  );
  if (!allNoneRadioOptions.length)
    throw new Error("Could not find any 'None' radio options");

  allNoneRadioOptions.forEach((x) => x.click());

  await sleep();

  /* Save the selected options */

  const saveButton = modal.querySelector<HTMLElement>(".modal-footer button");
  if (!saveButton || !saveButton.innerText.includes("Save")) {
    throw new Error("Could not find 'Save' button");
  }
  saveButton.click();
}

async function setMentalStatusExamInputsToUnremarkable(
  encounterType: EncounterType
) {
  const mentalStatusExamLink =
    patientFrameDocument.querySelector<HTMLAnchorElement>(
      cssSelectors[encounterType].mentalStatusExamLink
    );
  if (
    !mentalStatusExamLink ||
    !mentalStatusExamLink.innerText.includes("Mental Status Exam")
  )
    throw new Error("Could not find Mental Status Exam link");

  mentalStatusExamLink.scrollIntoView({ behavior: "smooth" });
  await sleep();
  mentalStatusExamLink.click();

  // Make sure modal is open

  await sleep();

  const modal =
    patientFrameDocument.querySelector<HTMLElement>("div[role=dialog]");
  if (!modal) throw new Error("Mental Status Exam modal not found");

  const modalTitleText =
    modal.querySelector<HTMLElement>(".modal-title")?.innerText;
  if (!modalTitleText || !modalTitleText.includes("Mental Status Exam")) {
    throw new Error("Mental Status Exam modal not open");
  }

  // Select 'All unremarkable' preset

  const allUnremarkableButton =
    modal.querySelector<HTMLButtonElement>("button#preset");
  if (!allUnremarkableButton)
    throw new Error("allUnremarkableButton not found");

  allUnremarkableButton.click();

  // Wait for preset to take effect

  await sleep();

  // De-select specific checkboxes

  Array.from(modal.querySelectorAll("label"))
    .filter(
      (x) =>
        x.innerText.includes("well-appearing") ||
        x.innerText.includes("well-nourished")
    )
    .forEach((x) => x.click());

  await sleep();

  /* Save the selected options */

  const saveButton = modal.querySelector<HTMLElement>(".modal-footer button");
  if (!saveButton || !saveButton.innerText.includes("Save")) {
    throw new Error("Could not find 'Save' button");
  }
  saveButton.click();
}

async function setReasonsForServicesEcounterCodeToNotApplicable(
  encounterType: EncounterType
) {
  const reasonsForServicesEcounterCodeLink =
    patientFrameDocument.querySelector<HTMLAnchorElement>(
      cssSelectors[encounterType].reasonsForServicesEcounterCodeLink
    );
  if (
    !reasonsForServicesEcounterCodeLink ||
    !reasonsForServicesEcounterCodeLink.innerText.includes("Encounter Code")
  )
    throw new Error("Could not find Encounter Code link");

  reasonsForServicesEcounterCodeLink.scrollIntoView({ behavior: "smooth" });
  await sleep();
  reasonsForServicesEcounterCodeLink.click();

  // Make sure modal is open

  await sleep();

  const modal =
    patientFrameDocument.querySelector<HTMLElement>("div[role=dialog]");
  if (!modal) throw new Error("Encounter Code modal not found");

  const modalTitleText =
    modal.querySelector<HTMLElement>(".modal-title")?.innerText;
  if (!modalTitleText || !modalTitleText.includes("E/M Codes")) {
    throw new Error("Encounter Code modal not open");
  }

  // Select 'Not applicable" option

  const notApplicableOption = Array.from(modal.querySelectorAll("label")).find(
    (x) => x.innerText.includes("NOT APPLICABLE")
  );
  if (!notApplicableOption)
    throw new Error("Could not find NOT APPLICABLE option");

  notApplicableOption.click();

  await sleep();

  // Save

  const saveButton = Array.from(
    modal.querySelectorAll<HTMLButtonElement>(".modal-footer button")
  ).find((x) => x.innerText.includes("Save"));
  if (!saveButton) {
    throw new Error("Could not find 'Save' button");
  }

  saveButton.click();
}

function getPatientFrameDocument() {
  const doc = document
    .querySelector<HTMLIFrameElement>("iframe[aria-label=PncChart]")
    ?.contentWindow?.document?.querySelector<HTMLIFrameElement>(
      "iframe#patient-frame"
    )?.contentWindow?.document;

  if (!doc) {
    throw new Error("Could not find patient-frame");
  }

  return doc;
}

async function sleep(amountInMs = 1000) {
  await new Promise((resolve) => setTimeout(resolve, amountInMs));
}
