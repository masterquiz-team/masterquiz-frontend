import emptyRadio from "./question-radio.svg";
import nextArrow from "./next-arrow.svg";
import pause from "./pause.svg";
import selectedRadio from "./selected-radio.svg";
import selectedDot from "./selected-dot.svg";
import lightbulb from "./feedback-lightbulb.svg";
import globe from "./correct-globe.png";
import filledNextArrow from "./next-arrow-filled.svg";
import successBadge from "./correct-badge.svg";
import successCheck from "./correct-check.svg";
import correctRadio from "./answer-correct-radio.svg";
import correctBadge from "./answer-correct-badge.svg";
import incorrectRadio from "./answer-incorrect-radio.svg";
import incorrectCross from "./answer-incorrect-cross.svg";
import incorrectDot from "./answer-incorrect-dot.svg";
import optionCheck from "./answer-correct-check.svg";
import exitIllustration from "./exit-illustration.svg";
import close from "./dialog-close.svg";

export const assets = {
  pause,
  question: { radio: emptyRadio, nextArrow },
  selected: { radio: selectedRadio, dot: selectedDot },
  correct: {
    nextArrow: filledNextArrow,
    lightbulb,
    badge: successBadge,
    check: successCheck,
    globe,
  },
  wrong: {
    correctRadio,
    correctBadge,
    radio: incorrectRadio,
    cross: incorrectCross,
    dot: incorrectDot,
    check: optionCheck,
  },
  dialog: { illustration: exitIllustration, close },
};
