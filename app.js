const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const widthInput = document.getElementById("width");
const widthValue = document.getElementById("widthValue");
const styleInput = document.getElementById("style");
const invertInput = document.getElementById("invert");
const adaptiveInput = document.getElementById("adaptive");
const edgeInput = document.getElementById("edge");
const comparisonInput = document.getElementById("comparison");
const convertButton = document.getElementById("convert");
const downloadTxt = document.getElementById("downloadTxt");
const downloadPng = document.getElementById("downloadPng");
const output = document.getElementById("output");
const normalOutput = document.getElementById("normalOutput");
const enhancedOutput = document.getElementById("enhancedOutput");
const singleResults = document.getElementById("singleResults");
const comparisonResults = document.getElementById("comparisonResults");
const message = document.getElementById("message");
const workCanvas = document.getElementById("workCanvas");
const exportCanvas = document.getElementById("exportCanvas");

let selectedImage = null;
let currentText = "";
let currentMode = "single";

widthInput.addEventListener("input", () => {
  widthValue.value = widthInput.value;
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    message.textContent = "Please choose a valid image file.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      selectedImage = img;
      preview.src = reader.result;
      preview.style.display = "block";
      convertButton.disabled = false;
      message.textContent = `Image ready: ${file.name}`;
      runConversion();
    };
    img.onerror = () => {
      message.textContent = "Could not load this image. Please try another file.";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

convertButton.addEventListener("click", runConversion);
comparisonInput.addEventListener("change", () => {
  if (currentText) runConversion();
});
[invertInput, adaptiveInput, edgeInput, styleInput, widthInput].forEach((el) => {
  el.addEventListener("change", () => {
    if (selectedImage) runConversion();
  });
});

function getImagePixels(img, width) {
  const ratio = img.naturalHeight / img.naturalWidth;
  const height = Math.max(1, Math.round(width * ratio * 0.5));
  workCanvas.width = width;
  workCanvas.height = height;
  const ctx = workCanvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

function enhanceGray(gray, w, h, adaptive, edge) {
  const result = new Float32Array(gray);
  if (adaptive) {
    let min = 255, max = 0;
    for (const v of result) { if (v < min) min = v; if (v > max) max = v; }
    const span = Math.max(1, max - min);
    for (let i = 0; i < result.length; i++) result[i] = (result[i] - min) * 255 / span;
  }
  if (edge && w > 2 && h > 2) {
    const source = new Float32Array(result);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = source[i - 1] + source[i + 1] + source[i - w] + source[i + w] - 4 * source[i];
        result[i] = Math.max(0, Math.min(255, source[i] - lap * 0.22));
      }
    }
  }
  return result;
}

function makeAscii(img, options) {
  const { width, invert, adaptive, edge, chars } = options;
  const { data, width: w, height: h } = getImagePixels(img, width);
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  let values = enhanceGray(gray, w, h, adaptive, edge);
  if (invert) {
    for (let i = 0; i < values.length; i++) values[i] = 255 - values[i];
  }
  const palette = Array.from(chars || "@%#*+=-:. ");
  const lines = [];
  for (let y = 0; y < h; y++) {
    let line = "";
    for (let x = 0; x < w; x++) {
      const value = values[y * w + x];
      const index = Math.min(palette.length - 1, Math.floor(value / 255 * (palette.length - 1)));
      line += palette[index];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function runConversion() {
  if (!selectedImage) return;
  const common = {
    width: Number(widthInput.value),
    invert: invertInput.checked,
    chars: styleInput.value
  };
  currentMode = comparisonInput.checked ? "comparison" : "single";
  singleResults.hidden = currentMode === "comparison";
  comparisonResults.hidden = currentMode !== "comparison";

  if (currentMode === "comparison") {
    const normal = makeAscii(selectedImage, {
      ...common, adaptive: false, edge: false
    });
    const enhanced = makeAscii(selectedImage, {
      ...common, adaptive: adaptiveInput.checked, edge: edgeInput.checked
    });
    normalOutput.textContent = normal;
    enhancedOutput.textContent = enhanced;
    currentText = `NORMAL ASCII\n\n${normal}\n\nENHANCED ASCII\n\n${enhanced}`;
    message.textContent = "Comparison mode: normal and enhanced ASCII are shown side by side.";
  } else {
    currentText = makeAscii(selectedImage, {
      ...common, adaptive: adaptiveInput.checked, edge: edgeInput.checked
    });
    output.textContent = currentText;
    message.textContent = "ASCII conversion completed successfully.";
  }
  downloadTxt.disabled = false;
  downloadPng.disabled = false;
}

downloadTxt.addEventListener("click", () => {
  if (!currentText) return;
  const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, "smart-ascii-output.txt");
});

downloadPng.addEventListener("click", () => {
  if (!currentText) return;
  const text = currentText;
  const lines = text.split("\n");
  const fontSize = 10;
  const lineHeight = 12;
  const maxCols = Math.max(...lines.map(line => line.length), 1);
  exportCanvas.width = Math.max(500, maxCols * 6.2 + 30);
  exportCanvas.height = Math.max(180, lines.length * lineHeight + 30);
  const ctx = exportCanvas.getContext("2d");
  ctx.fillStyle = "#090d19";
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.fillStyle = "#e1d4ff";
  ctx.font = `${fontSize}px "Courier New", monospace`;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, 15, 15 + i * lineHeight));
  exportCanvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, "smart-ascii-output.png");
  });
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
