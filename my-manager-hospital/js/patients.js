/**
 * Module de gestion des patients
 * CRUD complet pour la gestion des patients hospitaliers
 */

class PatientsManager {
    constructor() {
        this.currentEditId = null;
        this.initializeEventListeners();
        this.loadPatients();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Formulaire d'ajout/modification
        const form = document.getElementById('patient-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Bouton d'annulation
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetForm());
        }

        // Recherche
        const searchInput = document.getElementById('search-patients');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    /**
     * Gère la soumission du formulaire
     * @param {Event} e - Événement de soumission
     */
    handleSubmit(e) {
        e.preventDefault();

        const formData = this.getFormData();

        // Validation des données
        if (!this.validateFormData(formData)) {
            return;
        }

        if (this.currentEditId) {
            // Mode modification
            this.updatePatient(this.currentEditId, formData);
        } else {
            // Mode ajout
            this.addPatient(formData);
        }
    }

    /**
     * Récupère les données du formulaire
     * @return {object} Données du formulaire
     */
    getFormData() {
        return {
            nom: document.getElementById('nom').value.trim(),
            prenom: document.getElementById('prenom').value.trim(),
            age: parseInt(document.getElementById('age').value),
            sexe: document.getElementById('sexe').value,
            telephone: document.getElementById('telephone').value.trim(),
            email: document.getElementById('email').value.trim(),
            adresse: document.getElementById('adresse').value.trim(),
            historiqueMedical: document.getElementById('historique-medical').value.trim()
        };
    }

