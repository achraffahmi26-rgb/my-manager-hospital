/**
 * Module de gestion de la pharmacie
 * CRUD complet pour médicaments et prescriptions avec gestion automatique du stock
 */

class PharmacyManager {
    constructor() {
        this.currentMedicamentEditId = null;
        this.currentPrescriptionEditId = null;
        this.initializeEventListeners();
        this.loadMedicaments();
        this.loadPrescriptions();
        this.loadPatientsAndDoctors();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Formulaire médicaments
        const medicamentForm = document.getElementById('medicament-form');
        if (medicamentForm) {
            medicamentForm.addEventListener('submit', (e) => this.handleMedicamentSubmit(e));
        }

        // Formulaire prescriptions
        const prescriptionForm = document.getElementById('prescription-form');
        if (prescriptionForm) {
            prescriptionForm.addEventListener('submit', (e) => this.handlePrescriptionSubmit(e));
        }

        // Boutons d'annulation
        const medicamentCancelBtn = document.getElementById('medicament-cancel-btn');
        if (medicamentCancelBtn) {
            medicamentCancelBtn.addEventListener('click', () => this.resetMedicamentForm());
        }

        const prescriptionCancelBtn = document.getElementById('prescription-cancel-btn');
        if (prescriptionCancelBtn) {
            prescriptionCancelBtn.addEventListener('click', () => this.resetPrescriptionForm());
        }

        // Recherche
        const searchMedicaments = document.getElementById('search-medicaments');
        if (searchMedicaments) {
            searchMedicaments.addEventListener('input', (e) => this.handleMedicamentSearch(e.target.value));
        }

        const searchPrescriptions = document.getElementById('search-prescriptions');
        if (searchPrescriptions) {
            searchPrescriptions.addEventListener('input', (e) => this.handlePrescriptionSearch(e.target.value));
        }

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Validation en temps réel pour le stock
        const stockActuelInput = document.getElementById('stock-actuel');
        const stockMinimumInput = document.getElementById('stock-minimum');

        if (stockActuelInput) {
            stockActuelInput.addEventListener('input', () => this.validateStock());
        }
        if (stockMinimumInput) {
            stockMinimumInput.addEventListener('input', () => this.validateStock());
        }
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
     * Charge les patients et médecins pour les prescriptions
     */
    loadPatientsAndDoctors() {
        const patients = storage.get('patients') || [];
        const doctors = storage.get('doctors') || [];
        const medicaments = storage.get('medicaments') || [];

        // Remplir le sélecteur de patients
        const patientSelect = document.getElementById('prescription-patient-id');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Sélectionner un patient</option>';
            if (patients.length === 0) {
                patientSelect.innerHTML += '<option value="" disabled>Aucun patient disponible - Ajoutez d\'abord des patients</option>';
            } else {
                patients.forEach(patient => {
                    const option = document.createElement('option');
                    option.value = patient.id;
                    option.textContent = `${patient.prenom} ${patient.nom}`;
                    patientSelect.appendChild(option);
                });
            }
        }

        // Remplir le sélecteur de médecins
        const doctorSelect = document.getElementById('prescription-doctor-id');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">Sélectionner un médecin</option>';
            if (doctors.length === 0) {
                doctorSelect.innerHTML += '<option value="" disabled>Aucun médecin disponible - Ajoutez d\'abord des médecins</option>';
            } else {
                doctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;
                    option.textContent = `Dr. ${doctor.prenom} ${doctor.nom}`;
                    doctorSelect.appendChild(option);
                });
            }
        }

        // Remplir le sélecteur de médicaments
        const medicamentSelect = document.getElementById('prescription-medicament-id');
        if (medicamentSelect) {
            medicamentSelect.innerHTML = '<option value="">Sélectionner un médicament</option>';
            if (medicaments.length === 0) {
                medicamentSelect.innerHTML += '<option value="" disabled>Aucun médicament disponible - Ajoutez d\'abord des médicaments</option>';
            } else {
                medicaments.forEach(medicament => {
                    const option = document.createElement('option');
                    option.value = medicament.id;
                    const stockStatus = medicament.stockActuel <= medicament.stockMinimum ? ' (Stock faible)' : '';
                    option.textContent = `${medicament.nom} - ${medicament.dosage}${stockStatus}`;
                    option.disabled = medicament.stockActuel <= 0;
                    medicamentSelect.appendChild(option);
                });
            }
        }

        // Définir la date du jour par défaut
        const dateInput = document.getElementById('date-prescription');
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }

        // Afficher un message d'aide si nécessaire
        if (patients.length === 0 || doctors.length === 0 || medicaments.length === 0) {
            this.showPrescriptionHelpMessage(patients.length, doctors.length, medicaments.length);
        }
    }

    /**
     * Affiche un message d'aide pour les prescriptions
     */
    showPrescriptionHelpMessage(patientsCount, doctorsCount, medicamentsCount) {
        const helpMessage = document.createElement('div');
        helpMessage.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            color: #856404;
        `;

        let message = '⚠️ Pour créer des prescriptions, vous avez besoin de: ';
        const needs = [];

        if (patientsCount === 0) needs.push('patients');
        if (doctorsCount === 0) needs.push('médecins');
        if (medicamentsCount === 0) needs.push('médicaments');

        message += needs.join(', ');
        message += '.<br><br>';
        message += '<strong>Solution:</strong> Ajoutez des patients, médecins et médicaments pour pouvoir créer des prescriptions.';

        helpMessage.innerHTML = message;

        // Insérer le message avant le formulaire
        const prescriptionForm = document.getElementById('prescription-form');
        if (prescriptionForm && !document.querySelector('.prescription-help')) {
            helpMessage.className = 'prescription-help';
            prescriptionForm.parentNode.insertBefore(helpMessage, prescriptionForm);
        }
    }

    // ===== MÉDICAMENTS =====

    /**
     * Gère la soumission du formulaire médicaments
     * @param {Event} e - Événement de soumission
     */
    handleMedicamentSubmit(e) {
        e.preventDefault();

        const formData = this.getMedicamentFormData();

        if (!this.validateMedicamentFormData(formData)) {
            return;
        }

        if (this.currentMedicamentEditId) {
            this.updateMedicament(this.currentMedicamentEditId, formData);
        } else {
            this.addMedicament(formData);
        }
    }

    /**
     * Récupère les données du formulaire médicaments
     * @return {object} Données du formulaire
     */
    getMedicamentFormData() {
        return {
            nom: document.getElementById('nom-medicament').value.trim(),
            code: document.getElementById('code-medicament').value.trim(),
            famille: document.getElementById('famille').value,
            dosage: document.getElementById('dosage').value.trim(),
            stockInitial: parseInt(document.getElementById('stock-initial').value),
            stockActuel: parseInt(document.getElementById('stock-actuel').value),
            stockMinimum: parseInt(document.getElementById('stock-minimum').value),
            prixUnitaire: parseFloat(document.getElementById('prix-unitaire').value) || 0,
            fournisseur: document.getElementById('fournisseur').value.trim(),
            description: document.getElementById('description').value.trim()
        };
    }

    /**
     * Valide les données du formulaire médicaments
     * @param {object} data - Données à valider
     * @return {boolean} True si valide, false sinon
     */
    validateMedicamentFormData(data) {
        const errors = [];

        if (!data.nom) errors.push('Le nom du médicament est obligatoire');
        if (!data.code) errors.push('Le code est obligatoire');
        if (!data.famille) errors.push('La famille est obligatoire');
        if (data.stockInitial < 0) errors.push('Le stock initial ne peut pas être négatif');
        if (data.stockActuel < 0) errors.push('Le stock actuel ne peut pas être négatif');
        if (data.stockMinimum < 0) errors.push('Le stock minimum ne peut pas être négatif');
        if (data.prixUnitaire < 0) errors.push('Le prix unitaire ne peut pas être négatif');

        // Vérifier si le code existe déjà (en mode ajout)
        if (!this.currentMedicamentEditId) {
            const existingMedicament = storage.get('medicaments').find(m => m.code === data.code);
            if (existingMedicament) {
                errors.push('Ce code de médicament existe déjà');
            }
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Ajoute un nouveau médicament
     * @param {object} medicamentData - Données du médicament
     */
    addMedicament(medicamentData) {
        try {
            const newMedicament = storage.add('medicaments', medicamentData);

            if (newMedicament) {
                this.showNotification('Médicament ajouté avec succès!', 'success');
                this.resetMedicamentForm();
                this.loadMedicaments();
                this.loadPatientsAndDoctors(); // Recharger pour les prescriptions
            } else {
                this.showNotification('Erreur lors de l\'ajout du médicament', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du médicament:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour un médicament existant
     * @param {number} id - ID du médicament
     * @param {object} medicamentData - Nouvelles données
     */
    updateMedicament(id, medicamentData) {
        try {
            const updatedMedicament = storage.update('medicaments', parseInt(id), medicamentData);

            if (updatedMedicament) {
                this.showNotification('Médicament mis à jour avec succès!', 'success');
                this.resetMedicamentForm();
                this.loadMedicaments();
                this.loadPatientsAndDoctors(); // Recharger pour les prescriptions
            } else {
                this.showNotification('Erreur lors de la mise à jour du médicament', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du médicament:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime un médicament
     * @param {number} id - ID du médicament à supprimer
     */
    deleteMedicament(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce médicament?')) {
            return;
        }

        try {
            const success = storage.delete('medicaments', parseInt(id));

            if (success) {
                this.showNotification('Médicament supprimé avec succès!', 'success');
                this.loadMedicaments();
                this.loadPatientsAndDoctors(); // Recharger pour les prescriptions
            } else {
                this.showNotification('Erreur lors de la suppression du médicament', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du médicament:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Charge et affiche la liste des médicaments
     */
    loadMedicaments() {
        const medicaments = storage.get('medicaments') || [];
        this.displayMedicaments(medicaments);
    }

    /**
     * Affiche les médicaments dans le tableau
     * @param {object[]} medicaments - Liste des médicaments à afficher
     */
    displayMedicaments(medicaments) {
        const tbody = document.getElementById('medicaments-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (medicaments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        Aucun médicament enregistré
                    </td>
                </tr>
            `;
            return;
        }

        medicaments.forEach(medicament => {
            const row = this.createMedicamentRow(medicament);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour un médicament
     * @param {object} medicament - Données du médicament
     * @return {HTMLElement} Ligne de tableau
     */
    createMedicamentRow(medicament) {
        const row = document.createElement('tr');

        // Déterminer le statut du stock
        let stockStatus = 'success';
        let stockText = 'Disponible';

        if (medicament.stockActuel === 0) {
            stockStatus = 'danger';
            stockText = 'Rupture';
        } else if (medicament.stockActuel <= medicament.stockMinimum) {
            stockStatus = 'warning';
            stockText = 'Stock faible';
        }

        row.innerHTML = `
            <td>${medicament.id}</td>
            <td>${this.escapeHtml(medicament.nom)}</td>
            <td>${this.escapeHtml(medicament.code)}</td>
            <td>${this.escapeHtml(medicament.famille)}</td>
            <td>${this.escapeHtml(medicament.dosage)}</td>
            <td>${medicament.stockActuel}</td>
            <td>${medicament.stockMinimum}</td>
            <td>${medicament.prixUnitaire.toFixed(2)}€</td>
            <td><span class="badge badge-${stockStatus}">${stockText}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="pharmacyManager.editMedicament(${medicament.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="pharmacyManager.deleteMedicament(${medicament.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Prépare le formulaire pour la modification d'un médicament
     * @param {number} id - ID du médicament à modifier
     */
    editMedicament(id) {
        const medicament = storage.findById('medicaments', parseInt(id));

        if (!medicament) {
            this.showNotification('Médicament non trouvé', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('medicament-id').value = medicament.id;
        document.getElementById('nom-medicament').value = medicament.nom;
        document.getElementById('code-medicament').value = medicament.code;
        document.getElementById('famille').value = medicament.famille;
        document.getElementById('dosage').value = medicament.dosage;
        document.getElementById('stock-initial').value = medicament.stockInitial;
        document.getElementById('stock-actuel').value = medicament.stockActuel;
        document.getElementById('stock-minimum').value = medicament.stockMinimum;
        document.getElementById('prix-unitaire').value = medicament.prixUnitaire;
        document.getElementById('fournisseur').value = medicament.fournisseur || '';
        document.getElementById('description').value = medicament.description || '';

        // Mettre à jour le titre
        document.getElementById('medicament-form-title').textContent = 'Modifier un Médicament';

        // Stocker l'ID en cours d'édition
        this.currentMedicamentEditId = medicament.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire médicaments
     */
    resetMedicamentForm() {
        const form = document.getElementById('medicament-form');
        if (form) {
            form.reset();
        }

        document.getElementById('medicament-id').value = '';
        document.getElementById('medicament-form-title').textContent = 'Ajouter un Médicament';
        this.currentMedicamentEditId = null;
    }

    /**
     * Gère la recherche de médicaments
     * @param {string} searchTerm - Terme de recherche
     */
    handleMedicamentSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadMedicaments();
            return;
        }

        const results = storage.search('medicaments', searchTerm, [
            'nom', 'code', 'famille', 'dosage', 'fournisseur'
        ]);

        this.displayMedicaments(results);
    }

    /**
     * Valide le stock en temps réel
     */
    validateStock() {
        const stockActuel = parseInt(document.getElementById('stock-actuel').value) || 0;
        const stockMinimum = parseInt(document.getElementById('stock-minimum').value) || 0;

        if (stockActuel <= stockMinimum && stockActuel > 0) {
            this.showWarning('Attention: stock actuel inférieur ou égal au stock minimum');
        } else if (stockActuel === 0) {
            this.showWarning('Attention: stock en rupture');
        }
    }

    // ===== PRESCRIPTIONS =====

    /**
     * Gère la soumission du formulaire prescriptions
     * @param {Event} e - Événement de soumission
     */
    handlePrescriptionSubmit(e) {
        e.preventDefault();

        const formData = this.getPrescriptionFormData();

        if (!this.validatePrescriptionFormData(formData)) {
            return;
        }

        if (this.currentPrescriptionEditId) {
            this.updatePrescription(this.currentPrescriptionEditId, formData);
        } else {
            this.addPrescription(formData);
        }
    }

    /**
     * Récupère les données du formulaire prescriptions
     * @return {object} Données du formulaire
     */
    getPrescriptionFormData() {
        return {
            patientId: parseInt(document.getElementById('prescription-patient-id').value),
            doctorId: parseInt(document.getElementById('prescription-doctor-id').value),
            medicamentId: parseInt(document.getElementById('prescription-medicament-id').value),
            datePrescription: document.getElementById('date-prescription').value,
            quantite: parseInt(document.getElementById('quantite').value),
            posologie: document.getElementById('posologie').value.trim(),
            dureeTraitement: parseInt(document.getElementById('duree-traitement').value) || 0,
            statut: document.getElementById('statut-prescription').value,
            instructions: document.getElementById('instructions').value.trim()
        };
    }

    /**
     * Valide les données du formulaire prescriptions
     * @param {object} data - Données à valider
     * @return {boolean} True si valide, false sinon
     */
    validatePrescriptionFormData(data) {
        const errors = [];

        if (!data.patientId) errors.push('Le patient est obligatoire');
        if (!data.doctorId) errors.push('Le médecin est obligatoire');
        if (!data.medicamentId) errors.push('Le médicament est obligatoire');
        if (!data.datePrescription) errors.push('La date de prescription est obligatoire');
        if (!data.quantite || data.quantite <= 0) errors.push('La quantité doit être supérieure à 0');
        if (!data.posologie) errors.push('La posologie est obligatoire');

        // Vérifier la disponibilité du stock
        const medicament = storage.findById('medicaments', data.medicamentId);
        if (medicament && medicament.stockActuel < data.quantite) {
            errors.push(`Stock insuffisant: ${medicament.stockActuel} disponible, ${data.quantite} demandé`);
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    /**
     * Ajoute une nouvelle prescription
     * @param {object} prescriptionData - Données de la prescription
     */
    addPrescription(prescriptionData) {
        try {
            const newPrescription = storage.add('prescriptions', prescriptionData);

            if (newPrescription) {
                // Mettre à jour le stock du médicament
                this.updateMedicamentStock(prescriptionData.medicamentId, -prescriptionData.quantite);

                this.showNotification('Prescription ajoutée avec succès!', 'success');
                this.resetPrescriptionForm();
                this.loadPrescriptions();
                this.loadMedicaments(); // Recharger pour mettre à jour le stock
                this.loadPatientsAndDoctors(); // Recharger les sélecteurs
            } else {
                this.showNotification('Erreur lors de l\'ajout de la prescription', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la prescription:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour une prescription existante
     * @param {number} id - ID de la prescription
     * @param {object} prescriptionData - Nouvelles données
     */
    updatePrescription(id, prescriptionData) {
        try {
            // Récupérer l'ancienne prescription pour restaurer le stock
            const oldPrescription = storage.findById('prescriptions', parseInt(id));

            const updatedPrescription = storage.update('prescriptions', parseInt(id), prescriptionData);

            if (updatedPrescription) {
                // Ajuster le stock si la quantité a changé
                if (oldPrescription && oldPrescription.quantite !== prescriptionData.quantite) {
                    const quantityDiff = oldPrescription.quantite - prescriptionData.quantite;
                    this.updateMedicamentStock(prescriptionData.medicamentId, quantityDiff);
                }

                this.showNotification('Prescription mise à jour avec succès!', 'success');
                this.resetPrescriptionForm();
                this.loadPrescriptions();
                this.loadMedicaments(); // Recharger pour mettre à jour le stock
                this.loadPatientsAndDoctors(); // Recharger les sélecteurs
            } else {
                this.showNotification('Erreur lors de la mise à jour de la prescription', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la prescription:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Supprime une prescription
     * @param {number} id - ID de la prescription à supprimer
     */
    deletePrescription(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette prescription? Le stock sera restauré.')) {
            return;
        }

        try {
            // Récupérer la prescription pour restaurer le stock
            const prescription = storage.findById('prescriptions', parseInt(id));

            const success = storage.delete('prescriptions', parseInt(id));

            if (success) {
                // Restaurer le stock
                if (prescription) {
                    this.updateMedicamentStock(prescription.medicamentId, prescription.quantite);
                }

                this.showNotification('Prescription supprimée avec succès!', 'success');
                this.loadPrescriptions();
                this.loadMedicaments(); // Recharger pour mettre à jour le stock
                this.loadPatientsAndDoctors(); // Recharger les sélecteurs
            } else {
                this.showNotification('Erreur lors de la suppression de la prescription', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la prescription:', error);
            this.showNotification('Une erreur est survenue', 'error');
        }
    }

    /**
     * Met à jour le stock d'un médicament
     * @param {number} medicamentId - ID du médicament
     * @param {number} quantityChange - Changement de quantité (positif ou négatif)
     */
    updateMedicamentStock(medicamentId, quantityChange) {
        const medicament = storage.findById('medicaments', medicamentId);
        if (medicament) {
            const newStock = Math.max(0, medicament.stockActuel + quantityChange);
            storage.update('medicaments', medicamentId, { stockActuel: newStock });
        }
    }

    /**
     * Charge et affiche la liste des prescriptions
     */
    loadPrescriptions() {
        const prescriptions = storage.get('prescriptions') || [];
        this.displayPrescriptions(prescriptions);
    }

    /**
     * Affiche les prescriptions dans le tableau
     * @param {object[]} prescriptions - Liste des prescriptions à afficher
     */
    displayPrescriptions(prescriptions) {
        const tbody = document.getElementById('prescriptions-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (prescriptions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        Aucune prescription enregistrée
                    </td>
                </tr>
            `;
            return;
        }

        // Trier par date (plus récent en premier)
        prescriptions.sort((a, b) => new Date(b.datePrescription) - new Date(a.datePrescription));

        prescriptions.forEach(prescription => {
            const row = this.createPrescriptionRow(prescription);
            tbody.appendChild(row);
        });
    }

    /**
     * Crée une ligne de tableau pour une prescription
     * @param {object} prescription - Données de la prescription
     * @return {HTMLElement} Ligne de tableau
     */
    createPrescriptionRow(prescription) {
        const patient = storage.findById('patients', prescription.patientId);
        const doctor = storage.findById('doctors', prescription.doctorId);
        const medicament = storage.findById('medicaments', prescription.medicamentId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prescription.id}</td>
            <td>${patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}</td>
            <td>${doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : 'Médecin inconnu'}</td>
            <td>${medicament ? `${medicament.nom} - ${medicament.dosage}` : 'Médicament inconnu'}</td>
            <td>${new Date(prescription.datePrescription).toLocaleDateString('fr-FR')}</td>
            <td>${prescription.quantite}</td>
            <td>${this.escapeHtml(prescription.posologie)}</td>
            <td><span class="badge badge-${this.getPrescriptionStatusClass(prescription.statut)}">${prescription.statut}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="pharmacyManager.editPrescription(${prescription.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="pharmacyManager.deletePrescription(${prescription.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Retourne la classe CSS pour le statut de prescription
     * @param {string} status - Statut de la prescription
     * @return {string} Classe CSS
     */
    getPrescriptionStatusClass(status) {
        const classes = {
            'En attente': 'warning',
            'Délivré': 'success',
            'Terminé': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    /**
     * Prépare le formulaire pour la modification d'une prescription
     * @param {number} id - ID de la prescription à modifier
     */
    editPrescription(id) {
        const prescription = storage.findById('prescriptions', parseInt(id));

        if (!prescription) {
            this.showNotification('Prescription non trouvée', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('prescription-id').value = prescription.id;
        document.getElementById('prescription-patient-id').value = prescription.patientId;
        document.getElementById('prescription-doctor-id').value = prescription.doctorId;
        document.getElementById('prescription-medicament-id').value = prescription.medicamentId;
        document.getElementById('date-prescription').value = prescription.datePrescription;
        document.getElementById('quantite').value = prescription.quantite;
        document.getElementById('posologie').value = prescription.posologie;
        document.getElementById('duree-traitement').value = prescription.dureeTraitement || '';
        document.getElementById('statut-prescription').value = prescription.statut;
        document.getElementById('instructions').value = prescription.instructions || '';

        // Mettre à jour le titre
        document.getElementById('prescription-form-title').textContent = 'Modifier une Prescription';

        // Stocker l'ID en cours d'édition
        this.currentPrescriptionEditId = prescription.id;

        // Scroller vers le formulaire
        document.querySelector('.form-container').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Réinitialise le formulaire prescriptions
     */
    resetPrescriptionForm() {
        const form = document.getElementById('prescription-form');
        if (form) {
            form.reset();
        }

        document.getElementById('prescription-id').value = '';
        document.getElementById('prescription-form-title').textContent = 'Ajouter une Prescription';
        this.currentPrescriptionEditId = null;
    }

    /**
     * Gère la recherche de prescriptions
     * @param {string} searchTerm - Terme de recherche
     */
    handlePrescriptionSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadPrescriptions();
            return;
        }

        const prescriptions = storage.get('prescriptions') || [];
        const results = prescriptions.filter(prescription => {
            const patient = storage.findById('patients', prescription.patientId);
            const doctor = storage.findById('doctors', prescription.doctorId);
            const medicament = storage.findById('medicaments', prescription.medicamentId);

            const patientName = patient ? `${patient.prenom} ${patient.nom}`.toLowerCase() : '';
            const doctorName = doctor ? `${doctor.prenom} ${doctor.nom}`.toLowerCase() : '';
            const medicamentName = medicament ? `${medicament.nom} ${medicament.dosage}`.toLowerCase() : '';
            const posologie = (prescription.posologie || '').toLowerCase();
            const term = searchTerm.toLowerCase();

            return patientName.includes(term) ||
                doctorName.includes(term) ||
                medicamentName.includes(term) ||
                posologie.includes(term) ||
                prescription.datePrescription.includes(term);
        });

        this.displayPrescriptions(results);
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
     * Affiche un avertissement
     * @param {string} message - Message d'avertissement
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
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
let pharmacyManager;

// Démarrage lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    pharmacyManager = new PharmacyManager();
});

// Export pour utilisation globale
window.pharmacyManager = pharmacyManager;
