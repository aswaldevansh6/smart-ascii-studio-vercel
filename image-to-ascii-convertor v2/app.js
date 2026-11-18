const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const output = document.getElementById("output");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const convertButton = document.getElementById("convert");
const downloadTxt = document.getElementById("downloadTxt");
const downloadPng = document.getElementById("downloadPng");
const widthInput = document.getElementById("width");
const widthValue = document.getElementById("widthValue");
const styleInput = document.getElementById("style");
const invertInput = document.getElementById("invert");
const message = document.getElementById("message");

let selectedImage = null;
let asciiText = "";

widthInput.addEventListener("input", () => widthValue.value = widthInput.value);

imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    message.textContent = "Please select a valid image.";
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
      message.textContent = "Image loaded. Click Convert to ASCII.";
      asciiText = "";
      output.textContent = "Click Convert to ASCII to generate the result.";
      downloadTxt.disabled = true;
      downloadPng.disabled = true;
    };
    img.onerror = () => message.textContent = "Could not read this image.";
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function generateAscii() {
  if (!selectedImage) return;
  const targetWidth = Number(widthInput.value);
  const targetHeight = Math.max(1, Math.round(
    targetWidth * selectedImage.height / selectedImage.width * 0.5
  ));
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(selectedImage, 0, 0, targetWidth, targetHeight);

  const pixels = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
  const chars = Array.from(styleInput.value);
  const rows = [];

  for (let y = 0; y < targetHeight; y++) {
    let line = "";
    for (let x = 0; x < targetWidth; x++) {
      const index = (y * targetWidth + x) * 4;
      const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (invertInput.checked) brightness = 255 - brightness;
      const charIndex = Math.min(chars.length - 1,
        Math.floor(brightness / 256 * chars.length));
      line += chars[charIndex];
    }
    rows.push(line);
  }
  asciiText = rows.join("\n");
  output.textContent = asciiText;
  downloadTxt.disabled = false;
  downloadPng.disabled = false;
  message.textContent = `Done: ${targetWidth} × ${targetHeight} characters.`;
}

convertButton.addEventListener("click", generateAscii);

downloadTxt.addEventListener("click", () => {
  const blob = new Blob([asciiText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "ascii-art.txt"; a.click();
  URL.revokeObjectURL(url);
});

downloadPng.addEventListener("click", () => {
  const lines = asciiText.split("\n");
  const fontSize = 10, lineHeight = 12, charWidth = 6;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = Math.max(1, lines[0].length * charWidth + 20);
  exportCanvas.height = Math.max(1, lines.length * lineHeight + 20);
  const exportCtx = exportCanvas.getContext("2d");
  exportCtx.fillStyle = "#10131d";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.fillStyle = "#f2f2f2";
  exportCtx.font = `${fontSize}px monospace`;
  exportCtx.textBaseline = "top";
  lines.forEach((line, i) => exportCtx.fillText(line, 10, 10 + i * lineHeight));
  exportCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ascii-art.png"; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});