    /**
     * Valide les données du formulaire
     * @param {object} data - Données à valider
     * @return {boolean} True si valide, false sinon
     */
    validateFormData(data) {
        const errors = [];

        // Validation des champs obligatoires
        if (!data.nom) errors.push('Le nom est obligatoire');
        if (!data.prenom) errors.push('Le prénom est obligatoire');
        if (!data.age || data.age < 0 || data.age > 150) {
            errors.push('L\'âge doit être compris entre 0 et 150');
        }
        if (!data.sexe) errors.push('Le sexe est obligatoire');
        if (!data.telephone) errors.push('Le téléphone est obligatoire');
        if (!data.adresse) errors.push('L\'adresse est obligatoire');

        // Validation du format du téléphone
        const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
        if (data.telephone && !phoneRegex.test(data.telephone)) {
            errors.push('Le format du téléphone est invalide');
        }

        // Validation de l'email si fourni
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('Le format de l\'email est invalide');
            }
        }

        // Affichage des erreurs
        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Affiche les erreurs de validation
     * @param {string[]} errors - Liste des erreurs
     */
    showErrors(errors) {
        const message = errors.join('\n');
        this.showNotification('Erreurs de validation:\n' + message, 'error');
    }

    /**
     * Ajoute un nouveau patient
     * @param {object} patientData - Données du patient
     */
    addPatient(patientData) {
        try {
            const newPatient = storage.add('patients', patientData);

            if (newPatient) {
                this.showNotification('Patient ajouté avec succès!', 'success');
                this.resetForm();
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de l\'ajout du patient', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du patient:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour un patient existant
     * @param {number} id - ID du patient
     * @param {object} patientData - Nouvelles données
     */
    updatePatient(id, patientData) {
        try {
            const updatedPatient = storage.update('patients', parseInt(id), patientData);

            if (updatedPatient) {
                this.showNotification('Patient mis à jour avec succès!', 'success');
                this.resetForm();
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de la mise à jour du patient', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du patient:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime un patient
     * @param {number} id - ID du patient à supprimer
     */
    deletePatient(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient?')) {
            return;
        }

        try {
            const success = storage.delete('patients', parseInt(id));

            if (success) {
                this.showNotification('Patient supprimé avec succès!', 'success');
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de la suppression du patient', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du patient:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Charge et affiche la liste des patients
     */
    loadPatients() {
        const patients = storage.get('patients') || [];
        this.displayPatients(patients);
    }

    /**
     * Affiche les patients dans le tableau
     * @param {object[]} patients - Liste des patients à afficher
     */
    displayPatients(patients) {
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        Aucun patient enregistré
                    </td>
                </tr>
            `;
            return;
        }

        patients.forEach(patient => {
            const row = this.createPatientRow(patient);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour un patient
     * @param {object} patient - Données du patient
     * @return {HTMLElement} Ligne de tableau
     */
    createPatientRow(patient) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${this.escapeHtml(patient.nom)}</td>
            <td>${this.escapeHtml(patient.prenom)}</td>
            <td>${patient.age}</td>
            <td>${patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</td>
            <td>${this.escapeHtml(patient.telephone)}</td>
            <td>${this.escapeHtml(patient.adresse)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="patientsManager.editPatient(${patient.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="patientsManager.deletePatient(${patient.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Prépare le formulaire pour la modification d'un patient
     * @param {number} id - ID du patient à modifier
     */
    editPatient(id) {
        const patient = storage.findById('patients', parseInt(id));

        if (!patient) {
            this.showNotification('Patient non trouvé', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('patient-id').value = patient.id;
        document.getElementById('nom').value = patient.nom;
        document.getElementById('prenom').value = patient.prenom;
        document.getElementById('age').value = patient.age;
        document.getElementById('sexe').value = patient.sexe;
        document.getElementById('telephone').value = patient.telephone;
        document.getElementById('email').value = patient.email || '';
        document.getElementById('adresse').value = patient.adresse;
        document.getElementById('historique-medical').value = patient.historiqueMedical || '';

        // Mettre à jour le titre
        document.getElementById('form-title').textContent = 'Modifier un Patient';

        // Stocker l'ID en cours d'édition
        this.currentEditId = patient.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
        }

        document.getElementById('patient-id').value = '';
        document.getElementById('form-title').textContent = 'Ajouter un Patient';
        this.currentEditId = null;
    }

    /**
     * Gère la recherche de patients
     * @param {string} searchTerm - Terme de recherche
     */
    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadPatients();
            return;
        }

        const results = storage.search('patients', searchTerm, [
            'nom', 'prenom', 'telephone', 'email', 'adresse'
        ]);

        this.displayPatients(results);
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, info, warning)
     */
    showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;

        // Couleurs selon le type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Contenu
        notification.textContent = message;

        // Ajouter au DOM
        document.body.appendChild(notification);

        // Supprimer automatiquement après 3 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * Échappe les caractères HTML pour éviter les injections
     * @param {string} text - Texte à échapper
     * @return {string} Texte échappé
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Exporte les patients au format CSV
     */
    exportToCSV() {
        const patients = storage.get('patients') || [];

        if (patients.length === 0) {
            this.showNotification('Aucun patient à exporter', 'warning');
            return;
        }

        // En-têtes CSV
        const headers = [
            'ID', 'Nom', 'Prénom', 'Âge', 'Sexe',
            'Téléphone', 'Email', 'Adresse', 'Historique Médical'
        ];

        // Contenu CSV
        const csvContent = [
            headers.join(','),
            ...patients.map(patient => [
                patient.id,
                `"${this.escapeCsv(patient.nom)}"`,
                `"${this.escapeCsv(patient.prenom)}"`,
                patient.age,
                patient.sexe,
                `"${this.escapeCsv(patient.telephone)}"`,
                `"${this.escapeCsv(patient.email || '')}"`,
                `"${this.escapeCsv(patient.adresse)}"`,
                `"${this.escapeCsv(patient.historiqueMedical || '')}"`
            ].join(','))
        ].join('\n');

        // Téléchargement
        this.downloadFile(csvContent, 'patients.csv', 'text/csv');
    }

    /**
     * Échappe les caractères pour CSV
     * @param {string} text - Texte à échapper
     * @return {string} Texte échappé
     */
    escapeCsv(text) {
        return text.replace(/"/g, '""');
    }

    /**
     * Télécharge un fichier
     * @param {string} content - Contenu du fichier
     * @param {string} filename - Nom du fichier
     * @param {string} contentType - Type MIME
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialisation du gestionnaire
let patientsManager;

// Démarrage lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    patientsManager = new PatientsManager();
});

// Export pour utilisation globale
window.patientsManager = patientsManager;
