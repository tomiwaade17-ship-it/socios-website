// ===== SOCIOS GOOGLE SHEETS DATA =====

const SHEETS = {
    events: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=1215869280&single=true&output=csv',
    testimonials: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=575598417&single=true&output=csv',
    gallery: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=1789159689&single=true&output=csv',
    galleryDetails: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=30924486&single=true&output=csv',
    eventDetails: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmJ_eG_4lWnbYZ4Id9EFENpkw848NcB5lUXJrfZHIevEuYol6K7e9MU8xTiwCOCGrSChFGefANOqDd/pub?gid=0&single=true&output=csv'
};

// Proper CSV parser — handles quoted fields, commas inside URLs, empty cells
function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const row = [];
        let current = '';
        let inQuotes = false;
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim());
        rows.push(row);
    }

    return rows;
}

async function fetchSheet(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = parseCSV(text);

        if (rows.length < 2) return [];

        const headers = rows[0].map(h => h.replace(/"/g, '').trim().toLowerCase());
        const data = rows.slice(1)
            .filter(row => row.some(cell => cell !== ''))
            .map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = (row[i] || '').replace(/"/g, '').trim();
                });
                return obj;
            });

        return data;
    } catch (error) {
        console.error('Error fetching sheet:', error);
        return [];
    }
}