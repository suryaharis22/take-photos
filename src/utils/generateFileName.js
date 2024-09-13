export const generateFileName = (index) => {
    const now = new Date();

    // Menghasilkan string datetime dalam format YYYYMMDDHHMMSS
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Ditambah 1 karena getMonth() mulai dari 0
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const dateTimeString = `${year}${month}${day}${hours}${minutes}${seconds}`; // Format: YYYYMMDDHHMMSS

    // Membuat angka random 4 digit
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Menghasilkan angka random antara 1000-9999

    // Format nama file berupa index + datetime + random number, hanya karakter angka
    return `${index}${dateTimeString}${randomNum}.jpeg`;
};
