/**
 * Module de gestion des chambres et admissions
 * CRUD complet pour chambres et gestion des admissions/sorties
 */

class RoomsManager {
    constructor() {
        this.currentRoomEditId = null;
        this.currentAdmissionEditId = null;
        this.initializeEventListeners();
        this.loadRooms();
        this.loadAdmissions();
        this.loadPatients();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Formulaire chambres
        const roomForm = document.getElementById('room-form');
        if (roomForm) {
            roomForm.addEventListener('submit', (e) => this.handleRoomSubmit(e));
        }

        // Formulaire admissions
        const admissionForm = document.getElementById('admission-form');
        if (admissionForm) {
            admissionForm.addEventListener('submit', (e) => this.handleAdmissionSubmit(e));
        }

        // Boutons d'annulation
        const roomCancelBtn = document.getElementById('room-cancel-btn');
        if (roomCancelBtn) {
            roomCancelBtn.addEventListener('click', () => this.resetRoomForm());
        }

        const admissionCancelBtn = document.getElementById('admission-cancel-btn');
        if (admissionCancelBtn) {
            admissionCancelBtn.addEventListener('click', () => this.resetAdmissionForm());
        }

        // Recherche et filtres
        const searchRooms = document.getElementById('search-rooms');
        if (searchRooms) {
            searchRooms.addEventListener('input', (e) => this.handleRoomSearch(e.target.value));
        }

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }

        const searchAdmissions = document.getElementById('search-admissions');
        if (searchAdmissions) {
            searchAdmissions.addEventListener('input', (e) => this.handleAdmissionSearch(e.target.value));
        }

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    /**
     * Change l'onglet actif
     * @param {string} tabName - Nom de l'onglet
     */
    switchTab(tabName) {
        // Masquer tous les contenus
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Désactiver tous les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activer l'onglet sélectionné
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    /**
     * Charge les patients pour les admissions
     */
    loadPatients() {
        const patients = storage.get('patients') || [];
        const rooms = storage.get('rooms') || [];

        // Remplir le sélecteur de patients
        const patientSelect = document.getElementById('admission-patient-id');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Sélectionner un patient</option>';
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.prenom} ${patient.nom} - ${patient.age} ans`;
                patientSelect.appendChild(option);
            });
        }

        // Remplir le sélecteur de chambres
        const roomSelect = document.getElementById('admission-chambre-id');
        if (roomSelect) {
            roomSelect.innerHTML = '<option value="">Sélectionner une chambre</option>';
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                const available = room.litsOccupes < room.capacite;
                const status = available ? 'Disponible' : 'Complète';
                option.textContent = `Chambre ${room.numero} - ${room.type} - ${status}`;
                option.disabled = !available;
                roomSelect.appendChild(option);
            });
        }
    }

    // ===== CHAMBRES =====

    /**
     * Gère la soumission du formulaire chambres
     * @param {Event} e - Événement de soumission
     */
    handleRoomSubmit(e) {
        e.preventDefault();

        const formData = this.getRoomFormData();

        if (!this.validateRoomFormData(formData)) {
            return;
        }

        if (this.currentRoomEditId) {
            this.updateRoom(this.currentRoomEditId, formData);
        } else {
            this.addRoom(formData);
        }
    }

    /**
     * Récupère les données du formulaire chambres
     * @return {object} Données du formulaire
     */
    getRoomFormData() {
        return {
            numero: document.getElementById('numero-chambre').value.trim(),
            etage: parseInt(document.getElementById('etage').value),
            type: document.getElementById('type-chambre').value,
            capacite: parseInt(document.getElementById('capacite').value),
            prixParJour: parseFloat(document.getElementById('prix-par-jour').value) || 0,
            service: document.getElementById('service').value,
            equipements: document.getElementById('equipements').value.trim(),
            statut: document.getElementById('statut-chambre').value
        };
    }

    /**
     * Valide les données du formulaire chambres
     * @param {object} data - Données à valider
     * @return {boolean} True si valide, false sinon
     */
    validateRoomFormData(data) {
        const errors = [];

        if (!data.numero) errors.push('Le numéro de chambre est obligatoire');
        if (data.etage < 0) errors.push('L\'étage ne peut pas être négatif');
        if (!data.type) errors.push('Le type de chambre est obligatoire');
        if (data.capacite < 1 || data.capacite > 10) errors.push('La capacité doit être entre 1 et 10');
        if (data.prixParJour < 0) errors.push('Le prix par jour ne peut pas être négatif');
        if (!data.service) errors.push('Le service est obligatoire');

        // Vérifier si le numéro existe déjà (en mode ajout)
        if (!this.currentRoomEditId) {
            const existingRoom = storage.get('rooms').find(r => r.numero === data.numero);
            if (existingRoom) {
                errors.push('Ce numéro de chambre existe déjà');
            }
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Ajoute une nouvelle chambre
     * @param {object} roomData - Données de la chambre
     */
    addRoom(roomData) {
        try {
            // Initialiser les lits occupés à 0
            roomData.litsOccupes = 0;

            const newRoom = storage.add('rooms', roomData);

            if (newRoom) {
                this.showNotification('Chambre ajoutée avec succès!', 'success');
                this.resetRoomForm();
                this.loadRooms();
                this.loadPatients(); // Recharger pour les admissions
            } else {
                this.showNotification('Erreur lors de l\'ajout de la chambre', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la chambre:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour une chambre existante
     * @param {number} id - ID de la chambre
     * @param {object} roomData - Nouvelles données
     */
    updateRoom(id, roomData) {
        try {
            // Récupérer la chambre actuelle pour préserver les lits occupés
            const currentRoom = storage.findById('rooms', parseInt(id));
            if (currentRoom) {
                roomData.litsOccupes = currentRoom.litsOccupes;
            }

            const updatedRoom = storage.update('rooms', parseInt(id), roomData);

            if (updatedRoom) {
                this.showNotification('Chambre mise à jour avec succès!', 'success');
                this.resetRoomForm();
                this.loadRooms();
                this.loadPatients(); // Recharger pour les admissions
            } else {
                this.showNotification('Erreur lors de la mise à jour de la chambre', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la chambre:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime une chambre
     * @param {number} id - ID de la chambre à supprimer
     */
    deleteRoom(id) {
        const room = storage.findById('rooms', parseInt(id));

        if (room && room.litsOccupes > 0) {
            this.showNotification('Impossible de supprimer une chambre occupée', 'error');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir supprimer cette chambre?')) {
            return;
        }

        try {
            const success = storage.delete('rooms', parseInt(id));

            if (success) {
                this.showNotification('Chambre supprimée avec succès!', 'success');
                this.loadRooms();
                this.loadPatients(); // Recharger pour les admissions
            } else {
                this.showNotification('Erreur lors de la suppression de la chambre', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la chambre:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Charge et affiche la liste des chambres
     */
    loadRooms() {
        const rooms = storage.get('rooms') || [];
        this.displayRooms(rooms);
    }

    /**
     * Affiche les chambres dans le tableau
     * @param {object[]} rooms - Liste des chambres à afficher
     */
    displayRooms(rooms) {
        const tbody = document.getElementById('rooms-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (rooms.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        Aucune chambre enregistrée
                    </td>
                </tr>
            `;
            return;
        }

