export async function copyQrImageToClipboard(text: string) {
  if (!text || !navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Trình duyệt không hỗ trợ sao chép ảnh QR.");
  }

  const response = await fetch(
    `/api/qr?text=${encodeURIComponent(text)}&copy=${Date.now()}`,
  );

  if (!response.ok) {
    throw new Error("Không thể tải ảnh QR.");
  }

  const svg = await response.text();
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Không thể tạo ảnh QR.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Không thể xuất ảnh QR."));
      }, "image/png");
    });

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
      }),
    ]);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
