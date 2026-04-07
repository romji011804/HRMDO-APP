import QRCode from "qrcode";

export async function generateQrImageBlob(data: string) {
  const dataUrl = await QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 768,
  });

  const response = await fetch(dataUrl);
  return response.blob();
}
