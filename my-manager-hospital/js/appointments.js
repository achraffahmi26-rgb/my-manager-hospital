/**
 * Module de gestion des rendez-vous
 * CRUD complet avec gestion des conflits d'horaire
 */

class AppointmentsManager {
    constructor() {
        this.currentEditId = null;
        this.initializeEventListeners();
        this.loadAppointments();
        this.loadPatientsAndDoctors();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Formulaire d'ajout/modification
        const form = document.getElementById('appointment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Bouton d'annulation
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetForm());
        }

        // Recherche
        const searchInput = document.getElementById('search-appointments');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Filtre par date
        const filterDate = document.getElementById('filter-date');
        if (filterDate) {
            filterDate.addEventListener('change', (e) => this.handleDateFilter(e.target.value));
        }

        // Validation en temps réel
        const dateInput = document.getElementById('date');
        const timeInput = document.getElementById('heure');
        const doctorSelect = document.getElementById('doctor-id');

        if (dateInput) dateInput.addEventListener('change', () => this.validateDateTime());
        if (timeInput) timeInput.addEventListener('change', () => this.validateDateTime());
        if (doctorSelect) doctorSelect.addEventListener('change', () => this.validateDateTime());
    }

    /**
     * Charge les patients et médecins dans les sélecteurs
     */
    loadPatientsAndDoctors() {
        const patients = storage.get('patients') || [];
        const doctors = storage.get('doctors') || [];

        // Remplir le sélecteur de patients
        const patientSelect = document.getElementById('patient-id');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Sélectionner un patient</option>';
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.prenom} ${patient.nom} - ${patient.age} ans`;
                patientSelect.appendChild(option);
            });
        }

        // Remplir le sélecteur de médecins
        const doctorSelect = document.getElementById('doctor-id');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">Sélectionner un médecin</option>';
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `Dr. ${doctor.prenom} ${doctor.nom} - ${doctor.specialite}`;
                doctorSelect.appendChild(option);
            });
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

        // Vérification des conflits
        if (this.hasConflict(formData)) {
            if (!confirm('Un conflit d\'horaire existe pour ce médecin. Voulez-vous quand même enregistrer?')) {
                return;
            }
        }

        if (this.currentEditId) {
            // Mode modification
            this.updateAppointment(this.currentEditId, formData);
        } else {
            // Mode ajout
            this.addAppointment(formData);
        }
    }

    /**
     * Récupère les données du formulaire
     * @return {object} Données du formulaire
     */
    getFormData() {
        return {
            patientId: parseInt(document.getElementById('patient-id').value),
            doctorId: parseInt(document.getElementById('doctor-id').value),
            date: document.getElementById('date').value,
            heure: document.getElementById('heure').value,
            duree: parseInt(document.getElementById('duree').value) || 30,
            statut: document.getElementById('statut').value,
            motif: document.getElementById('motif').value.trim(),
            notes: document.getElementById('notes').value.trim()
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
        if (!data.patientId) errors.push('Le patient est obligatoire');
        if (!data.doctorId) errors.push('Le médecin est obligatoire');
        if (!data.date) errors.push('La date est obligatoire');
        if (!data.heure) errors.push('L\'heure est obligatoire');

        // Validation de la date (pas dans le passé)
        if (data.date) {
            const appointmentDate = new Date(`${data.date}T${data.heure}`);
            const now = new Date();
            if (appointmentDate < now) {
                errors.push('La date du rendez-vous ne peut pas être dans le passé');
            }
        }

        // Validation de la durée
        if (data.duree && (data.duree < 15 || data.duree > 240)) {
            errors.push('La durée doit être comprise entre 15 et 240 minutes');
        }

        // Affichage des erreurs
        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Vérifie s'il y a un conflit d'horaire
     * @param {object} appointment - Données du rendez-vous
     * @return {boolean} True s'il y a conflit, false sinon
     */
    hasConflict(appointment) {
        const appointments = storage.get('appointments') || [];

        return appointments.some(apt => {
            // Ignorer le rendez-vous actuel en cas de modification
            if (this.currentEditId && apt.id === this.currentEditId) {
                return false;
            }

            // Vérifier si c'est le même médecin et le même jour
            if (apt.doctorId !== appointment.doctorId || apt.date !== appointment.date) {
                return false;
            }

            // Calculer les heures de début et de fin
            const aptStart = this.timeToMinutes(apt.heure);
            const aptEnd = aptStart + (apt.duree || 30);
            const newStart = this.timeToMinutes(appointment.heure);
            const newEnd = newStart + (appointment.duree || 30);

            // Vérifier le chevauchement
            return (newStart < aptEnd && newEnd > aptStart);
        });
    }

    /**
     * Convertit une heure en minutes
     * @param {string} time - Heure au format HH:MM
     * @return {number} Heure en minutes
     */
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Valide la date et l'heure en temps réel
     */
    validateDateTime() {
        const date = document.getElementById('date').value;
        const time = document.getElementById('heure').value;
        const doctorId = document.getElementById('doctor-id').value;

        if (date && time && doctorId) {
            const appointment = {
                doctorId: parseInt(doctorId),
                date: date,
                heure: time,
                duree: parseInt(document.getElementById('duree').value) || 30
            };

            if (this.hasConflict(appointment)) {
                this.showWarning('Conflit d\'horaire détecté pour ce médecin');
            }
        }
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
     * Affiche un avertissement
     * @param {string} message - Message d'avertissement
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Ajoute un nouveau rendez-vous
     * @param {object} appointmentData - Données du rendez-vous
     */
    addAppointment(appointmentData) {
        try {
            const newAppointment = storage.add('appointments', appointmentData);

            if (newAppointment) {
                this.showNotification('Rendez-vous ajouté avec succès!', 'success');
                this.resetForm();
                this.loadAppointments();
            } else {
                this.showNotification('Erreur lors de l\'ajout du rendez-vous', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du rendez-vous:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour un rendez-vous existant
     * @param {number} id - ID du rendez-vous
     * @param {object} appointmentData - Nouvelles données
     */
    updateAppointment(id, appointmentData) {
        try {
            const updatedAppointment = storage.update('appointments', parseInt(id), appointmentData);

            if (updatedAppointment) {
                this.showNotification('Rendez-vous mis à jour avec succès!', 'success');
                this.resetForm();
                this.loadAppointments();
            } else {
                this.showNotification('Erreur lors de la mise à jour du rendez-vous', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du rendez-vous:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime un rendez-vous
     * @param {number} id - ID du rendez-vous à supprimer
     */
    deleteAppointment(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous?')) {
            return;
        }

        try {
            const success = storage.delete('appointments', parseInt(id));

            if (success) {
                this.showNotification('Rendez-vous supprimé avec succès!', 'success');
                this.loadAppointments();
            } else {
                this.showNotification('Erreur lors de la suppression du rendez-vous', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du rendez-vous:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Charge et affiche la liste des rendez-vous
     */
    loadAppointments() {
        const appointments = storage.get('appointments') || [];
        this.displayAppointments(appointments);
    }

    /**
     * Affiche les rendez-vous dans le tableau
     * @param {object[]} appointments - Liste des rendez-vous à afficher
     */
    displayAppointments(appointments) {
        const tbody = document.getElementById('appointments-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        Aucun rendez-vous enregistré
                    </td>
                </tr>
            `;
            return;
        }

        // Trier par date et heure
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.heure}`);
            const dateB = new Date(`${b.date}T${b.heure}`);
            return dateA - dateB;
        });

        appointments.forEach(appointment => {
            const row = this.createAppointmentRow(appointment);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour un rendez-vous
     * @param {object} appointment - Données du rendez-vous
     * @return {HTMLElement} Ligne de tableau
     */
    createAppointmentRow(appointment) {
        const patient = storage.findById('patients', appointment.patientId);
        const doctor = storage.findById('doctors', appointment.doctorId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.id}</td>
            <td>${patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}</td>
            <td>${doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : 'Médecin inconnu'}</td>
            <td>${new Date(appointment.date).toLocaleDateString('fr-FR')}</td>
            <td>${appointment.heure}</td>
            <td>${appointment.duree || 30} min</td>
            <td><span class="badge badge-${this.getStatusClass(appointment.statut)}">${appointment.statut}</span></td>
            <td>${this.escapeHtml(appointment.motif || '-')}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="appointmentsManager.editAppointment(${appointment.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="appointmentsManager.deleteAppointment(${appointment.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Retourne la classe CSS pour le statut
     * @param {string} status - Statut du rendez-vous
     * @return {string} Classe CSS
     */
    getStatusClass(status) {
        const classes = {
            'Programmé': 'info',
            'Confirmé': 'success',
            'En cours': 'warning',
            'Terminé': 'secondary',
            'Annulé': 'danger'
        };
        return classes[status] || 'secondary';
    }

    /**
     * Prépare le formulaire pour la modification d'un rendez-vous
     * @param {number} id - ID du rendez-vous à modifier
     */
    editAppointment(id) {
        const appointment = storage.findById('appointments', parseInt(id));

        if (!appointment) {
            this.showNotification('Rendez-vous non trouvé', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('appointment-id').value = appointment.id;
        document.getElementById('patient-id').value = appointment.patientId;
        document.getElementById('doctor-id').value = appointment.doctorId;
        document.getElementById('date').value = appointment.date;
        document.getElementById('heure').value = appointment.heure;
        document.getElementById('duree').value = appointment.duree || 30;
        document.getElementById('statut').value = appointment.statut;
        document.getElementById('motif').value = appointment.motif || '';
        document.getElementById('notes').value = appointment.notes || '';

        // Mettre à jour le titre
        document.getElementById('form-title').textContent = 'Modifier un Rendez-vous';

        // Stocker l'ID en cours d'édition
        this.currentEditId = appointment.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        const form = document.getElementById('appointment-form');
        if (form) {
            form.reset();
        }

        document.getElementById('appointment-id').value = '';
        document.getElementById('form-title').textContent = 'Ajouter un Rendez-vous';
        this.currentEditId = null;
    }

    /**
     * Gère la recherche de rendez-vous
     * @param {string} searchTerm - Terme de recherche
     */
    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadAppointments();
            return;
        }

        const appointments = storage.get('appointments') || [];
        const results = appointments.filter(apt => {
            const patient = storage.findById('patients', apt.patientId);
            const doctor = storage.findById('doctors', apt.doctorId);

            const patientName = patient ? `${patient.prenom} ${patient.nom}`.toLowerCase() : '';
            const doctorName = doctor ? `${doctor.prenom} ${doctor.nom}`.toLowerCase() : '';
            const motif = (apt.motif || '').toLowerCase();
            const term = searchTerm.toLowerCase();

            return patientName.includes(term) ||
                doctorName.includes(term) ||
                motif.includes(term) ||
                apt.date.includes(term) ||
                apt.heure.includes(term);
        });

        this.displayAppointments(results);
    }

    /**
     * Gère le filtrage par date
     * @param {string} date - Date de filtrage
     */
    handleDateFilter(date) {
        if (!date) {
            this.loadAppointments();
            return;
        }

        const appointments = storage.get('appointments') || [];
        const filtered = appointments.filter(apt => apt.date === date);

        this.displayAppointments(filtered);
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
     * Exporte les rendez-vous au format CSV
     */
    exportToCSV() {
        const appointments = storage.get('appointments') || [];

        if (appointments.length === 0) {
            this.showNotification('Aucun rendez-vous à exporter', 'warning');
            return;
        }

        // En-têtes CSV
        const headers = [
            'ID', 'Patient', 'Médecin', 'Date', 'Heure', 'Durée', 'Statut', 'Motif'
        ];

        // Contenu CSV
        const csvContent = [
            headers.join(','),
            ...appointments.map(apt => {
                const patient = storage.findById('patients', apt.patientId);
                const doctor = storage.findById('doctors', apt.doctorId);

                return [
                    apt.id,
                    `"${this.escapeCsv(patient ? `${patient.prenom} ${patient.nom}` : 'Inconnu')}"`,
                    `"${this.escapeCsv(doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : 'Inconnu')}"`,
                    apt.date,
                    apt.heure,
                    apt.duree || 30,
                    `"${apt.statut}"`,
                    `"${this.escapeCsv(apt.motif || '')}"`
                ].join(',');
            })
        ].join('\n');

        // Téléchargement
        this.downloadFile(csvContent, 'rendez-vous.csv', 'text/csv');
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
let appointmentsManager;

// Démarrage lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    appointmentsManager = new AppointmentsManager();
});

// Export pour utilisation globale
window.appointmentsManager = appointmentsManager;
