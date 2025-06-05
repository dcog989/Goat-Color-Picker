/** Goat Color Picker
 * @file GoatColorPicker.js
 * @description Arguably the best color picker of all time. Feature-rich and functional.
 * @author Chase McCougar
 * @license MIT
 * @requires GoatColorToolbox.js
 * @createdAt 2025-04-20
 * @lastModified 2025-06-04
 * @version 1.3.2
 */
document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Element References ---
    const colorInput = document.getElementById("colorInput");
    const sliders = {
        hue: document.getElementById("hue"),
        saturation: document.getElementById("saturation"),
        lightness: document.getElementById("lightness"),
        opacity: document.getElementById("opacity"),
    };
    const valueInputs = {
        hue: document.getElementById("hueValueInput"),
        saturation: document.getElementById("saturationValueInput"),
        lightness: document.getElementById("lightnessValueInput"),
        opacity: document.getElementById("opacityValueInput"),
    };
    const outputSpans = {
        hex: document.getElementById("goatHexOutput"),
        hsl: document.getElementById("goatHslOutput"),
        rgb: document.getElementById("goatRgbOutput"),
        oklch: document.getElementById("goatOklchOutput"),
    };
    const harmonySelect = document.getElementById("harmonySelect");
    const paletteSwatchesContainer = document.getElementById("paletteSwatches");
    const paintboxGrid = document.getElementById("paintboxGrid");
    const exportPaintboxBtn = document.getElementById("exportPaintboxBtn");
    const copyTheoryToPaintboxBtn = document.getElementById("copyTheoryToPaintboxBtn");
    const mainColorDraggable = document.getElementById("mainColorDraggable");
    const paintboxBin = document.getElementById("paintboxBin");
    const colorOutputContainer = document.getElementById("colorOutput");
    const BLOCK_LETTERS = document.querySelectorAll(".block-letter");

    // --- Constants ---
    /** @const {string} CSS class for a dragging element */
    const CSS_CLASS_DRAGGING = "dragging";
    /** @const {string} CSS class for an element being dragged over */
    const CSS_CLASS_DRAG_OVER = "drag-over";
    /** @const {string} CSS class for the paintbox bin when dragged over */
    const CSS_CLASS_DRAG_OVER_BIN = "drag-over-bin";
    /** @const {string} CSS class for main color targets when dragged over */
    const CSS_CLASS_DRAG_OVER_MAIN_TARGET = "drag-over-main-target";
    /** @const {string} CSS class for successful copy operations */
    const CSS_CLASS_COPIED_SUCCESS = "copied-success";
    /** @const {string} CSS class for failed copy operations */
    const CSS_CLASS_COPIED_FAIL = "copied-fail";
    /** @const {string} CSS class for flashing a red warning on buttons */
    const CSS_CLASS_FLASH_RED = "flash-red";
    /** @const {string} CSS class for an invalid input field */
    const CSS_CLASS_INPUT_INVALID = "input-invalid";
    /** @const {string} CSS class for the paintbox bin when pending clear */
    const CSS_CLASS_PENDING_CLEAR = "pending-clear";

    /** @const {number} Timeout duration for button feedback messages (ms) */
    const TIMEOUT_FEEDBACK_BTN = 2000;
    /** @const {number} Timeout duration for paintbox bin clear confirmation (ms) */
    const TIMEOUT_BIN_CLEAR_CONFIRM = 3000;

    /** @const {number} Number of rows in the paintbox grid */
    const PAINTBOX_ROWS = 4;
    /** @const {number} Number of columns in the paintbox grid */
    const PAINTBOX_COLS = 5;
    /** @const {number} Number of colors in a monochromatic palette */
    const MONOCHROMATIC_PALETTE_SIZE = 5;
    /** @const {number} WCAG contrast threshold for block letter text */
    const CONTRAST_THRESHOLD_BLOCK_LETTERS = 4.5;

    // --- Critical Element Check ---
    const criticalElements = [
        colorInput, sliders.hue, sliders.saturation, sliders.lightness, sliders.opacity,
        valueInputs.hue, valueInputs.saturation, valueInputs.lightness, valueInputs.opacity,
        outputSpans.hex, outputSpans.hsl, outputSpans.rgb, outputSpans.oklch,
        harmonySelect, paletteSwatchesContainer, paintboxGrid, exportPaintboxBtn,
        copyTheoryToPaintboxBtn, mainColorDraggable, paintboxBin, colorOutputContainer
    ];
    if (criticalElements.some((el) => !el)) {
        console.error("GoatColorPicker: Critical DOM element(s) missing. Picker may not function correctly. Aborting initialization.");
        const body = document.querySelector("body");
        if (body) {
            const errorDiv = document.createElement("div");
            errorDiv.textContent = "Error: Color Picker could not initialize due to missing page elements. Please check the console.";
            errorDiv.style.color = "red";
            errorDiv.style.padding = "20px";
            errorDiv.style.textAlign = "center";
            body.insertBefore(errorDiv, body.firstChild);
        }
        return;
    }

    // --- CSS Variable Derived Constants (for Opacity Slider Background) ---
    const CSS_VARS = getComputedStyle(document.documentElement);
    const OPACITY_SLIDER_CHECKERBOARD_COLOR1 = CSS_VARS.getPropertyValue("--checkerboard-slider-color1").trim();
    const OPACITY_SLIDER_CHECKERBOARD_COLOR2 = CSS_VARS.getPropertyValue("--checkerboard-slider-color2").trim();
    const OPACITY_SLIDER_CHECKERBOARD_SIZE = CSS_VARS.getPropertyValue("--checkerboard-slider-size").trim();
    const OPACITY_SLIDER_CHECKERBOARD_OFFSET = CSS_VARS.getPropertyValue("--checkerboard-slider-offset").trim();
    const OPACITY_SLIDER_BG_LAYERS = `repeating-linear-gradient(45deg, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1} 25%, transparent 25%, transparent 75%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1} 75%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1}), repeating-linear-gradient(45deg, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1} 25%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR2} 25%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR2} 75%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1} 75%, ${OPACITY_SLIDER_CHECKERBOARD_COLOR1})`;
    const OPACITY_SLIDER_BG_SIZE = `${OPACITY_SLIDER_CHECKERBOARD_SIZE} ${OPACITY_SLIDER_CHECKERBOARD_SIZE}, ${OPACITY_SLIDER_CHECKERBOARD_SIZE} ${OPACITY_SLIDER_CHECKERBOARD_SIZE}`;
    const OPACITY_SLIDER_BG_POS = `0 0, ${OPACITY_SLIDER_CHECKERBOARD_OFFSET} ${OPACITY_SLIDER_CHECKERBOARD_OFFSET}`;

    // --- Global State Variables ---
    /** @type {string} Original title of the paintbox bin element. */
    const originalBinTitle = paintboxBin.title;
    /** @type {Array<GoatColor.goatColor|null>} Stores colors in the paintbox. */
    let paintboxColors = Array(PAINTBOX_ROWS * PAINTBOX_COLS).fill(null);
    /** @type {Array<GoatColor.goatColor>} Cache for the currently generated color theory palette. */
    let theoryPaletteCache = [];
    /** @type {boolean} Flag to prevent slider input events from re-triggering updates during programmatic changes. */
    let preventSliderInputHandling = false;
    /** @type {GoatColor.goatColor|null} The current opaque base color derived from sliders. */
    let currentBaseOpaqueColor = null;
    /**
     * @typedef {object} DraggedItemState
     * @property {HTMLElement|null} element - The DOM element being dragged.
     * @property {GoatColor.goatColor|null} colorInstance - The GoatColor instance of the dragged color.
     * @property {("theory"|"paintbox"|"main"|"unknown")|null} sourceType - The source type of the dragged item.
     * @property {number} originalIndex - The original index if dragged from paintbox.
     */
    /** @type {DraggedItemState} State of the currently dragged item. */
    let draggedItem = { element: null, colorInstance: null, sourceType: null, originalIndex: -1 };
    /**
     * @typedef {object} BinClearState
     * @property {boolean} ready - True if the bin is armed for clearing (first click).
     * @property {number|null} timeoutId - ID of the timeout for disarming the bin.
     * @property {HTMLElement|null} notificationElement - DOM element for the bin notification.
     */
    /** @type {BinClearState} State for the paintbox bin clearing mechanism. */
    let binClearState = { ready: false, timeoutId: null, notificationElement: null };
    /** @type {string} Preferred format for displaying color in the main input field. */
    let preferredInputFormat = "hsl";
    /** @type {string} Stores the last user-typed value in the color input field. */
    let lastUserInputValue = "";
    /** @type {GoatColor.goatColor|null} The active GoatColor instance reflecting the current UI state. */
    let currentGoatColorInstanceForInput = null;


    // --- UI Update Functions ---

    /**
     * Updates the UI of the draggable main color indicator.
     * @param {GoatColor.goatColor|null} goatColorInstance The color instance to display.
     */
    function updateMainColorDraggableUI(goatColorInstance) {
        if (goatColorInstance && goatColorInstance.isValid()) {
            const hexaColor = goatColorInstance.toHexa();
            mainColorDraggable.style.backgroundColor = hexaColor;
            mainColorDraggable.dataset.color = hexaColor;
        } else {
            mainColorDraggable.style.backgroundColor = "var(--bg-swatch-empty)";
            mainColorDraggable.dataset.color = "";
        }
    }

    /**
     * Updates CSS custom properties used for animations based on the current opaque base color.
     * @param {GoatColor.goatColor|null} opaqueGoatColorInstance The opaque base color.
     * @param {number} actualHueFromSlider The current hue value from the hue slider.
     */
    function updateCssAnimationBaseColorsUI(opaqueGoatColorInstance, actualHueFromSlider) {
        const baseHsl = opaqueGoatColorInstance && opaqueGoatColorInstance.isValid()
            ? opaqueGoatColorInstance.toHsl()
            : { h: actualHueFromSlider, s: 70, l: 60 };

        let hueForCssVars;
        const roundedS = Math.round(baseHsl.s);
        const roundedL = Math.round(baseHsl.l);

        if (roundedS === 0 || roundedL === 0 || roundedL === 100) {
            hueForCssVars = actualHueFromSlider;
        } else {
            hueForCssVars = Math.round(baseHsl.h);
        }

        if (typeof hueForCssVars === 'undefined' || isNaN(hueForCssVars)) {
            hueForCssVars = Math.round(baseHsl.h);
        }

        document.documentElement.style.setProperty("--animation-base-hue", `${hueForCssVars}deg`);
        document.documentElement.style.setProperty("--animation-base-saturation", `${roundedS}%`);
        document.documentElement.style.setProperty("--animation-base-lightness", `${roundedL}%`);
    }

    /**
     * Updates the background gradients of the HSL sliders and the opacity slider.
     * @param {number} h Hue value (0-360).
     * @param {number} s Saturation value (0-100).
     * @param {number} l Lightness value (0-100).
     * @param {GoatColor.goatColor|null} opaqueGoatColorInstance The current opaque base color for the opacity slider.
     */
    function updateSliderVisualsUI(h, s, l, opaqueGoatColorInstance) {
        sliders.lightness.style.backgroundImage = `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
        sliders.saturation.style.backgroundImage = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;

        if (opaqueGoatColorInstance && opaqueGoatColorInstance.isValid()) {
            const rgb = opaqueGoatColorInstance.toRgb();
            sliders.opacity.style.backgroundImage = `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1)), ${OPACITY_SLIDER_BG_LAYERS}`;
            sliders.opacity.style.backgroundClip = `content-box, border-box, border-box`;
            sliders.opacity.style.backgroundOrigin = `border-box, border-box, border-box`;
            sliders.opacity.style.backgroundRepeat = `no-repeat, repeat, repeat`;
            sliders.opacity.style.backgroundPosition = `center center, ${OPACITY_SLIDER_BG_POS}`;
            sliders.opacity.style.backgroundSize = `100% 100%, ${OPACITY_SLIDER_BG_SIZE}`;
        } else {
            sliders.opacity.style.backgroundImage = OPACITY_SLIDER_BG_LAYERS;
            sliders.opacity.style.backgroundClip = `border-box, border-box`;
            sliders.opacity.style.backgroundOrigin = "border-box, border-box";
            sliders.opacity.style.backgroundRepeat = "repeat, repeat";
            sliders.opacity.style.backgroundPosition = OPACITY_SLIDER_BG_POS;
            sliders.opacity.style.backgroundSize = OPACITY_SLIDER_BG_SIZE;
        }
    }

    /**
     * Updates the text content of the color output format spans (Hex, HSL, RGB, OKLCH).
     * @param {GoatColor.goatColor|null} goatColorInstance The color instance to display.
     */
    function updateColorOutputSpansUI(goatColorInstance) {
        const colorToDisplay = goatColorInstance || GoatColor(null); // Ensure a GoatColor instance
        const errorMsg = colorToDisplay.error || "Invalid";

        if (!colorToDisplay.isValid()) {
            outputSpans.hex.textContent = errorMsg;
            outputSpans.hsl.textContent = errorMsg;
            outputSpans.rgb.textContent = errorMsg;
            outputSpans.oklch.textContent = errorMsg;
            return;
        }

        let hexOutputValue = colorToDisplay.toHexaShort();
        if (!hexOutputValue) {
            hexOutputValue = colorToDisplay.a < 1 ? colorToDisplay.toHexa() : colorToDisplay.toHexShort() || colorToDisplay.toHex();
        }
        outputSpans.hex.textContent = hexOutputValue;
        outputSpans.hsl.textContent = colorToDisplay.toHslaString();
        outputSpans.rgb.textContent = colorToDisplay.toRgbaString();
        outputSpans.oklch.textContent = colorToDisplay.toOklchaString();
    }

    /**
     * Updates the main color input field's value and validation state.
     * Manages cursor position to avoid disruption during programmatic updates.
     * @param {GoatColor.goatColor|null} activeColorInstance The current active color.
     * @param {boolean} fromUserInputFlag True if the update is a direct result of user typing in the input.
     */
    function updateColorInputFieldUI(activeColorInstance, fromUserInputFlag) {
        if (fromUserInputFlag) {
            const currentTextInInput = colorInput.value.trim();
            const isCurrentTextValid = GoatColor(currentTextInInput).isValid();
            if (isCurrentTextValid) {
                const formatOfCurrentText = determineFormatFromString(currentTextInInput);
                if (formatOfCurrentText === "hex") { // Don't reformat if user is actively typing valid hex
                    if (colorInput.classList.contains(CSS_CLASS_INPUT_INVALID)) {
                        colorInput.classList.remove(CSS_CLASS_INPUT_INVALID);
                        colorInput.removeAttribute("aria-invalid");
                    }
                    return;
                }
            }
        }

        if (!activeColorInstance || !activeColorInstance.isValid()) {
            if (!fromUserInputFlag && document.activeElement !== colorInput) { // Only clear if not focused and not due to direct user input causing invalidity
                colorInput.value = "";
            }
            return;
        }

        let displayString = formatColorForInput(activeColorInstance, preferredInputFormat);

        if (colorInput.value.trim().toLowerCase() === displayString.trim().toLowerCase() && !colorInput.classList.contains(CSS_CLASS_INPUT_INVALID)) {
            return; // Avoid unnecessary updates
        }

        const { selectionStart, selectionEnd, selectionDirection } = colorInput;
        const oldLength = colorInput.value.length;

        colorInput.value = displayString;
        if (colorInput.classList.contains(CSS_CLASS_INPUT_INVALID)) {
            colorInput.classList.remove(CSS_CLASS_INPUT_INVALID);
            colorInput.removeAttribute("aria-invalid");
        }

        if (document.activeElement === colorInput) { // Preserve cursor position if input is focused
            if (!fromUserInputFlag || displayString.length !== oldLength) {
                try {
                    let newCursorPos = (displayString.length !== oldLength) ? displayString.length : selectionStart;
                    newCursorPos = Math.min(newCursorPos, displayString.length);
                    colorInput.setSelectionRange(newCursorPos, newCursorPos, selectionDirection);
                } catch (e) { /* Silently ignore selection errors */ }
            }
        }
    }

    /**
     * Updates the CSS custom properties for slider thumb styles based on the base color.
     * @param {GoatColor.goatColor|null} baseOpaqueColor The current opaque base color.
     * @param {number} actualHueFromSlider The current hue value from the hue slider.
     */
    function updateSliderThumbStylesUI(baseOpaqueColor, actualHueFromSlider) {
        const defaultCssBorder = CSS_VARS.getPropertyValue("--border-color-thumb").trim();
        const defaultCssBg = CSS_VARS.getPropertyValue("--bg-slider-thumb").trim();

        if (baseOpaqueColor && baseOpaqueColor.isValid()) {
            const thumbBgColor = baseOpaqueColor;
            document.documentElement.style.setProperty('--slider-thumb-bg-color', thumbBgColor.toRgbaString());

            const hslBg = thumbBgColor.toHsl();

            let hueForBorder;
            if (Math.round(hslBg.s) === 0) {
                hueForBorder = actualHueFromSlider;
            } else {
                hueForBorder = Math.round(hslBg.h);
            }

            if (typeof hueForBorder === 'undefined' || isNaN(hueForBorder)) {
                hueForBorder = Math.round(hslBg.h);
            }

            const s_dark_val = 85, l_dark_val = 30;
            const s_light_val = 85, l_light_val = 70;

            const darkBorderCandidateString = `hsl(${hueForBorder}, ${s_dark_val}%, ${l_dark_val}%)`;
            const lightBorderCandidateString = `hsl(${hueForBorder}, ${s_light_val}%, ${l_light_val}%)`;
            const darkBorderCandidate = GoatColor(darkBorderCandidateString);
            const lightBorderCandidate = GoatColor(lightBorderCandidateString);

            let chosenBorderColorString = defaultCssBorder;
            const CONTRAST_THRESHOLD = 1.4;

            if (typeof GoatColor.getContrastRatio !== 'function' || !darkBorderCandidate.isValid() || !lightBorderCandidate.isValid()) {
                document.documentElement.style.setProperty('--slider-thumb-border-color', defaultCssBorder);
                return;
            }

            const contrastWithDark = GoatColor.getContrastRatio(darkBorderCandidate, thumbBgColor);
            const contrastWithLight = GoatColor.getContrastRatio(lightBorderCandidate, thumbBgColor);

            let primaryChoice, secondaryChoice, primaryContrast, secondaryContrast;
            if (hslBg.l > 50) {
                primaryChoice = darkBorderCandidate; primaryContrast = contrastWithDark;
                secondaryChoice = lightBorderCandidate; secondaryContrast = contrastWithLight;
            } else {
                primaryChoice = lightBorderCandidate; primaryContrast = contrastWithLight;
                secondaryChoice = darkBorderCandidate; secondaryContrast = contrastWithDark;
            }

            if (primaryContrast >= CONTRAST_THRESHOLD) {
                chosenBorderColorString = primaryChoice.toRgbaString();
            } else if (secondaryContrast >= CONTRAST_THRESHOLD) {
                chosenBorderColorString = secondaryChoice.toRgbaString();
            } else {
                chosenBorderColorString = (primaryContrast >= secondaryContrast) ? primaryChoice.toRgbaString() : secondaryChoice.toRgbaString();
            }
            document.documentElement.style.setProperty('--slider-thumb-border-color', chosenBorderColorString);
        } else {
            document.documentElement.style.setProperty('--slider-thumb-bg-color', defaultCssBg);
            document.documentElement.style.setProperty('--slider-thumb-border-color', defaultCssBorder);
        }
    }

    /**
     * Updates the text color of block letter elements for optimal contrast against their backgrounds.
     * @param {number} actualHueFromSlider The current hue value from the hue slider.
     */
    function updateBlockLetterTextColors(actualHueFromSlider) {
        if (BLOCK_LETTERS.length === 0 || !GoatColor || !GoatColor.getContrastRatio) return;

        const baseHsl = (currentBaseOpaqueColor && currentBaseOpaqueColor.isValid())
            ? currentBaseOpaqueColor.toHsl()
            : { h: actualHueFromSlider, s: 0, l: 50 };

        let hueForTextColors;
        if (Math.round(baseHsl.s) === 0) {
            hueForTextColors = actualHueFromSlider;
        } else {
            hueForTextColors = Math.round(baseHsl.h);
        }
        if (typeof hueForTextColors === 'undefined' || isNaN(hueForTextColors)) {
            hueForTextColors = Math.round(baseHsl.h);
        }


        const lightText = GoatColor(`hsl(${hueForTextColors}, 80%, 80%)`);
        const darkText = GoatColor(`hsl(${hueForTextColors}, 80%, 20%)`);

        if (!lightText.isValid() || !darkText.isValid()) {
            BLOCK_LETTERS.forEach(l => (l.style.color = "var(--text-dark)"));
            return;
        }

        const bodyBgRaw = GoatColor(document.body.style.backgroundColor || getComputedStyle(document.body).backgroundColor || "white");
        const opaqueBodyBg = bodyBgRaw.flatten("white");

        BLOCK_LETTERS.forEach(letter => {
            const letterBgRaw = GoatColor(getComputedStyle(letter).backgroundColor);
            const effectiveLetterOpaqueBg = letterBgRaw.flatten(opaqueBodyBg);

            const contrastDark = GoatColor.getContrastRatio(darkText, effectiveLetterOpaqueBg);
            const contrastLight = GoatColor.getContrastRatio(lightText, effectiveLetterOpaqueBg);

            if (contrastLight >= CONTRAST_THRESHOLD_BLOCK_LETTERS && contrastLight >= contrastDark) {
                letter.style.color = lightText.toHslString();
            } else if (contrastDark >= CONTRAST_THRESHOLD_BLOCK_LETTERS) {
                letter.style.color = darkText.toHslString();
            } else {
                letter.style.color = (contrastLight > contrastDark) ? lightText.toHslString() : darkText.toHslString();
            }
        });
    }

    // --- Utility & Helper Functions ---

    /**
     * Determines the likely color format from a given string.
     * @param {string} str The color string.
     * @returns {"rgb"|"hsl"|"oklch"|"hex"|"named"|"unknown"} The determined format.
     */
    function determineFormatFromString(str) {
        const s = str.toLowerCase().trim();
        if (s.startsWith("rgb")) return "rgb";
        if (s.startsWith("hsl")) return "hsl";
        if (s.startsWith("oklch")) return "oklch";
        if (s.startsWith("#") || (s.startsWith("0x") && s.length > 2)) return "hex"; // "0x" for legacy numeric hex
        if (GoatColor.cssNamedColors && GoatColor.cssNamedColors.hasOwnProperty(s)) return "named";
        return "unknown";
    }

    /**
     * Formats a GoatColor instance into a string suitable for the color input field, based on a format hint.
     * @param {GoatColor.goatColor|null} goatColor The color instance.
     * @param {"rgb"|"hsl"|"oklch"|"hex"|"named"|"unknown"} formatHint The preferred format.
     * @returns {string} The formatted color string, or an empty string if invalid.
     */
    function formatColorForInput(goatColor, formatHint) {
        if (!goatColor || !goatColor.isValid()) return "";
        switch (formatHint) {
            case "rgb": return goatColor.toRgbaString();
            case "hsl": return goatColor.toHslaString();
            case "hex":
                let hexOutput = goatColor.toHexaShort(); // Prefer short hex if possible
                if (!hexOutput) { // Fallback to longer forms
                    hexOutput = goatColor.a < 1 ? goatColor.toHexa() : goatColor.toHexShort() || goatColor.toHex();
                }
                return hexOutput;
            case "oklch": return goatColor.toOklchaString();
            case "named": // Fallback for named, as we don't store the original name
            default:    // Default to HSL if unknown or if named doesn't have a direct reverse mapping
                return goatColor.toHslaString();
        }
    }

    /**
     * Provides visual feedback on a button after an async action (e.g., copy to clipboard).
     * @param {HTMLElement} button The button element.
     * @param {{text?: string, title: string}} successConfig Config for success state (optional text, required title).
     * @param {{text?: string, title: string}} failureConfig Config for failure state (optional text, required title).
     * @param {Promise<any>} actionPromise The promise representing the action.
     */
    function provideButtonFeedback(button, successConfig, failureConfig, actionPromise) {
        const originalInnerHTML = button.innerHTML;
        const originalTitle = button.title;
        const initialText = button.querySelector('span.visually-hidden') ? null : button.textContent?.trim(); // Avoid changing if only icon + sr-text

        actionPromise
            .then(() => {
                if (successConfig.text && initialText) button.textContent = successConfig.text;
                button.title = successConfig.title;
                button.classList.add(CSS_CLASS_COPIED_SUCCESS);
                button.classList.remove(CSS_CLASS_COPIED_FAIL, CSS_CLASS_FLASH_RED);
            })
            .catch((err) => {
                console.error("Button action failed:", err);
                if (failureConfig.text && initialText) button.textContent = failureConfig.text;
                button.title = failureConfig.title;
                button.classList.add(CSS_CLASS_COPIED_FAIL, CSS_CLASS_FLASH_RED);
                button.classList.remove(CSS_CLASS_COPIED_SUCCESS);
            })
            .finally(() => {
                setTimeout(() => {
                    button.innerHTML = originalInnerHTML; // Restore original content (icon + text)
                    button.title = originalTitle;
                    button.classList.remove(CSS_CLASS_COPIED_SUCCESS, CSS_CLASS_COPIED_FAIL, CSS_CLASS_FLASH_RED);
                }, TIMEOUT_FEEDBACK_BTN);
            });
    }

    /**
     * Shows a temporary notification message near the paintbox bin.
     * @param {string} message The message to display.
     * @param {HTMLElement} targetElement The element to position the notification near.
     */
    function showBinNotification(message, targetElement) {
        if (binClearState.notificationElement) binClearState.notificationElement.remove(); // Remove previous

        binClearState.notificationElement = document.createElement("div");
        binClearState.notificationElement.className = "bin-click-notification";
        binClearState.notificationElement.textContent = message;
        document.body.appendChild(binClearState.notificationElement);

        const rect = targetElement.getBoundingClientRect();
        binClearState.notificationElement.style.top = `${rect.bottom + window.scrollY + 8}px`; // 8px below
        binClearState.notificationElement.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`; // Centered horizontally
    }

    /** Hides the paintbox bin notification if it's visible. */
    function hideBinNotification() {
        if (binClearState.notificationElement) {
            binClearState.notificationElement.remove();
            binClearState.notificationElement = null;
        }
    }

    // --- Core Application Logic ---

    /**
     * Refreshes all UI elements based on the current HSL slider values.
     * This is a central function for UI updates.
     * @param {boolean} [isFromColorInputEvent=false] True if triggered by the main color input field.
     */
    function refreshAllUI(isFromColorInputEvent = false) {
        const h = parseInt(sliders.hue.value, 10);
        const s = parseInt(sliders.saturation.value, 10);
        const l = parseInt(sliders.lightness.value, 10);
        const aPerc = parseInt(sliders.opacity.value, 10);

        currentGoatColorInstanceForInput = GoatColor(`hsla(${h}, ${s}%, ${l}%, ${aPerc / 100})`);
        const isValidColor = currentGoatColorInstanceForInput && currentGoatColorInstanceForInput.isValid();

        if (isValidColor) {
            currentBaseOpaqueColor = GoatColor(currentGoatColorInstanceForInput.toHex());
            document.body.style.backgroundColor = currentGoatColorInstanceForInput.toRgbaString();

            updateCssAnimationBaseColorsUI(currentBaseOpaqueColor, h);
            updateMainColorDraggableUI(currentGoatColorInstanceForInput);
            updateSliderVisualsUI(h, s, l, currentBaseOpaqueColor);
            updateColorOutputSpansUI(currentGoatColorInstanceForInput);
            updateColorInputFieldUI(currentGoatColorInstanceForInput, isFromColorInputEvent);
            updateBlockLetterTextColors(h);

            if (!isFromColorInputEvent && colorInput.classList.contains(CSS_CLASS_INPUT_INVALID)) {
                colorInput.classList.remove(CSS_CLASS_INPUT_INVALID);
                colorInput.removeAttribute("aria-invalid");
            }
        } else {
            currentBaseOpaqueColor = GoatColor("#555555");
            document.body.style.backgroundColor = "transparent";

            updateCssAnimationBaseColorsUI(currentBaseOpaqueColor, h);
            updateMainColorDraggableUI(null);
            updateSliderVisualsUI(h, s, l, null);
            updateColorOutputSpansUI(null);
            updateColorInputFieldUI(null, isFromColorInputEvent);
            updateBlockLetterTextColors(h);


            if (colorInput.value.trim() !== "" || !isFromColorInputEvent) {
                colorInput.classList.add(CSS_CLASS_INPUT_INVALID);
                colorInput.setAttribute("aria-invalid", "true");
            }
        }
        updateSliderThumbStylesUI(currentBaseOpaqueColor, h);

        if (harmonySelect.value && isValidColor) {
            generateAndDisplayPalette();
        } else if (harmonySelect.value && !isValidColor) {
            paletteSwatchesContainer.innerHTML = '<p class="palette-message">Invalid base color.</p>';
            copyTheoryToPaintboxBtn.disabled = true;
        } else {
            paletteSwatchesContainer.innerHTML = "";
            copyTheoryToPaintboxBtn.disabled = true;
        }
        exportPaintboxBtn.disabled = !paintboxColors.some((c) => c && c.isValid());
    }

    /**
     * Sets the color state (HSL sliders, input values) and triggers a UI refresh.
     * @param {number} h Hue (0-360).
     * @param {number} s Saturation (0-100).
     * @param {number} l Lightness (0-100).
     * @param {number} aPercent Alpha (0-100).
     * @param {boolean} [isFromColorInputEvent=false] If triggered by main color input.
     * @param {string|null} [newPreferredFormat=null] New preferred format for the input field (e.g., "hex", "hsl").
     */
    function setColorStateAndRefresh(h, s, l, aPercent, isFromColorInputEvent = false, newPreferredFormat = null) {
        if (newPreferredFormat && newPreferredFormat !== "named" && newPreferredFormat !== "unknown") {
            preferredInputFormat = newPreferredFormat;
        } else if (newPreferredFormat === "named") { // "named" isn't stored, so default to HSL for display
            preferredInputFormat = "hsl";
        }

        preventSliderInputHandling = true; // Prevent slider 'input' events from re-triggering updates

        const roundedH = Math.round(h);
        const roundedS = Math.round(s);
        const roundedL = Math.round(l);
        const roundedAPerc = Math.round(aPercent);

        sliders.hue.value = roundedH; valueInputs.hue.value = roundedH;
        sliders.saturation.value = roundedS; valueInputs.saturation.value = roundedS;
        sliders.lightness.value = roundedL; valueInputs.lightness.value = roundedL;
        sliders.opacity.value = roundedAPerc; valueInputs.opacity.value = roundedAPerc;

        preventSliderInputHandling = false;
        refreshAllUI(isFromColorInputEvent);
    }

    /** Generates and displays the color theory palette based on the current base color and selected harmony. */
    function generateAndDisplayPalette() {
        theoryPaletteCache = []; // Clear previous cache
        const harmonyType = harmonySelect.value;

        if (!harmonyType) { // No harmony selected
            paletteSwatchesContainer.innerHTML = "";
            copyTheoryToPaintboxBtn.disabled = true;
            return;
        }

        const baseColor = GoatColor(`hsl(${sliders.hue.value} ${sliders.saturation.value}% ${sliders.lightness.value}%)`);
        if (!baseColor.isValid()) {
            paletteSwatchesContainer.innerHTML = '<p class="palette-message">Select a valid base color.</p>';
            copyTheoryToPaintboxBtn.disabled = true;
            return;
        }

        const currentAlpha = parseInt(sliders.opacity.value, 10) / 100;
        let tempPalette = [];

        switch (harmonyType) {
            case "monochromatic": tempPalette = baseColor.getMonochromaticPalette(MONOCHROMATIC_PALETTE_SIZE); break;
            case "analogous": tempPalette = baseColor.getAnalogousPalette(); break;
            case "complementary": tempPalette = baseColor.getComplementaryPalette(); break;
            case "split-complementary": tempPalette = baseColor.getSplitComplementaryPalette(); break;
            case "triadic": tempPalette = baseColor.getTriadicPalette(); break;
            case "tetradic": tempPalette = baseColor.getTetradicPalette(); break;
            default: tempPalette = []; // Should not happen with a select element
        }

        // Apply current global alpha to all palette colors
        theoryPaletteCache = tempPalette.map((c) => {
            const hsla = c.toHsla();
            return GoatColor(`hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${currentAlpha})`);
        });

        paletteSwatchesContainer.innerHTML = ""; // Clear previous swatches
        if (theoryPaletteCache.length > 0) {
            theoryPaletteCache.forEach((c) => paletteSwatchesContainer.appendChild(createSwatchElement(c, "swatch")));
        } else {
            paletteSwatchesContainer.innerHTML = '<p class="palette-message">No palette generated.</p>';
        }
        copyTheoryToPaintboxBtn.disabled = theoryPaletteCache.length === 0;
    }

    /** Initializes or re-initializes the paintbox grid with empty swatches. */
    function initializePaintbox() {
        paintboxGrid.innerHTML = ""; // Clear existing swatches
        paintboxColors = Array(PAINTBOX_ROWS * PAINTBOX_COLS).fill(null);
        for (let i = 0; i < PAINTBOX_ROWS * PAINTBOX_COLS; i++) {
            paintboxGrid.appendChild(createSwatchElement(null, "paintbox-swatch", true, i));
        }
        exportPaintboxBtn.disabled = true; // Initially disabled as it's empty
    }

    /**
     * Updates a specific paintbox swatch UI and its corresponding entry in `paintboxColors`.
     * @param {HTMLElement} swatchElement The swatch DOM element to update.
     * @param {GoatColor.goatColor|null} goatColorInstance The new color for the swatch.
     */
    function updatePaintboxSwatchUI(swatchElement, goatColorInstance) {
        const index = parseInt(swatchElement.dataset.index, 10);
        paintboxColors[index] = (goatColorInstance && goatColorInstance.isValid()) ? goatColorInstance : null;

        if (goatColorInstance && goatColorInstance.isValid()) {
            const hex = goatColorInstance.toHex(); // Opaque hex for display text
            const hexa = goatColorInstance.toHexa(); // Full HexA for background and data
            swatchElement.style.backgroundColor = hexa;
            swatchElement.title = `Drag. Click to select.\n${hexa}`;
            swatchElement.textContent = hex.substring(1).toUpperCase();
            swatchElement.dataset.color = hexa;
            swatchElement.dataset.format = determineFormatFromString(hexa);
        } else { // Empty swatch
            swatchElement.style.backgroundColor = "var(--bg-swatch-empty)";
            swatchElement.title = "Empty";
            swatchElement.textContent = "";
            swatchElement.dataset.color = "";
            swatchElement.dataset.format = "unknown";
        }
        exportPaintboxBtn.disabled = !paintboxColors.some((c) => c && c.isValid());
    }

    /** Exports paintbox colors as CSS custom properties to the clipboard. */
    function exportPaintboxColors() {
        let cssVars = ":root {\n";
        let hasColors = false;
        paintboxColors.forEach((color, index) => {
            if (color && color.isValid()) {
                const outputString = formatColorForInput(color, preferredInputFormat) || color.toHexa(); // Fallback
                cssVars += `  --paintbox-color-${String(index + 1).padStart(2, "0")}: ${outputString};\n`;
                hasColors = true;
            }
        });
        cssVars += "}";

        if (!hasColors) {
            provideButtonFeedback(exportPaintboxBtn, {}, { text: "Empty!", title: "Paintbox is empty." }, Promise.reject("Paintbox empty"));
            return;
        }
        provideButtonFeedback(
            exportPaintboxBtn,
            { text: "Copied!", title: "CSS Variables Copied!" },
            { text: "Failed!", title: "Failed to copy." },
            navigator.clipboard.writeText(cssVars)
        );
    }

    // --- Drag and Drop Logic ---

    /** Resets the global drag state and clears any visual drag cues from elements. */
    function resetDragState() {
        if (draggedItem.element) {
            draggedItem.element.classList.remove(CSS_CLASS_DRAGGING);
        }
        draggedItem = { element: null, colorInstance: null, sourceType: null, originalIndex: -1 };
        // Clear all drag-over classes from any element that might have them
        document.querySelectorAll(`.${CSS_CLASS_DRAG_OVER}, .${CSS_CLASS_DRAG_OVER_BIN}, .${CSS_CLASS_DRAG_OVER_MAIN_TARGET}`)
            .forEach(el => el.classList.remove(CSS_CLASS_DRAG_OVER, CSS_CLASS_DRAG_OVER_BIN, CSS_CLASS_DRAG_OVER_MAIN_TARGET));
    }

    /**
     * Attaches drag event listeners to a swatch element (dragstart, dragend).
     * @param {HTMLElement} swatch The swatch element.
     */
    function _addDragListenersToSwatch(swatch) {
        swatch.addEventListener("dragstart", (e) => {
            draggedItem.element = e.currentTarget;
            draggedItem.element.classList.add(CSS_CLASS_DRAGGING);

            const colorStringFromDataset = e.currentTarget.dataset.color;
            draggedItem.colorInstance = colorStringFromDataset ? GoatColor(colorStringFromDataset) : null;

            draggedItem.sourceType = e.currentTarget.closest("#paletteSwatches") ? "theory"
                : e.currentTarget.closest("#paintboxGrid") ? "paintbox"
                    : e.currentTarget === mainColorDraggable ? "main"
                        : "unknown";
            draggedItem.originalIndex = (draggedItem.sourceType === "paintbox" && e.currentTarget.dataset.index)
                ? parseInt(e.currentTarget.dataset.index, 10) : -1;

            // Set allowed effects based on source
            if (draggedItem.sourceType === "paintbox") {
                e.dataTransfer.effectAllowed = "copyMove"; // Paintbox items can be copied or moved
            } else if (draggedItem.sourceType === "theory" || draggedItem.sourceType === "main") {
                e.dataTransfer.effectAllowed = "copy"; // Theory and main color are always copied
            } else {
                e.dataTransfer.effectAllowed = "none"; // Should not happen
            }

            try {
                e.dataTransfer.setData("text/plain", colorStringFromDataset || "empty");
            } catch (err) {
                console.error("Error setting drag data:", err);
            }
        });
        swatch.addEventListener("dragend", resetDragState);
    }

    /**
     * Attaches click event listener to a swatch element to set it as the main color.
     * @param {HTMLElement} swatch The swatch element.
     */
    function _addClickListenerToSwatch(swatch) {
        swatch.addEventListener("click", (e) => {
            const colorString = e.currentTarget.dataset.color;
            if (!colorString) return; // Empty swatch

            const clickedGC = GoatColor(colorString);
            if (!clickedGC.isValid()) {
                console.warn("Invalid swatch data clicked:", colorString);
                return;
            }
            const format = e.currentTarget.dataset.format || determineFormatFromString(colorString);
            const hsla = clickedGC.toHsla();
            setColorStateAndRefresh(hsla.h, hsla.s, hsla.l, hsla.a * 100, false, format);
        });
    }

    /**
     * Attaches drop-related event listeners to a paintbox swatch element.
     * @param {HTMLElement} swatch The paintbox swatch element.
     */
    function _addDropListenersToPaintboxSwatch(swatch) {
        swatch.addEventListener("dragover", (e) => {
            e.preventDefault(); // Allow drop
            // Determine drop effect based on source
            e.dataTransfer.dropEffect = (draggedItem.sourceType === "theory" || draggedItem.sourceType === "main") ? "copy" : "move";
            e.currentTarget.classList.add(CSS_CLASS_DRAG_OVER);
        });
        swatch.addEventListener("dragenter", (e) => {
            e.preventDefault(); // Necessary for drop to work
            e.currentTarget.classList.add(CSS_CLASS_DRAG_OVER);
        });
        swatch.addEventListener("dragleave", (e) => {
            e.currentTarget.classList.remove(CSS_CLASS_DRAG_OVER);
        });
        swatch.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling
            const targetSwatchElement = e.currentTarget;
            targetSwatchElement.classList.remove(CSS_CLASS_DRAG_OVER);

            const targetIndex = parseInt(targetSwatchElement.dataset.index, 10);
            const colorAtTargetBeforeDrop = paintboxColors[targetIndex]; // Store color being replaced (if any)
            const draggedColor = draggedItem.colorInstance; // Color being dropped

            updatePaintboxSwatchUI(targetSwatchElement, draggedColor); // Update target with new color

            // If dragging from paintbox to another paintbox slot (move operation), swap colors
            if (draggedItem.sourceType === "paintbox" && draggedItem.originalIndex !== -1 && draggedItem.originalIndex !== targetIndex) {
                const originalSwatchElement = paintboxGrid.children[draggedItem.originalIndex];
                if (originalSwatchElement) {
                    updatePaintboxSwatchUI(originalSwatchElement, colorAtTargetBeforeDrop); // Place target's old color in source's old slot
                }
            }
            resetDragState();
        });
    }

    /**
     * Creates a swatch div element with appropriate styles, data, and event listeners.
     * @param {GoatColor.goatColor|null} colorInstance The color for the swatch.
     * @param {string} [className="swatch"] CSS class for the swatch.
     * @param {boolean} [isPaintboxSwatch=false] True if this swatch is part of the paintbox.
     * @param {number} [index=-1] The index if it's a paintbox swatch.
     * @returns {HTMLElement} The created swatch element.
     */
    function createSwatchElement(colorInstance, className = "swatch", isPaintboxSwatch = false, index = -1) {
        const swatch = document.createElement("div");
        swatch.className = className;
        swatch.draggable = true;
        if (index !== -1) swatch.dataset.index = index;

        const currentGC = (colorInstance && colorInstance.isValid()) ? colorInstance : null;

        if (currentGC) {
            const hex = currentGC.toHex();
            const hexa = currentGC.toHexa();
            swatch.style.backgroundColor = hexa;
            swatch.title = `Click to select. Drag.\n${hexa}`;
            swatch.textContent = hex.substring(1).toUpperCase(); // Display opaque hex for readability
            swatch.dataset.color = hexa; // Store full HexA for state
            swatch.dataset.format = determineFormatFromString(hexa);
        } else { // Empty swatch
            swatch.style.backgroundColor = "var(--bg-swatch-empty)";
            swatch.title = "Empty";
            swatch.dataset.color = "";
            swatch.dataset.format = "unknown";
        }

        _addDragListenersToSwatch(swatch);
        _addClickListenerToSwatch(swatch);
        if (isPaintboxSwatch) {
            _addDropListenersToPaintboxSwatch(swatch);
        }
        return swatch;
    }

    /**
     * Handles drag actions (over, enter, leave, drop) for the main color target areas (input field, draggable swatch).
     * @param {DragEvent} e The drag event.
     * @param {"over"|"enter"|"leave"|"drop"} action The type of drag action.
     */
    function mainTargetDragAction(e, action) {
        e.preventDefault(); // Crucial for 'dragover' to allow 'drop'
        const targetClass = CSS_CLASS_DRAG_OVER_MAIN_TARGET;

        if (action === "over" || action === "enter") {
            e.dataTransfer.dropEffect = "copy"; // Main target always copies
            e.currentTarget.classList.add(targetClass);
        } else if (action === "leave") {
            // Only remove class if leaving the element itself, not just moving to a child
            if (!e.currentTarget.contains(e.relatedTarget)) {
                e.currentTarget.classList.remove(targetClass);
            }
        } else if (action === "drop") {
            e.stopPropagation(); // Prevent event from bubbling
            e.currentTarget.classList.remove(targetClass);

            let colorToApply = null;
            let sourceColorString = null; // String used for format hinting

            // Prioritize color string from the dragged element's dataset
            if (draggedItem.element && draggedItem.element.dataset && typeof draggedItem.element.dataset.color === 'string') {
                sourceColorString = draggedItem.element.dataset.color;
            }
            // Fallback to dataTransfer if dataset string is missing/empty
            if (!sourceColorString || sourceColorString.trim() === "" || sourceColorString === "empty") {
                const dataTransferText = e.dataTransfer.getData("text/plain");
                if (dataTransferText && typeof dataTransferText === 'string' && dataTransferText.trim() && dataTransferText !== "empty") {
                    sourceColorString = dataTransferText;
                }
            }

            // Attempt to parse the determined source string
            if (sourceColorString && sourceColorString.trim() && sourceColorString !== "empty") {
                const parsedColor = GoatColor(sourceColorString);
                if (parsedColor.isValid()) {
                    colorToApply = parsedColor;
                } else { // If string parsing fails, try the pre-parsed instance from dragstart (if valid)
                    console.warn("GoatColorPicker: Failed to parse sourceColorString from dropped item:", sourceColorString, "Error:", parsedColor.error);
                    if (draggedItem.colorInstance && draggedItem.colorInstance.isValid()) {
                        colorToApply = draggedItem.colorInstance;
                    }
                }
            } else { // If no valid string found, try the pre-parsed instance directly
                if (draggedItem.colorInstance && draggedItem.colorInstance.isValid()) {
                    colorToApply = draggedItem.colorInstance;
                    sourceColorString = colorToApply.toHexa(); // Reconstruct a string for format hint
                }
            }

            if (colorToApply && colorToApply.isValid()) {
                const formatHint = determineFormatFromString(sourceColorString || colorToApply.toHexa()); // Ensure sourceColorString for hint
                const hsla = colorToApply.toHsla();
                setColorStateAndRefresh(hsla.h, hsla.s, hsla.l, hsla.a * 100, false, formatHint);
            } else {
                console.error("GoatColorPicker: Could not apply color - colorToApply is invalid or null after all checks.");
            }
            resetDragState();
        }
    }

    // --- Event Handler Functions ---

    /** Handles click events on the paintbox bin for clearing. */
    function handlePaintboxBinClick() {
        if (draggedItem.element) return; // Don't interfere with active drag operations

        if (binClearState.ready) { // Second click: confirm clear
            initializePaintbox(); // Clears all paintbox swatches
            clearTimeout(binClearState.timeoutId);
            binClearState.ready = false;
            paintboxBin.title = originalBinTitle;
            paintboxBin.classList.remove(CSS_CLASS_PENDING_CLEAR);
            paintboxBin.setAttribute("aria-label", originalBinTitle);
            hideBinNotification();
        } else { // First click: arm clear
            binClearState.ready = true;
            paintboxBin.classList.add(CSS_CLASS_PENDING_CLEAR);
            const notificationMessage = "Click bin again to empty entire Paintbox";
            showBinNotification(notificationMessage, paintboxBin);
            paintboxBin.title = notificationMessage;
            paintboxBin.setAttribute("aria-label", notificationMessage);

            binClearState.timeoutId = setTimeout(() => {
                binClearState.ready = false;
                paintboxBin.title = originalBinTitle;
                paintboxBin.classList.remove(CSS_CLASS_PENDING_CLEAR);
                paintboxBin.setAttribute("aria-label", originalBinTitle);
                hideBinNotification();
            }, TIMEOUT_BIN_CLEAR_CONFIRM);
        }
    }

    // --- Event Listener Setup ---

    colorInput.addEventListener("input", (event) => {
        if (preventSliderInputHandling) return;
        const inputText = event.target.value;
        lastUserInputValue = inputText.trim(); // Store for blur event

        if (lastUserInputValue === "") { // Allow clearing the input
            colorInput.classList.remove(CSS_CLASS_INPUT_INVALID);
            colorInput.removeAttribute("aria-invalid");
            return;
        }

        const parsedColor = GoatColor(lastUserInputValue);
        const format = determineFormatFromString(lastUserInputValue);

        if (parsedColor.isValid()) {
            if (colorInput.classList.contains(CSS_CLASS_INPUT_INVALID)) {
                colorInput.classList.remove(CSS_CLASS_INPUT_INVALID);
                colorInput.removeAttribute("aria-invalid");
            }
            const hsla = parsedColor.toHsla();
            setColorStateAndRefresh(hsla.h, hsla.s, hsla.l, hsla.a * 100, true, format);
        } else { // Input is invalid as user types
            colorInput.classList.add(CSS_CLASS_INPUT_INVALID);
            colorInput.setAttribute("aria-invalid", "true");
        }
    });

    colorInput.addEventListener("blur", () => {
        const currentInputText = lastUserInputValue.trim(); // Use the last known input text
        let colorToFinalize = null;
        let formatForFinalize = preferredInputFormat;

        if (currentInputText !== "") { // If user left text in the input
            const parsedFromInput = GoatColor(currentInputText);
            if (parsedFromInput.isValid()) {
                colorToFinalize = parsedFromInput;
                formatForFinalize = determineFormatFromString(currentInputText);
            }
        }

        // If input was invalid or empty, finalize with current slider state
        if (!colorToFinalize) {
            const h = parseInt(sliders.hue.value, 10);
            const s = parseInt(sliders.saturation.value, 10);
            const l = parseInt(sliders.lightness.value, 10);
            const a = parseInt(sliders.opacity.value, 10);
            colorToFinalize = GoatColor(`hsla(${h},${s}%,${l}%,${a / 100})`);
        }

        if (colorToFinalize && colorToFinalize.isValid()) {
            const hsla = colorToFinalize.toHsla();
            setColorStateAndRefresh(hsla.h, hsla.s, hsla.l, hsla.a * 100, false, formatForFinalize);
        } else { // Should not happen if sliders are always valid
            colorInput.classList.add(CSS_CLASS_INPUT_INVALID);
            colorInput.setAttribute("aria-invalid", "true");
            // Refresh UI to reflect current slider state or error
            const h = parseInt(sliders.hue.value, 10), sVal = parseInt(sliders.saturation.value, 10), lVal = parseInt(sliders.lightness.value, 10), aPerc = parseInt(sliders.opacity.value, 10);
            const currentSliderGC = GoatColor(`hsla(${h}, ${sVal}%, ${lVal}%, ${aPerc / 100})`);
            updateColorInputFieldUI(currentSliderGC.isValid() ? currentSliderGC : null, false);
            updateColorOutputSpansUI(currentSliderGC.isValid() ? currentSliderGC : null);
        }
    });

    Object.values(sliders).forEach((slider) => {
        slider.addEventListener("input", () => {
            if (preventSliderInputHandling) return;
            const targetValueInput = valueInputs[slider.id];
            if (targetValueInput) targetValueInput.value = slider.value;
            refreshAllUI(false); // Not from color input field
        });
    });

    Object.entries(valueInputs).forEach(([key, valInput]) => {
        valInput.addEventListener("change", () => { // 'change' is better for manual number inputs
            const targetSlider = sliders[key];
            let val = parseInt(valInput.value, 10);
            const min = parseInt(targetSlider.min, 10);
            const max = parseInt(targetSlider.max, 10);

            val = isNaN(val) ? parseInt(targetSlider.value, 10) : Math.max(min, Math.min(max, val)); // Clamp or revert
            valInput.value = val; // Correct input field if value was out of bounds or NaN

            preventSliderInputHandling = true; // Prevent slider's 'input' event during this sync
            targetSlider.value = val;
            preventSliderInputHandling = false;

            refreshAllUI(false);
        });
    });

    harmonySelect.addEventListener("change", generateAndDisplayPalette);
    exportPaintboxBtn.addEventListener("click", exportPaintboxColors);

    copyTheoryToPaintboxBtn.addEventListener("click", () => {
        if (theoryPaletteCache.length === 0) {
            provideButtonFeedback(copyTheoryToPaintboxBtn, {}, { text: "No Palette!", title: "Generate a palette first." }, Promise.reject("No palette"));
            return;
        }
        let appendedCount = 0;
        let paintboxWasFull = false;
        for (const theoryColor of theoryPaletteCache) {
            if (theoryColor && theoryColor.isValid()) {
                const emptyIdx = paintboxColors.findIndex(c => !c || !c.isValid());
                if (emptyIdx !== -1) {
                    if (paintboxGrid.children[emptyIdx]) {
                        updatePaintboxSwatchUI(paintboxGrid.children[emptyIdx], theoryColor);
                        appendedCount++;
                    }
                } else { // No more empty slots
                    paintboxWasFull = true;
                    break;
                }
            }
        }

        if (appendedCount > 0 && paintboxWasFull) {
            provideButtonFeedback(copyTheoryToPaintboxBtn, { text: "Partial Add", title: "Paintbox full, some colors added." }, {}, Promise.resolve());
        } else if (appendedCount > 0 && !paintboxWasFull) {
            provideButtonFeedback(copyTheoryToPaintboxBtn, { text: "Added!", title: "Colors added to Paintbox!" }, {}, Promise.resolve());
        } else if (appendedCount === 0 && paintboxWasFull) {
            provideButtonFeedback(copyTheoryToPaintboxBtn, {}, { text: "Full!", title: "Paintbox is full." }, Promise.reject("Paintbox full"));
        } else if (appendedCount === 0 && !paintboxWasFull && theoryPaletteCache.length > 0) {
            provideButtonFeedback(copyTheoryToPaintboxBtn, {}, { text: "No Add", title: "No valid colors to add." }, Promise.reject("No valid colors"));
        }
    });

    // Drag and Drop for main color target areas (input field, draggable swatch)
    [colorInput, mainColorDraggable].forEach(el => {
        el.addEventListener("dragover", (e) => mainTargetDragAction(e, "over"));
        el.addEventListener("dragenter", (e) => mainTargetDragAction(e, "enter"));
        el.addEventListener("dragleave", (e) => mainTargetDragAction(e, "leave"));
        el.addEventListener("drop", (e) => mainTargetDragAction(e, "drop"));
    });

    // Specific drag setup for the main draggable color swatch
    mainColorDraggable.addEventListener("dragstart", (e) => {
        draggedItem.element = e.currentTarget;
        draggedItem.element.classList.add(CSS_CLASS_DRAGGING);
        const colorString = e.currentTarget.dataset.color;
        draggedItem.colorInstance = colorString ? GoatColor(colorString) : null;
        draggedItem.sourceType = "main";
        e.dataTransfer.effectAllowed = "copy";
        try {
            e.dataTransfer.setData("text/plain", colorString || "empty");
        } catch (err) {
            console.error("Error setting drag data for main color draggable:", err);
        }
    });
    mainColorDraggable.addEventListener("dragend", resetDragState);

    // Paintbox Bin Drag and Drop & Click
    paintboxBin.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move"; // Indicate removal
        paintboxBin.classList.add(CSS_CLASS_DRAG_OVER_BIN);
    });
    paintboxBin.addEventListener("dragenter", (e) => {
        e.preventDefault();
        paintboxBin.classList.add(CSS_CLASS_DRAG_OVER_BIN);
    });
    paintboxBin.addEventListener("dragleave", (e) => {
        paintboxBin.classList.remove(CSS_CLASS_DRAG_OVER_BIN);
    });
    paintboxBin.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        paintboxBin.classList.remove(CSS_CLASS_DRAG_OVER_BIN);
        if (draggedItem.sourceType === "paintbox" && draggedItem.originalIndex !== -1 && paintboxGrid.children[draggedItem.originalIndex]) {
            updatePaintboxSwatchUI(paintboxGrid.children[draggedItem.originalIndex], null); // Clear the original swatch
        }
        resetDragState();
    });
    paintboxBin.addEventListener("click", handlePaintboxBinClick);
    paintboxBin.addEventListener("keydown", (e) => { // Accessibility for keyboard users
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePaintboxBinClick();
        }
    });

    // Delegated event listener for copy buttons in color output section
    if (colorOutputContainer) {
        colorOutputContainer.addEventListener("click", (event) => {
            const button = event.target.closest(".copy-btn");
            if (!button || !button.dataset.target) return;

            const targetSpan = document.getElementById(button.dataset.target);
            const textToCopy = targetSpan?.textContent;

            if (textToCopy && !textToCopy.startsWith("Invalid") && !textToCopy.startsWith("Error")) {
                const outputType = targetSpan.previousElementSibling?.textContent.replace(":", "").trim() || "Value";
                provideButtonFeedback(button, { title: `Copied ${outputType}!` }, { title: "Copy Failed!" }, navigator.clipboard.writeText(textToCopy));
            } else {
                provideButtonFeedback(button, {}, { title: "Nothing to copy!" }, Promise.reject("Invalid text to copy"));
            }
        });
    }

    // --- Initialization ---

    /** Initializes the color picker application with a random starting color and sets up the UI. */
    function initializeApp() {
        preferredInputFormat = "hsl"; // Default format for the input field

        // Start with a pleasant, somewhat random color
        const initialHue = Math.floor(Math.random() * 361);
        const initialSaturation = 70 + Math.floor(Math.random() * 16); // 70-85
        const initialLightness = 40 + Math.floor(Math.random() * 21);  // 40-60

        setColorStateAndRefresh(initialHue, initialSaturation, initialLightness, 100, false, "hsl");
        initializePaintbox();

        if (harmonySelect.value) { // If a harmony is pre-selected
            generateAndDisplayPalette();
        }
    }

    initializeApp();
});