// ===== SOCIOS GOOGLE SHEETS DATA =====

const SHEETS = {
    events: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=1215869280&single=true&output=csv',
    testimonials: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=575598417&single=true&output=csv',
    gallery: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=1789159689&single=true&output=csv',
    galleryDetails: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=30924486&single=true&output=csv',
    eventDetails: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=0&single=true&output=csv'
};

// Parse CSV to array of objects
async function fetchSheet(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = rows.slice(1).filter(row => row.trim()).map(row => {
            const values = row.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] ? values[i].replace(/"/g, '').trim() : '';
            });
            return obj;
        });
        return data;
    } catch (error) {
        console.error('Error fetching sheet:', error);
        return [];
    }
}