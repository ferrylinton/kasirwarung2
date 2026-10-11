import nodemailer from 'nodemailer';
import { env } from './env.ts';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 5000,
});

export async function sendReceiptEmail(
  toEmail: string,
  invoiceNo: string,
  totalAmount: number,
  items: Array<{ name: string; price: number; qty: number }>
): Promise<{ sent: boolean; message: string }> {
  const rowsHtml = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee;">${i.name} (x${i.qty})</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">Rp${(i.price * i.qty).toLocaleString('id-ID')}</td>
        </tr>`
    )
    .join('');

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: toEmail,
      subject: `Struk Pembayaran Kasir Warung - ${invoiceNo}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#EC6C1A;margin-top:0;">Kasir Warung</h2>
          <p style="color:#475569;font-size:14px;">Terima kasih telah berbelanja. Berikut rincian nota transaksi Anda:</p>
          <p style="font-weight:bold;font-size:14px;background:#f8fafc;padding:10px;border-radius:8px;">No. Nota: ${invoiceNo}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
            ${rowsHtml}
          </table>
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;padding-top:12px;border-top:2px solid #0f172a;">
            <span>Total Pembayaran (Termasuk PPN 11%):</span>
            <span style="color:#16A34A;">Rp${totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>
      `,
    });
    return { sent: true, message: `Struk berhasil dikirim ke ${toEmail}` };
  } catch (err: any) {
    console.warn('[SMTP] Mail send warning:', err.message);
    return {
      sent: false,
      message: `Nota disimpan (Server SMTP sedang sibuk: ${err.message})`,
    };
  }
}
