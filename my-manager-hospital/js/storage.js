/**
 * Module de gestion LocalStorage pour le Système Hospitalier
 * Fournit une interface unifiée pour la persistance des données
 */

class StorageManager {
    constructor() {
        this.prefix = 'hospital_';
        this.initializeData();
    }

    /**
     * Initialise les données par défaut si elles n'existent pas
     */
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

        // Vérifier et initialiser chaque collection
        Object.keys(defaultData).forEach(key => {
            if (!this.get(key)) {
                this.set(key, defaultData[key]);
            }
        });

        // Ajouter des données de démonstration si les collections sont vides
        this.addDemoData();
    }

    /**
     * Ajoute des données de démonstration pour tester l'application
     */
    addDemoData() {
        // Patients de démonstration
        if (this.get('patients').length === 0) {
            const demoPatients = [
                {
                    id: this.getNextId('patients'),
                    nom: 'Dupont',
                    prenom: 'Jean',
                    age: 45,
                    sexe: 'M',
                    telephone: '0123456789',
                    email: 'jean.dupont@email.com',
                    adresse: '123 Rue de la Paix, Paris',
                    historiqueMedical: 'Hypertension, Diabète de type 2',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('patients'),
                    nom: 'Martin',
                    prenom: 'Sophie',
                    age: 32,
                    sexe: 'F',
                    telephone: '0987654321',
                    email: 'sophie.martin@email.com',
                    adresse: '456 Avenue des Champs-Élysées, Paris',
                    historiqueMedical: 'Allergie aux pénicillines',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('patients'),
                    nom: 'Bernard',
                    prenom: 'Pierre',
                    age: 67,
                    sexe: 'M',
                    telephone: '0612345678',
                    email: 'pierre.bernard@email.com',
                    adresse: '789 Boulevard Saint-Germain, Paris',
                    historiqueMedical: 'Arthrite, Problèmes cardiaques',
                    dateCreation: new Date().toISOString()
                }
            ];
            this.set('patients', demoPatients);
        }

        // Médecins de démonstration
        if (this.get('doctors').length === 0) {
            const demoDoctors = [
                {
                    id: this.getNextId('doctors'),
                    nom: 'Durand',
                    prenom: 'Marie',
                    specialite: 'Cardiologie',
                    service: 'Cardiologie',
                    telephone: '0145678901',
                    email: 'marie.durand@hopital.fr',
                    horaireDebut: '08:00',
                    horaireFin: '18:00',
                    adresse: '15 Rue de la Santé, Paris',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('doctors'),
                    nom: 'Lefebvre',
                    prenom: 'Thomas',
                    specialite: 'Pédiatrie',
                    service: 'Pédiatrie',
                    telephone: '0134567890',
                    email: 'thomas.lefebvre@hopital.fr',
                    horaireDebut: '09:00',
                    horaireFin: '17:00',
                    adresse: '22 Rue des Enfants, Paris',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('doctors'),
                    nom: 'Moreau',
                    prenom: 'Isabelle',
                    specialite: 'Urgences',
                    service: 'Urgences',
                    telephone: '0123456789',
                    email: 'isabelle.moreau@hopital.fr',
                    horaireDebut: '07:00',
                    horaireFin: '19:00',
                    adresse: '8 Rue de l\'Urgence, Paris',
                    dateCreation: new Date().toISOString()
                }
            ];
            this.set('doctors', demoDoctors);
        }

        // Médicaments de démonstration
        if (this.get('medicaments').length === 0) {
            const demoMedicaments = [
                {
                    id: this.getNextId('medicaments'),
                    nom: 'Paracétamol',
                    code: 'PARA500',
                    famille: 'Antalgique',
                    dosage: '500mg',
                    stockInitial: 1000,
                    stockActuel: 850,
                    stockMinimum: 100,
                    prixUnitaire: 2.50,
                    fournisseur: 'PharmaLab',
                    description: 'Antalgique et antipyrétique',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('medicaments'),
                    nom: 'Amoxicilline',
                    code: 'AMOX1000',
                    famille: 'Antibiotique',
                    dosage: '1g',
                    stockInitial: 500,
                    stockActuel: 320,
                    stockMinimum: 50,
                    prixUnitaire: 15.00,
                    fournisseur: 'BioMed',
                    description: 'Antibiotique à large spectre',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('medicaments'),
                    nom: 'Ibuprofène',
                    code: 'IBU400',
                    famille: 'Anti-inflammatoire',
                    dosage: '400mg',
                    stockInitial: 800,
                    stockActuel: 45,
                    stockMinimum: 100,
                    prixUnitaire: 4.20,
                    fournisseur: 'MediPlus',
                    description: 'Anti-inflammatoire non stéroïdien',
                    dateCreation: new Date().toISOString()
                }
            ];
            this.set('medicaments', demoMedicaments);
        }

        // Chambres de démonstration
        if (this.get('rooms').length === 0) {
            const demoRooms = [
                {
                    id: this.getNextId('rooms'),
                    numero: '101',
                    etage: 1,
                    type: 'Standard',
                    capacite: 2,
                    litsOccupes: 1,
                    service: 'Cardiologie',
                    prixParJour: 150.00,
                    equipements: 'TV, WiFi, Salle de bain',
                    statut: 'Occupée',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('rooms'),
                    numero: '201',
                    etage: 2,
                    type: 'VIP',
                    capacite: 1,
                    litsOccupes: 0,
                    service: 'Chirurgie',
                    prixParJour: 350.00,
                    equipements: 'TV, WiFi, Climatisation, Mini-bar',
                    statut: 'Disponible',
                    dateCreation: new Date().toISOString()
                },
                {
                    id: this.getNextId('rooms'),
                    numero: '301',
                    etage: 3,
                    type: 'Standard',
                    capacite: 4,
                    litsOccupes: 3,
                    service: 'Pédiatrie',
                    prixParJour: 120.00,
                    equipements: 'TV, WiFi, Salle de bain, Jeux',
                    statut: 'Occupée',
                    dateCreation: new Date().toISOString()
                }
            ];
            this.set('rooms', demoRooms);
        }
    }

    /**
     * Récupère une valeur du LocalStorage
     * @param {string} key - Clé de la donnée
     * @return {any} La valeur stockée ou null
     */
    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Erreur lors de la récupération de ${key}:`, error);
            return null;
        }
    }

    /**
     * Stocke une valeur dans le LocalStorage
     * @param {string} key - Clé de la donnée
     * @param {any} value - Valeur à stocker
     * @return {boolean} True si succès, false si erreur
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Erreur lors du stockage de ${key}:`, error);
            return false;
        }
    }

    /**
     * Supprime une valeur du LocalStorage
     * @param {string} key - Clé de la donnée à supprimer
     * @return {boolean} True si succès, false si erreur
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de ${key}:`, error);
            return false;
        }
    }

    /**
     * Vide toutes les données de l'application
     * @return {boolean} True si succès, false si erreur
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Erreur lors du vidage des données:', error);
            return false;
        }
    }

    /**
     * Génère le prochain ID pour une collection
     * @param {string} collection - Nom de la collection
     * @return {number} Le prochain ID
     */
    getNextId(collection) {
        const counters = this.get('counters') || {};
        const nextId = counters[collection] || 1;
        counters[collection] = nextId + 1;
        this.set('counters', counters);
        return nextId;
    }

    /**
     * Ajoute un élément à une collection
     * @param {string} collection - Nom de la collection
     * @param {object} item - Élément à ajouter
     * @return {boolean} True si succès, false si erreur
     */
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
        } catch (error) {
            console.error(`Erreur lors de l'ajout à ${collection}:`, error);
            return false;
        }
    }

    /**
     * Met à jour un élément dans une collection
     * @param {string} collection - Nom de la collection
     * @param {number} id - ID de l'élément à mettre à jour
     * @param {object} updates - Données à mettre à jour
     * @return {boolean} True si succès, false si erreur
     */
    update(collection, id, updates) {
        try {
            const items = this.get(collection) || [];
            const index = items.findIndex(item => item.id === id);
            
            if (index === -1) {
                console.error(`Élément ${id} non trouvé dans ${collection}`);
                return false;
            }

            items[index] = {
                ...items[index],
                ...updates,
                dateModification: new Date().toISOString()
            };
            
            this.set(collection, items);
            return items[index];
        } catch (error) {
            console.error(`Erreur lors de la mise à jour dans ${collection}:`, error);
            return false;
        }
    }

    /**
     * Supprime un élément d'une collection
     * @param {string} collection - Nom de la collection
     * @param {number} id - ID de l'élément à supprimer
     * @return {boolean} True si succès, false si erreur
     */
    delete(collection, id) {
        try {
            const items = this.get(collection) || [];
            const filteredItems = items.filter(item => item.id !== id);
            
            if (filteredItems.length === items.length) {
                console.error(`Élément ${id} non trouvé dans ${collection}`);
                return false;
            }
            
            this.set(collection, filteredItems);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression dans ${collection}:`, error);
            return false;
        }
    }

    /**
     * Récupère un élément par son ID
     * @param {string} collection - Nom de la collection
     * @param {number} id - ID de l'élément
     * @return {object|null} L'élément trouvé ou null
     */
    findById(collection, id) {
        try {
            const items = this.get(collection) || [];
            return items.find(item => item.id === id) || null;
        } catch (error) {
            console.error(`Erreur lors de la recherche dans ${collection}:`, error);
            return null;
        }
    }

    /**
     * Recherche des éléments dans une collection
     * @param {string} collection - Nom de la collection
     * @param {string} searchTerm - Terme de recherche
     * @param {string[]} fields - Champs à rechercher (optionnel)
     * @return {array} Résultats de la recherche
     */
    search(collection, searchTerm, fields = []) {
        try {
            const items = this.get(collection) || [];
            const term = searchTerm.toLowerCase();
            
            if (fields.length === 0) {
                // Recherche dans tous les champs string
                return items.filter(item => {
                    return Object.values(item).some(value => 
                        typeof value === 'string' && 
                        value.toLowerCase().includes(term)
                    );
                });
            } else {
                // Recherche dans les champs spécifiés
                return items.filter(item => {
                    return fields.some(field => {
                        const value = item[field];
                        return typeof value === 'string' && 
                               value.toLowerCase().includes(term);
                    });
                });
            }
        } catch (error) {
            console.error(`Erreur lors de la recherche dans ${collection}:`, error);
            return [];
        }
    }

    /**
     * Exporte toutes les données au format JSON
     * @return {string} Données au format JSON
     */
    exportData() {
        try {
            const data = {};
            const collections = [
                'patients', 'doctors', 'appointments', 
                'medicaments', 'prescriptions', 'rooms', 
                'admissions', 'invoices', 'payments'
            ];
            
            collections.forEach(collection => {
                data[collection] = this.get(collection) || [];
            });
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Erreur lors de l\'export des données:', error);
            return '{}';
        }
    }

    /**
     * Importe des données depuis un format JSON
     * @param {string} jsonData - Données au format JSON
     * @return {boolean} True si succès, false si erreur
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            Object.keys(data).forEach(collection => {
                this.set(collection, data[collection]);
            });
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import des données:', error);
            return false;
        }
    }

    /**
     * Obtient des statistiques sur les collections
     * @return {object} Statistiques des collections
     */
    getStatistics() {
        const stats = {};
        const collections = [
            'patients', 'doctors', 'appointments', 
            'medicaments', 'prescriptions', 'rooms', 
            'admissions', 'invoices', 'payments'
        ];
        
        collections.forEach(collection => {
            const items = this.get(collection) || [];
            stats[collection] = items.length;
        });
        
        return stats;
    }
}

// Instance globale du gestionnaire de stockage
const storage = new StorageManager();

// Export pour utilisation dans les autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