        // Trier par numéro
        rooms.sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numA - numB;
        });

        rooms.forEach(room => {
            const row = this.createRoomRow(room);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour une chambre
     * @param {object} room - Données de la chambre
     * @return {HTMLElement} Ligne de tableau
     */
    createRoomRow(room) {
        const row = document.createElement('tr');

        // Déterminer le statut visuel
        let statusClass = 'success';
        if (room.statut === 'Occupée' || room.litsOccupes >= room.capacite) {
            statusClass = 'danger';
        } else if (room.statut === 'Maintenance') {
            statusClass = 'warning';
        } else if (room.statut === 'Réservée') {
            statusClass = 'info';
        }

        const occupationRate = Math.round((room.litsOccupes / room.capacite) * 100);

        row.innerHTML = `
            <td>${room.id}</td>
            <td>${this.escapeHtml(room.numero)}</td>
            <td>${room.etage}</td>
            <td>${this.escapeHtml(room.type)}</td>
            <td>${room.capacite}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>${room.litsOccupes}/${room.capacite}</span>
                    <div style="width: 50px; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${occupationRate}%; height: 100%; background: ${occupationRate === 100 ? '#dc3545' : occupationRate > 75 ? '#ffc107' : '#28a745'};"></div>
                    </div>
                </div>
            </td>
            <td>${this.escapeHtml(room.service)}</td>
            <td>${room.prixParJour.toFixed(2)}€</td>
            <td><span class="badge badge-${statusClass}">${room.statut}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="roomsManager.editRoom(${room.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roomsManager.deleteRoom(${room.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Prépare le formulaire pour la modification d'une chambre
     * @param {number} id - ID de la chambre à modifier
     */
    editRoom(id) {
        const room = storage.findById('rooms', parseInt(id));

        if (!room) {
            this.showNotification('Chambre non trouvée', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('room-id').value = room.id;
        document.getElementById('numero-chambre').value = room.numero;
        document.getElementById('etage').value = room.etage;
        document.getElementById('type-chambre').value = room.type;
        document.getElementById('capacite').value = room.capacite;
        document.getElementById('prix-par-jour').value = room.prixParJour;
        document.getElementById('service').value = room.service;
        document.getElementById('equipements').value = room.equipements || '';
        document.getElementById('statut-chambre').value = room.statut;

        // Mettre à jour le titre
        document.getElementById('room-form-title').textContent = 'Modifier une Chambre';

        // Stocker l'ID en cours d'édition
        this.currentRoomEditId = room.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire chambres
     */
    resetRoomForm() {
        const form = document.getElementById('room-form');
        if (form) {
            form.reset();
        }

        document.getElementById('room-id').value = '';
        document.getElementById('room-form-title').textContent = 'Ajouter une Chambre';
        this.currentRoomEditId = null;
    }

    /**
     * Gère la recherche de chambres
     * @param {string} searchTerm - Terme de recherche
     */
    handleRoomSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadRooms();
            return;
        }

        const results = storage.search('rooms', searchTerm, [
            'numero', 'type', 'service', 'equipements'
        ]);

        this.displayRooms(results);
    }

    /**
     * Gère le filtrage par statut
     * @param {string} status - Statut de filtrage
     */
    handleStatusFilter(status) {
        if (!status) {
            this.loadRooms();
            return;
        }

        const rooms = storage.get('rooms') || [];
        const filtered = rooms.filter(room => room.statut === status);

        this.displayRooms(filtered);
    }

    // ===== ADMISSIONS =====

    /**
     * Gère la soumission du formulaire admissions
     * @param {Event} e - Événement de soumission
     */
    handleAdmissionSubmit(e) {
        e.preventDefault();

        const formData = this.getAdmissionFormData();

        if (!this.validateAdmissionFormData(formData)) {
            return;
        }

        if (this.currentAdmissionEditId) {
            this.updateAdmission(this.currentAdmissionEditId, formData);
        } else {
            this.addAdmission(formData);
        }
    }

    /**
     * Récupère les données du formulaire admissions
     * @return {object} Données du formulaire
     */
    getAdmissionFormData() {
        return {
            patientId: parseInt(document.getElementById('admission-patient-id').value),
            roomId: parseInt(document.getElementById('admission-chambre-id').value),
            dateAdmission: document.getElementById('date-admission').value,
            heureAdmission: document.getElementById('heure-admission').value,
            motifAdmission: document.getElementById('motif-admission').value.trim(),
            statutAdmission: document.getElementById('statut-admission').value,
            dateSortie: document.getElementById('date-sortie').value,
            heureSortie: document.getElementById('heure-sortie').value,
            notesAdmission: document.getElementById('notes-admission').value.trim()
        };
    }

    /**
     * Valide les données du formulaire admissions
     * @param {object} data - Données à valider
     * @return {boolean} True si valide, false sinon
     */
    validateAdmissionFormData(data) {
        const errors = [];

        if (!data.patientId) errors.push('Le patient est obligatoire');
        if (!data.roomId) errors.push('La chambre est obligatoire');
        if (!data.dateAdmission) errors.push('La date d\'admission est obligatoire');
        if (!data.heureAdmission) errors.push('L\'heure d\'admission est obligatoire');
        if (!data.motifAdmission) errors.push('Le motif d\'admission est obligatoire');

        // Validation des dates
        if (data.dateAdmission && data.dateSortie) {
            const admissionDate = new Date(`${data.dateAdmission}T${data.heureAdmission}`);
            const sortieDate = new Date(`${data.dateSortie}T${data.heureSortie || '00:00'}`);

            if (sortieDate < admissionDate) {
                errors.push('La date de sortie ne peut pas être antérieure à la date d\'admission');
            }
        }

        // Vérifier la disponibilité de la chambre (en mode ajout)
        if (!this.currentAdmissionEditId) {
            const room = storage.findById('rooms', data.roomId);
            if (room && room.litsOccupes >= room.capacite) {
                errors.push('La chambre sélectionnée est complète');
            }
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Ajoute une nouvelle admission
     * @param {object} admissionData - Données de l'admission
     */
    addAdmission(admissionData) {
        try {
            const newAdmission = storage.add('admissions', admissionData);

            if (newAdmission) {
                // Mettre à jour le nombre de lits occupés dans la chambre
                this.updateRoomOccupation(admissionData.roomId, 1);

                // Mettre à jour le statut de la chambre si nécessaire
                this.updateRoomStatus(admissionData.roomId);

                this.showNotification('Admission ajoutée avec succès!', 'success');
                this.resetAdmissionForm();
                this.loadAdmissions();
                this.loadRooms();
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de l\'ajout de l\'admission', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'admission:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour une admission existante
     * @param {number} id - ID de l'admission
     * @param {object} admissionData - Nouvelles données
     */
    updateAdmission(id, admissionData) {
        try {
            const oldAdmission = storage.findById('admissions', parseInt(id));

            const updatedAdmission = storage.update('admissions', parseInt(id), admissionData);

            if (updatedAdmission) {
                // Gérer les changements de chambre
                if (oldAdmission && oldAdmission.roomId !== admissionData.roomId) {
                    this.updateRoomOccupation(oldAdmission.roomId, -1);
                    this.updateRoomOccupation(admissionData.roomId, 1);
                    this.updateRoomStatus(oldAdmission.roomId);
                }

                // Gérer les sorties
                if (oldAdmission && oldAdmission.statutAdmission !== 'Sorti' && admissionData.statutAdmission === 'Sorti') {
                    this.updateRoomOccupation(admissionData.roomId, -1);
                }

                this.updateRoomStatus(admissionData.roomId);

                this.showNotification('Admission mise à jour avec succès!', 'success');
                this.resetAdmissionForm();
                this.loadAdmissions();
                this.loadRooms();
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de la mise à jour de l\'admission', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'admission:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime une admission
     * @param {number} id - ID de l'admission à supprimer
     */
    deleteAdmission(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette admission?')) {
            return;
        }

        try {
            const admission = storage.findById('admissions', parseInt(id));

            const success = storage.delete('admissions', parseInt(id));

            if (success) {
                // Libérer le lit dans la chambre
                if (admission && admission.statutAdmission !== 'Sorti') {
                    this.updateRoomOccupation(admission.roomId, -1);
                    this.updateRoomStatus(admission.roomId);
                }

                this.showNotification('Admission supprimée avec succès!', 'success');
                this.loadAdmissions();
                this.loadRooms();
                this.loadPatients();
            } else {
                this.showNotification('Erreur lors de la suppression de l\'admission', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'admission:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour le nombre de lits occupés dans une chambre
     * @param {number} roomId - ID de la chambre
     * @param {number} change - Changement (+1 ou -1)
     */
    updateRoomOccupation(roomId, change) {
        const room = storage.findById('rooms', roomId);
        if (room) {
            const newOccupation = Math.max(0, Math.min(room.capacite, room.litsOccupes + change));
            storage.update('rooms', roomId, { litsOccupes: newOccupation });
        }
    }

    /**
     * Met à jour le statut d'une chambre en fonction de son occupation
     * @param {number} roomId - ID de la chambre
     */
    updateRoomStatus(roomId) {
        const room = storage.findById('rooms', roomId);
        if (room) {
            let newStatus = 'Disponible';

            if (room.litsOccupes >= room.capacite) {
                newStatus = 'Occupée';
            } else if (room.litsOccupes > 0) {
                newStatus = 'Occupée'; // Partiellement occupée
            }

            // Ne pas écraser les statuts spéciaux comme Maintenance
            if (room.statut !== 'Maintenance' && room.statut !== 'Réservée') {
                storage.update('rooms', roomId, { statut: newStatus });
            }
        }
    }

    /**
     * Charge et affiche la liste des admissions
     */
    loadAdmissions() {
        const admissions = storage.get('admissions') || [];
        this.displayAdmissions(admissions);
    }

    /**
     * Affiche les admissions dans le tableau
     * @param {object[]} admissions - Liste des admissions à afficher
     */
    displayAdmissions(admissions) {
        const tbody = document.getElementById('admissions-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (admissions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        Aucune admission enregistrée
                    </td>
                </tr>
            `;
            return;
        }

        // Trier par date (plus récent en premier)
        admissions.sort((a, b) => new Date(b.dateAdmission) - new Date(a.dateAdmission));

        admissions.forEach(admission => {
            const row = this.createAdmissionRow(admission);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour une admission
     * @param {object} admission - Données de l'admission
     * @return {HTMLElement} Ligne de tableau
     */
    createAdmissionRow(admission) {
        const patient = storage.findById('patients', admission.patientId);
        const room = storage.findById('rooms', admission.roomId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admission.id}</td>
            <td>${patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}</td>
            <td>${room ? `Chambre ${room.numero}` : 'Chambre inconnue'}</td>
            <td>${new Date(admission.dateAdmission).toLocaleDateString('fr-FR')} ${admission.heureAdmission}</td>
            <td>${admission.dateSortie ? new Date(admission.dateSortie).toLocaleDateString('fr-FR') + ' ' + (admission.heureSortie || '') : '-'}</td>
            <td>${this.escapeHtml(admission.motifAdmission)}</td>
            <td><span class="badge badge-${this.getAdmissionStatusClass(admission.statutAdmission)}">${admission.statutAdmission}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="roomsManager.editAdmission(${admission.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roomsManager.deleteAdmission(${admission.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Retourne la classe CSS pour le statut d'admission
     * @param {string} status - Statut de l'admission
     * @return {string} Classe CSS
     */
    getAdmissionStatusClass(status) {
        const classes = {
            'Actif': 'success',
            'Transféré': 'info',
            'Sorti': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    /**
     * Prépare le formulaire pour la modification d'une admission
     * @param {number} id - ID de l'admission à modifier
     */
    editAdmission(id) {
        const admission = storage.findById('admissions', parseInt(id));

        if (!admission) {
            this.showNotification('Admission non trouvée', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('admission-id').value = admission.id;
        document.getElementById('admission-patient-id').value = admission.patientId;
        document.getElementById('admission-chambre-id').value = admission.roomId;
        document.getElementById('date-admission').value = admission.dateAdmission;
        document.getElementById('heure-admission').value = admission.heureAdmission;
        document.getElementById('motif-admission').value = admission.motifAdmission;
        document.getElementById('statut-admission').value = admission.statutAdmission;
        document.getElementById('date-sortie').value = admission.dateSortie || '';
        document.getElementById('heure-sortie').value = admission.heureSortie || '';
        document.getElementById('notes-admission').value = admission.notesAdmission || '';

        // Mettre à jour le titre
        document.getElementById('admission-form-title').textContent = 'Modifier une Admission';

        // Stocker l'ID en cours d'édition
        this.currentAdmissionEditId = admission.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire admissions
     */
    resetAdmissionForm() {
        const form = document.getElementById('admission-form');
        if (form) {
            form.reset();
        }

        document.getElementById('admission-id').value = '';
        document.getElementById('admission-form-title').textContent = 'Ajouter une Admission';
        this.currentAdmissionEditId = null;
    }

    /**
     * Gère la recherche d'admissions
     * @param {string} searchTerm - Terme de recherche
     */
    handleAdmissionSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadAdmissions();
            return;
        }

        const admissions = storage.get('admissions') || [];
        const results = admissions.filter(admission => {
            const patient = storage.findById('patients', admission.patientId);
            const room = storage.findById('rooms', admission.roomId);

            const patientName = patient ? `${patient.prenom} ${patient.nom}`.toLowerCase() : '';
            const roomNumber = room ? room.numero.toLowerCase() : '';
            const motif = (admission.motifAdmission || '').toLowerCase();
            const term = searchTerm.toLowerCase();

            return patientName.includes(term) ||
                roomNumber.includes(term) ||
                motif.includes(term) ||
                admission.dateAdmission.includes(term);
        });

        this.displayAdmissions(results);
    }

    // ===== UTILITAIRES =====

    /**
     * Affiche les erreurs de validation
     * @param {string[]} errors - Liste des erreurs
     */
    showErrors(errors) {
        const message = errors.join('\n');
        this.showNotification('Erreurs de validation:\n' + message, 'error');
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
let roomsManager;

// Démarrage lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    roomsManager = new RoomsManager();
});

// Export pour utilisation globale
window.roomsManager = roomsManager;
