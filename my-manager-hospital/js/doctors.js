/**
 * Module de gestion des médecins et personnel
 * CRUD complet pour la gestion du personnel médical
 */

class DoctorsManager {
    constructor() {
        this.currentEditId = null;
        this.initializeEventListeners();
        this.loadDoctors();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Formulaire d'ajout/modification
        const form = document.getElementById('doctor-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Bouton d'annulation
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetForm());
        }

        // Recherche
        const searchInput = document.getElementById('search-doctors');
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
            this.updateDoctor(this.currentEditId, formData);
        } else {
            // Mode ajout
            this.addDoctor(formData);
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
            specialite: document.getElementById('specialite').value,
            service: document.getElementById('service').value,
            telephone: document.getElementById('telephone').value.trim(),
            email: document.getElementById('email').value.trim(),
            horaireDebut: document.getElementById('horaire-debut').value,
            horaireFin: document.getElementById('horaire-fin').value,
            adresse: document.getElementById('adresse').value.trim()
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
        if (!data.specialite) errors.push('La spécialité est obligatoire');
        if (!data.service) errors.push('Le service est obligatoire');
        if (!data.telephone) errors.push('Le téléphone est obligatoire');
        if (!data.horaireDebut) errors.push('L\'horaire de début est obligatoire');
        if (!data.horaireFin) errors.push('L\'horaire de fin est obligatoire');

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

        // Validation des horaires
        if (data.horaireDebut && data.horaireFin) {
            if (data.horaireDebut >= data.horaireFin) {
                errors.push('L\'horaire de début doit être antérieur à l\'horaire de fin');
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
     * Ajoute un nouveau médecin
     * @param {object} doctorData - Données du médecin
     */
    addDoctor(doctorData) {
        try {
            const newDoctor = storage.add('doctors', doctorData);

            if (newDoctor) {
                this.showNotification('Médecin ajouté avec succès!', 'success');
                this.resetForm();
                this.loadDoctors();
            } else {
                this.showNotification('Erreur lors de l\'ajout du médecin', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du médecin:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour un médecin existant
     * @param {number} id - ID du médecin
     * @param {object} doctorData - Nouvelles données
     */
    updateDoctor(id, doctorData) {
        try {
            const updatedDoctor = storage.update('doctors', parseInt(id), doctorData);

            if (updatedDoctor) {
                this.showNotification('Médecin mis à jour avec succès!', 'success');
                this.resetForm();
                this.loadDoctors();
            } else {
                this.showNotification('Erreur lors de la mise à jour du médecin', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du médecin:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime un médecin
     * @param {number} id - ID du médecin à supprimer
     */
    deleteDoctor(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce médecin?')) {
            return;
        }

        try {
            const success = storage.delete('doctors', parseInt(id));

            if (success) {
                this.showNotification('Médecin supprimé avec succès!', 'success');
                this.loadDoctors();
            } else {
                this.showNotification('Erreur lors de la suppression du médecin', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du médecin:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Charge et affiche la liste des médecins
     */
    loadDoctors() {
        const doctors = storage.get('doctors') || [];
        this.displayDoctors(doctors);
    }

    /**
     * Affiche les médecins dans le tableau
     * @param {object[]} doctors - Liste des médecins à afficher
     */
    displayDoctors(doctors) {
        const tbody = document.getElementById('doctors-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (doctors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        Aucun médecin enregistré
                    </td>
                </tr>
            `;
            return;
        }

        doctors.forEach(doctor => {
            const row = this.createDoctorRow(doctor);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour un médecin
     * @param {object} doctor - Données du médecin
     * @return {HTMLElement} Ligne de tableau
     */
    createDoctorRow(doctor) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${this.escapeHtml(doctor.nom)}</td>
            <td>${this.escapeHtml(doctor.prenom)}</td>
            <td>${this.escapeHtml(doctor.specialite)}</td>
            <td>${this.escapeHtml(doctor.service)}</td>
            <td>${this.escapeHtml(doctor.telephone)}</td>
            <td>${doctor.horaireDebut} - ${doctor.horaireFin}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="doctorsManager.editDoctor(${doctor.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="doctorsManager.deleteDoctor(${doctor.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Prépare le formulaire pour la modification d'un médecin
     * @param {number} id - ID du médecin à modifier
     */
    editDoctor(id) {
        const doctor = storage.findById('doctors', parseInt(id));

        if (!doctor) {
            this.showNotification('Médecin non trouvé', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('doctor-id').value = doctor.id;
        document.getElementById('nom').value = doctor.nom;
        document.getElementById('prenom').value = doctor.prenom;
        document.getElementById('specialite').value = doctor.specialite;
        document.getElementById('service').value = doctor.service;
        document.getElementById('telephone').value = doctor.telephone;
        document.getElementById('email').value = doctor.email || '';
        document.getElementById('horaire-debut').value = doctor.horaireDebut;
        document.getElementById('horaire-fin').value = doctor.horaireFin;
        document.getElementById('adresse').value = doctor.adresse || '';

        // Mettre à jour le titre
        document.getElementById('form-title').textContent = 'Modifier un Médecin';

        // Stocker l'ID en cours d'édition
        this.currentEditId = doctor.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        const form = document.getElementById('doctor-form');
        if (form) {
            form.reset();
        }

        document.getElementById('doctor-id').value = '';
        document.getElementById('form-title').textContent = 'Ajouter un Médecin';
        this.currentEditId = null;
    }

    /**
     * Gère la recherche de médecins
     * @param {string} searchTerm - Terme de recherche
     */
    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadDoctors();
            return;
        }

        const results = storage.search('doctors', searchTerm, [
            'nom', 'prenom', 'specialite', 'service', 'telephone', 'email'
        ]);

        this.displayDoctors(results);
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
     * Exporte les médecins au format CSV
     */
    exportToCSV() {
        const doctors = storage.get('doctors') || [];

        if (doctors.length === 0) {
            this.showNotification('Aucun médecin à exporter', 'warning');
            return;
        }

        // En-têtes CSV
        const headers = [
            'ID', 'Nom', 'Prénom', 'Spécialité', 'Service',
            'Téléphone', 'Email', 'Horaire Début', 'Horaire Fin', 'Adresse'
        ];

        // Contenu CSV
        const csvContent = [
            headers.join(','),
            ...doctors.map(doctor => [
                doctor.id,
                `"${this.escapeCsv(doctor.nom)}"`,
                `"${this.escapeCsv(doctor.prenom)}"`,
                `"${this.escapeCsv(doctor.specialite)}"`,
                `"${this.escapeCsv(doctor.service)}"`,
                `"${this.escapeCsv(doctor.telephone)}"`,
                `"${this.escapeCsv(doctor.email || '')}"`,
                doctor.horaireDebut,
                doctor.horaireFin,
                `"${this.escapeCsv(doctor.adresse || '')}"`
            ].join(','))
        ].join('\n');

        // Téléchargement
        this.downloadFile(csvContent, 'medecins.csv', 'text/csv');
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

    /**
     * Affiche les statistiques des médecins par spécialité
     */
    showSpecialtyStatistics() {
        const doctors = storage.get('doctors') || [];
        const stats = {};

        doctors.forEach(doctor => {
            stats[doctor.specialite] = (stats[doctor.specialite] || 0) + 1;
        });

        let statsHtml = '<h4>Statistiques par Spécialité</h4><ul>';
        Object.keys(stats).forEach(specialty => {
            statsHtml += `<li>${specialty}: ${stats[specialty]} médecin(s)</li>`;
        });
        statsHtml += '</ul>';

        this.showNotification(statsHtml, 'info');
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
let doctorsManager;

// Démarrage lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    doctorsManager = new DoctorsManager();
});

// Export pour utilisation globale
window.doctorsManager = doctorsManager;
