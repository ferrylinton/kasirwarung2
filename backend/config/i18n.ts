import i18next from 'i18next';
import middleware from 'i18next-http-middleware';

export const defaultLanguage = 'id';
export const supportedLanguages = ['id', 'en'] as const;

export const backendResources = {
  id: {
    translation: {
      common: {
        success: 'Berhasil',
        error: 'Terjadi kesalahan sistem',
        unauthorized: 'Akses tidak diizinkan. Silakan login kembali.',
        forbidden: 'Anda tidak memiliki hak akses untuk tindakan ini.',
        notFound: 'Data tidak ditemukan.',
        invalidInput: 'Data yang dikirim tidak valid.',
      },
      auth: {
        loginSuccess: 'Login berhasil. Selamat datang kembali!',
        invalidCredentials: 'Email/username atau password salah.',
        tenantInactive: 'Akun tenan atau toko Anda saat ini dinonaktifkan. Silakan hubungi admin.',
        userInactive: 'Akun kasir Anda dinonaktifkan oleh pemilik toko.',
        tokenBlacklisted: 'Sesi telah kedaluwarsa atau dikeluarkan.',
        tokenExpired: 'Sesi login telah berakhir. Silakan login ulang.',
        logoutSuccess: 'Logout berhasil.',
        passwordChanged: 'Password berhasil diubah. Silakan login kembali.',
        passwordMismatch: 'Password lama tidak cocok.',
      },
      tenant: {
        settingsSaved: 'Pengaturan PPN dan toko berhasil diperbarui.',
        statusUpdated: 'Status tenan berhasil diperbarui.',
        deactivationRequested: 'Permintaan penonaktifan berhasil diajukan.',
        deactivationCancelled: 'Permintaan penonaktifan berhasil dibatalkan.',
        deactivationReviewed: 'Permintaan penonaktifan berhasil ditinjau.',
        reactivationSent: 'Email tautan pengaktifan kembali berhasil dikirim.',
        reactivated: 'Toko Anda berhasil diaktifkan kembali.',
      },
      product: {
        created: 'Produk berhasil ditambahkan.',
        updated: 'Data produk berhasil diperbarui.',
        deleted: 'Produk berhasil dihapus.',
        stockUpdated: 'Stok produk berhasil diperbarui.',
      },
      category: {
        created: 'Kategori baru berhasil dibuat.',
        updated: 'Data kategori berhasil diperbarui.',
        deleted: 'Kategori berhasil dihapus.',
      },
      cashier: {
        created: 'Pengguna kasir berhasil ditambahkan.',
        updated: 'Data kasir berhasil diperbarui.',
        deleted: 'Kasir berhasil dihapus.',
      },
      order: {
        saved: 'Pesanan berhasil disimpan di nota tersimpan.',
        paid: 'Pembayaran berhasil diselesaikan.',
        adminCannotOrder: 'Role ADMIN tidak bisa membuat pesanan.',
        receiptSimulated: 'Simulasi: Struk nota telah dibuat untuk {{email}}',
      },
    },
  },
  en: {
    translation: {
      common: {
        success: 'Success',
        error: 'A system error occurred',
        unauthorized: 'Unauthorized. Please sign in again.',
        forbidden: 'You do not have permission for this action.',
        notFound: 'Data not found.',
        invalidInput: 'Invalid input data provided.',
      },
      auth: {
        loginSuccess: 'Login successful. Welcome back!',
        invalidCredentials: 'Invalid email/username or password.',
        tenantInactive: 'Your store account is currently deactivated. Please contact admin.',
        userInactive: 'Your cashier account is deactivated by the shop owner.',
        tokenBlacklisted: 'Session has expired or been revoked.',
        tokenExpired: 'Login session expired. Please sign in again.',
        logoutSuccess: 'Logged out successfully.',
        passwordChanged: 'Password changed successfully. Please log in again.',
        passwordMismatch: 'Current password does not match.',
      },
      tenant: {
        settingsSaved: 'VAT and store settings successfully updated.',
        statusUpdated: 'Store status successfully updated.',
        deactivationRequested: 'Deactivation request submitted successfully.',
        deactivationCancelled: 'Deactivation request cancelled successfully.',
        deactivationReviewed: 'Deactivation request reviewed successfully.',
        reactivationSent: 'Reactivation link email sent successfully.',
        reactivated: 'Your store has been successfully reactivated.',
      },
      product: {
        created: 'Product successfully added.',
        updated: 'Product data successfully updated.',
        deleted: 'Product successfully deleted.',
        stockUpdated: 'Product stock successfully updated.',
      },
      category: {
        created: 'New category successfully created.',
        updated: 'Category successfully updated.',
        deleted: 'Category successfully deleted.',
      },
      cashier: {
        created: 'Cashier user successfully added.',
        updated: 'Cashier data successfully updated.',
        deleted: 'Cashier user successfully deleted.',
      },
      order: {
        saved: 'Order successfully saved.',
        paid: 'Payment successfully completed.',
        adminCannotOrder: 'ADMIN role cannot place orders.',
        receiptSimulated: 'Simulated: Receipt invoice created for {{email}}',
      },
    },
  },
};

// Initialize backend i18next instance
i18next
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    preload: supportedLanguages,
    resources: backendResources,
    detection: {
      order: ['header', 'querystring', 'cookie'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      caches: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export const backendI18n = i18next;
export const i18nMiddleware = middleware.handle(i18next);
