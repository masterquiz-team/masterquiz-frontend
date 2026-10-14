import emptyRadio from "./question-imgEllipse9.svg";
import nextArrow from "./question-imgArrow5.svg";
import pause from "./question-imgVector.svg";
import selectedRadio from "./selected-imgEllipse11.svg";
import selectedDot from "./selected-imgEllipse13.svg";
import lightbulb from "./correct-imgMdiLightbulbOn.svg";
import globe from "./correct-imgPenup202610111323311.png";
import filledNextArrow from "./correct-imgArrow5.svg";
import successBadge from "./correct-imgEllipse14.svg";
import successCheck from "./correct-imgVector.svg";
import correctRadio from "./wrong-imgEllipse11.svg";
import correctBadge from "./wrong-imgEllipse14.svg";
import incorrectRadio from "./wrong-imgEllipse10.svg";
import incorrectCross from "./wrong-imgWrong.svg";
import incorrectDot from "./wrong-imgEllipse13.svg";
import optionCheck from "./wrong-imgVector.svg";
import exitIllustration from "./dialog-imgGroup1.svg";
import close from "./dialog-imgX.svg";

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
