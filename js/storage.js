/**
 * Module de gestion LocalStorage pour le Système Hospitalier
 * Version corrigée et sécurisée
 */

class StorageManager {
    constructor() {
        this.prefix = 'hospital_';
        this.initializeData();
    }

    initializeData() {
        const defaultData = {
            patients: [],
            doctors: [],
            appointments: [],
            medicaments: [],
            prescriptions: [],
            rooms: [],
            admissions: [],
            invoices: [],
            payments: [],
            counters: {
                patients: 1,
                doctors: 1,
                appointments: 1,
                medicaments: 1,
                prescriptions: 1,
                rooms: 1,
                admissions: 1,
                invoices: 1,
                payments: 1
            }
        };

        // Initialiser collections si absentes ou invalides
        Object.keys(defaultData).forEach(key => {
            const value = this.get(key);
            if (!value || (Array.isArray(defaultData[key]) && !Array.isArray(value))) {
                this.set(key, defaultData[key]);
            }
        });

        // Sécuriser counters (fusion au lieu d’écraser)
        const counters = this.get('counters') || {};
        this.set('counters', { ...defaultData.counters, ...counters });

        this.addDemoData();
    }

    addDemoData() {
        if ((this.get('patients') || []).length === 0) {
            this.set('patients', [
                {
                    id: this.getNextId('patients'),
                    nom: 'Dupont',
                    prenom: 'Jean',
                    age: 45,
                    sexe: 'M',
                    telephone: '0123456789',
                    email: 'jean.dupont@email.com',
                    adresse: 'Paris',
                    historiqueMedical: '',
                    dateCreation: new Date().toISOString()
                }
            ]);
        }
    }

    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error(`Storage get error (${key})`, e);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Storage set error (${key})`, e);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error(`Storage remove error (${key})`, e);
            return false;
        }
    }

    clear() {
        try {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(this.prefix)) {
                    localStorage.removeItem(k);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error', e);
            return false;
        }
    }

    getNextId(collection) {
        const counters = this.get('counters') || {};
        const nextId = counters[collection] || 1;
        counters[collection] = nextId + 1;
        this.set('counters', counters);
        return nextId;
    }

    add(collection, item) {
        try {
            const items = this.get(collection) || [];
            const newItem = {
                ...item,
                id: item.id || this.getNextId(collection),
                dateCreation: item.dateCreation || new Date().toISOString(),
                dateModification: new Date().toISOString()
            };
            items.push(newItem);
            this.set(collection, items);
            return newItem;
        } catch (e) {
            console.error(`Add error (${collection})`, e);
            return false;
        }
    }

    update(collection, id, updates) {
        try {
            const items = this.get(collection) || [];
            const index = items.findIndex(i => i.id === id);
            if (index === -1) return false;

            items[index] = {
                ...items[index],
                ...updates,
                dateModification: new Date().toISOString()
            };
            this.set(collection, items);
            return items[index];
        } catch (e) {
            console.error(`Update error (${collection})`, e);
            return false;
        }
    }

    delete(collection, id) {
        try {
            const items = this.get(collection) || [];
            this.set(collection, items.filter(i => i.id !== id));
            return true;
        } catch (e) {
            console.error(`Delete error (${collection})`, e);
            return false;
        }
    }

    findById(collection, id) {
        const items = this.get(collection) || [];
        return items.find(i => i.id === id) || null;
    }

    search(collection, searchTerm, fields = []) {
        const term = (searchTerm || '').toLowerCase();
        const items = this.get(collection) || [];

        return items.filter(item => {
            const values = fields.length ? fields.map(f => item[f]) : Object.values(item);
            return values.some(v =>
                typeof v === 'string' && v.toLowerCase().includes(term)
            );
        });
    }

    exportData() {
        const collections = [
            'patients', 'doctors', 'appointments',
            'medicaments', 'prescriptions', 'rooms',
            'admissions', 'invoices', 'payments'
        ];

        const data = {};
        collections.forEach(c => data[c] = this.get(c) || []);
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(c => this.set(c, data[c]));
            return true;
        } catch {
            return false;
        }
    }

    getStatistics() {
        const collections = [
            'patients', 'doctors', 'appointments',
            'medicaments', 'prescriptions', 'rooms',
            'admissions', 'invoices', 'payments'
        ];

        const stats = {};
        collections.forEach(c => stats[c] = (this.get(c) || []).length);
        return stats;
    }
}

const storage = new StorageManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
