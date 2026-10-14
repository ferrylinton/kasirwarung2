import nodemailer from 'nodemailer';
import { env } from './env.ts';

const transporter =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        connectionTimeout: 4000,
      })
    : null;

export async function sendReceiptEmail(
  toEmail: string,
  invoiceNo: string,
  totalAmount: number,
  items: Array<{ name: string; price: number; qty: number }>
): Promise<{ sent: boolean; message: string }> {
  if (!transporter) {
    return {
      sent: true,
      message: `Simulasi: Struk nota telah dibuat untuk ${toEmail}`,
    };
  }
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

export const recentEmailSimulations: Array<{
  type: 'verification' | 'reactivation' | 'receipt';
  toEmail: string;
  token?: string;
  url?: string;
  timestamp: string;
}> = [];

export async function sendTenantVerificationEmail(
  toEmail: string,
  shopName: string,
  token: string
): Promise<{ sent: boolean; message: string; verificationUrl: string }> {
  const verificationUrl = `${env.APP_URL || ''}/verify-tenant?token=${token}`;
  console.log(`[Email] Tenant Verification URL for ${toEmail} (${shopName}): ${verificationUrl}`);
  
  recentEmailSimulations.unshift({
    type: 'verification',
    toEmail,
    token,
    url: verificationUrl,
    timestamp: new Date().toISOString(),
  });
  if (recentEmailSimulations.length > 20) recentEmailSimulations.pop();

  if (!transporter) {
    return {
      sent: true,
      message: `Simulasi: Tautan konfirmasi pendaftaran toko telah dikirim ke ${toEmail}`,
      verificationUrl,
    };
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: toEmail,
      subject: `Konfirmasi Pendaftaran Toko - ${shopName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#EC6C1A;margin-top:0;">Kasir Warung POS</h2>
          <p>Halo Pemilik Toko <strong>${shopName}</strong>,</p>
          <p>Terima kasih telah mendaftarkan toko Anda di Kasir Warung. Silakan klik tautan di bawah ini untuk mengonfirmasi dan mengaktifkan akun toko Anda:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${verificationUrl}" style="background:#EC6C1A;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Konfirmasi & Aktifkan Toko</a>
          </div>
          <p style="font-size:12px;color:#64748b;">Atau salin tautan berikut ke peramban Anda:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
        </div>
      `,
    });
    return { sent: true, message: `Email konfirmasi terkirim ke ${toEmail}`, verificationUrl };
  } catch (err: any) {
    console.warn('[SMTP] Verification mail error:', err.message);
    return { sent: true, message: `Simulasi terkirim (SMTP offline): ${verificationUrl}`, verificationUrl };
  }
}

export async function sendTenantReactivationEmail(
  toEmail: string,
  shopName: string,
  token: string
): Promise<{ sent: boolean; message: string; reactivationUrl: string }> {
  const reactivationUrl = `${env.APP_URL || ''}/reactivate-tenant?token=${token}`;
  console.log(`[Email] Tenant Reactivation URL for ${toEmail} (${shopName}): ${reactivationUrl}`);

  recentEmailSimulations.unshift({
    type: 'reactivation',
    toEmail,
    token,
    url: reactivationUrl,
    timestamp: new Date().toISOString(),
  });
  if (recentEmailSimulations.length > 20) recentEmailSimulations.pop();

  if (!transporter) {
    return {
      sent: true,
      message: `Simulasi: Tautan pengaktifan kembali toko telah dikirim ke ${toEmail}`,
      reactivationUrl,
    };
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: toEmail,
      subject: `Konfirmasi Pengaktifan Kembali Toko - ${shopName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#EC6C1A;margin-top:0;">Kasir Warung POS</h2>
          <p>Halo Pemilik Toko <strong>${shopName}</strong>,</p>
          <p>Kami menerima permintaan untuk mengaktifkan kembali akun toko Anda. Klik tombol di bawah ini untuk mengaktifkan kembali:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${reactivationUrl}" style="background:#16A34A;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Aktifkan Kembali Toko</a>
          </div>
          <p style="font-size:12px;color:#64748b;">Tautan: <a href="${reactivationUrl}">${reactivationUrl}</a></p>
        </div>
      `,
    });
    return { sent: true, message: `Email pengaktifan kembali terkirim ke ${toEmail}`, reactivationUrl };
  } catch (err: any) {
    console.warn('[SMTP] Reactivation mail error:', err.message);
    return { sent: true, message: `Simulasi terkirim (SMTP offline): ${reactivationUrl}`, reactivationUrl };
  }
}
