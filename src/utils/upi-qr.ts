import QRCode from 'qrcode';

interface UPIParams {
  upiId: string;
  payeeName: string;
  amount?: number;
  note?: string;
}

/** Build a valid UPI payment URI per the NPCI UPI spec */
export function buildUPIUri({ upiId, payeeName, amount, note }: UPIParams): string {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  params.set('pn', payeeName);
  if (amount && amount > 0) params.set('am', amount.toFixed(2));
  if (note) params.set('tn', note);
  params.set('cu', 'INR');
  return `upi://pay?${params.toString()}`;
}

/** Generate a base64 PNG data URL of a QR code from a UPI URI */
export async function generateQRDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: 300,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
