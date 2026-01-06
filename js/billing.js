/**
 * Module de gestion de la facturation
 * CRUD complet pour factures et paiements avec calculs automatiques
 */

class BillingManager {
    constructor() {
        this.currentInvoiceEditId = null;
        this.currentPaymentEditId = null;
        this.initializeEventListeners();
        this.loadInvoices();
        this.loadPayments();
        this.loadPatients();
    }

    initializeEventListeners() {
        // Formulaire factures
        const invoiceForm = document.getElementById('invoice-form');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', (e) => this.handleInvoiceSubmit(e));
        }

        // Formulaire paiements
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePaymentSubmit(e));
        }

        // Boutons d'annulation
        document.getElementById('invoice-cancel-btn')?.addEventListener('click', () => this.resetInvoiceForm());
        document.getElementById('payment-cancel-btn')?.addEventListener('click', () => this.resetPaymentForm());

        // Recherche et filtres
        document.getElementById('search-invoices')?.addEventListener('input', (e) => this.handleInvoiceSearch(e.target.value));
        document.getElementById('filter-status')?.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        document.getElementById('search-payments')?.addEventListener('input', (e) => this.handlePaymentSearch(e.target.value));

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Services
        document.getElementById('add-service')?.addEventListener('click', () => this.addServiceItem());
        document.getElementById('tva')?.addEventListener('input', () => this.calculateTotals());

        // Bouton d'impression
        document.getElementById('print-invoice')?.addEventListener('click', () => this.printInvoice());

        // Bouton pour vider toutes les données
        document.getElementById('clear-all-data')?.addEventListener('click', () => this.clearAllData());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabName)?.classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    loadPatients() {
        const patients = storage.get('patients') || [];
        const invoices = storage.get('invoices') || [];

        // Remplir le sélecteur de patients
        const patientSelect = document.getElementById('invoice-patient-id');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Sélectionner un patient</option>';
            patients.forEach(patient => {
                if (patient && patient.id && patient.prenom && patient.nom) {
                    const option = document.createElement('option');
                    option.value = patient.id;
                    option.textContent = `${patient.prenom} ${patient.nom}`;
                    patientSelect.appendChild(option);
                }
            });
        }

        // Remplir le sélecteur de factures pour les paiements
        const invoiceSelect = document.getElementById('payment-invoice-id');
        if (invoiceSelect) {
            invoiceSelect.innerHTML = '<option value="">Sélectionner une facture</option>';
            invoices.filter(inv => inv && inv.statut !== 'Payée').forEach(invoice => {
                if (invoice && invoice.id && invoice.numeroFacture) {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `Facture ${invoice.numeroFacture} - ${(invoice.totalGeneral || 0).toFixed(2)}€`;
                    invoiceSelect.appendChild(option);
                }
            });
        }
    }

    // ===== FACTURES =====

    handleInvoiceSubmit(e) {
        e.preventDefault();
        const formData = this.getInvoiceFormData();
        if (!this.validateInvoiceFormData(formData)) return;

        if (this.currentInvoiceEditId) {
            this.updateInvoice(this.currentInvoiceEditId, formData);
        } else {
            this.addInvoice(formData);
        }
    }

    getInvoiceFormData() {
        const services = this.getServicesData();
        const sousTotal = services.reduce((sum, service) => {
            if (service && service.quantite && service.prixUnitaire) {
                return sum + (service.quantite * service.prixUnitaire);
            }
            return sum;
        }, 0);
        const tvaInput = document.getElementById('tva');
        const tva = parseFloat(tvaInput?.value) || 20;
        const montantTva = sousTotal * (tva / 100);
        const totalGeneral = sousTotal + montantTva;

        return {
            patientId: parseInt(document.getElementById('invoice-patient-id')?.value) || 0,
            numeroFacture: document.getElementById('numero-facture')?.value?.trim() || '',
            dateFacture: document.getElementById('date-facture')?.value || '',
            statut: document.getElementById('statut-facture')?.value || 'Non payée',
            services: services,
            sousTotal: sousTotal,
            tva: tva,
            montantTva: montantTva,
            totalGeneral: totalGeneral,
            notesFacture: document.getElementById('notes-facture')?.value?.trim() || ''
        };
    }

    validateInvoiceFormData(data) {
        const errors = [];
        if (!data.patientId) errors.push('Le patient est obligatoire');
        if (!data.numeroFacture) errors.push('Le numéro de facture est obligatoire');
        if (!data.dateFacture) errors.push('La date de facture est obligatoire');
        if (!data.services || data.services.length === 0) errors.push('Au moins un service est obligatoire');

        // Vérifier que chaque service a des données valides
        if (data.services) {
            data.services.forEach((service, index) => {
                if (!service || !service.type || !service.description || service.quantite <= 0 || service.prixUnitaire < 0) {
                    errors.push(`Le service ${index + 1} est incomplet ou invalide`);
                }
            });
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }
        return true;
    }

    addInvoice(invoiceData) {
        try {
            const newInvoice = storage.add('invoices', invoiceData);
            if (newInvoice) {
                this.showNotification('Facture ajoutée avec succès!', 'success');
                this.resetInvoiceForm();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de l\'ajout de la facture', 'error');
        }
    }

    updateInvoice(id, invoiceData) {
        try {
            const updatedInvoice = storage.update('invoices', parseInt(id), invoiceData);
            if (updatedInvoice) {
                this.showNotification('Facture mise à jour avec succès!', 'success');
                this.resetInvoiceForm();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    deleteInvoice(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture?')) return;
        try {
            if (storage.delete('invoices', parseInt(id))) {
                this.showNotification('Facture supprimée avec succès!', 'success');
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    loadInvoices() {
        const invoices = storage.get('invoices') || [];
        this.displayInvoices(invoices);
    }

    displayInvoices(invoices) {
        const tbody = document.getElementById('invoices-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!invoices.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune facture enregistrée</td></tr>';
            return;
        }

        invoices.sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture));
        invoices.forEach(inv => tbody.appendChild(this.createInvoiceRow(inv)));
    }

    createInvoiceRow(invoice) {
        const patient = storage.findById('patients', invoice.patientId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${this.escapeHtml(invoice.numeroFacture)}</td>
            <td>${patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}</td>
            <td>${new Date(invoice.dateFacture).toLocaleDateString('fr-FR')}</td>
            <td>${invoice.totalGeneral.toFixed(2)}€</td>
            <td><span class="badge badge-${this.getInvoiceStatusClass(invoice.statut)}">${invoice.statut}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="billingManager.editInvoice(${invoice.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="billingManager.deleteInvoice(${invoice.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>`;
        return row;
    }

    getInvoiceStatusClass(status) {
        return ({
            'Non payée': 'danger',
            'Partiellement payée': 'warning',
            'Payée': 'success',
            'Annulée': 'secondary'
        })[status] || 'secondary';
    }

    // ===== PAIEMENTS =====

    handlePaymentSubmit(e) {
        e.preventDefault();
        const formData = this.getPaymentFormData();
        if (!this.validatePaymentFormData(formData)) return;

        if (this.currentPaymentEditId) {
            this.updatePayment(this.currentPaymentEditId, formData);
        } else {
            this.addPayment(formData);
        }
    }

    getPaymentFormData() {
        return {
            invoiceId: parseInt(document.getElementById('payment-invoice-id')?.value) || 0,
            datePaiement: document.getElementById('date-paiement')?.value || '',
            montantPaiement: parseFloat(document.getElementById('montant-paiement')?.value) || 0,
            modePaiement: document.getElementById('mode-paiement')?.value || '',
            referencePaiement: document.getElementById('reference-paiement')?.value?.trim() || '',
            notesPaiement: document.getElementById('notes-paiement')?.value?.trim() || ''
        };
    }

    validatePaymentFormData(data) {
        const errors = [];
        if (!data.invoiceId) errors.push('La facture est obligatoire');
        if (!data.datePaiement) errors.push('La date de paiement est obligatoire');
        if (!data.montantPaiement || data.montantPaiement <= 0) errors.push('Le montant doit être positif');
        if (!data.modePaiement) errors.push('Le mode de paiement est obligatoire');

        if (errors.length) {
            this.showErrors(errors);
            return false;
        }
        return true;
    }

    addPayment(paymentData) {
        try {
            const newPayment = storage.add('payments', paymentData);
            if (newPayment) {
                this.updateInvoiceStatus(paymentData.invoiceId);
                this.showNotification('Paiement enregistré avec succès!', 'success');
                this.resetPaymentForm();
                this.loadPayments();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de l\'ajout du paiement', 'error');
        }
    }

    updatePayment(id, paymentData) {
        try {
            const updatedPayment = storage.update('payments', parseInt(id), paymentData);
            if (updatedPayment) {
                this.updateInvoiceStatus(paymentData.invoiceId);
                this.showNotification('Paiement mis à jour avec succès!', 'success');
                this.resetPaymentForm();
                this.loadPayments();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    deletePayment(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')) return;
        try {
            const payment = storage.findById('payments', parseInt(id));
            if (storage.delete('payments', parseInt(id))) {
                if (payment) this.updateInvoiceStatus(payment.invoiceId);
                this.showNotification('Paiement supprimé avec succès!', 'success');
                this.loadPayments();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch {
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    updateInvoiceStatus(invoiceId) {
        const invoice = storage.findById('invoices', invoiceId);
        const payments = storage.get('payments') || [];
        if (!invoice || !Array.isArray(payments)) return;

        const totalPaid = payments
            .filter(p => p.invoiceId === invoiceId)
            .reduce((sum, p) => sum + p.montantPaiement, 0);

        let statut = 'Non payée';
        if (totalPaid >= invoice.totalGeneral) statut = 'Payée';
        else if (totalPaid > 0) statut = 'Partiellement payée';

        storage.update('invoices', invoiceId, { statut });
    }

    loadPayments() {
        const payments = storage.get('payments') || [];
        this.displayPayments(payments);
    }

    displayPayments(payments) {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!payments.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucun paiement enregistré</td></tr>';
            return;
        }

        payments.sort((a, b) => new Date(b.datePaiement) - new Date(a.datePaiement));
        payments.forEach(p => tbody.appendChild(this.createPaymentRow(p)));
    }

    createPaymentRow(payment) {
        const invoice = storage.findById('invoices', payment.invoiceId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${invoice ? `Facture ${invoice.numeroFacture}` : 'Facture inconnue'}</td>
            <td>${new Date(payment.datePaiement).toLocaleDateString('fr-FR')}</td>
            <td>${payment.montantPaiement.toFixed(2)}€</td>
            <td>${this.escapeHtml(payment.modePaiement)}</td>
            <td>${this.escapeHtml(payment.referencePaiement || '-')}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="billingManager.editPayment(${payment.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="billingManager.deletePayment(${payment.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>`;
        return row;
    }

    // ===== SERVICES =====

    addServiceItem() {
        const servicesList = document.getElementById('services-list');
        if (!servicesList) return;

        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';
        serviceItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Type de Service</label>
                    <select class="service-type">
                        <option value="Consultation">Consultation</option>
                        <option value="Hospitalisation">Hospitalisation</option>
                        <option value="Médicament">Médicament</option>
                        <option value="Examen">Examen</option>
                        <option value="Chirurgie">Chirurgie</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="service-description" placeholder="Description du service">
                </div>
                <div class="form-group">
                    <label>Quantité</label>
                    <input type="number" class="service-quantity" min="1" value="1">
                </div>
                <div class="form-group">
                    <label>Prix Unitaire (€)</label>
                    <input type="number" class="service-price" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label>Total (€)</label>
                    <input type="text" class="service-total" readonly>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-danger remove-service">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        servicesList.appendChild(serviceItem);
        this.attachServiceListeners(serviceItem);
    }

    attachServiceListeners(serviceItem) {
        const removeBtn = serviceItem.querySelector('.remove-service');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                // Ne permettre la suppression que s'il y a plus d'un service
                const allServices = document.querySelectorAll('.service-item');
                if (allServices.length > 1) {
                    serviceItem.remove();
                    this.calculateTotals();
                    this.showNotification('Service supprimé', 'info');
                } else {
                    this.showNotification('Il doit y avoir au moins un service', 'warning');
                }
            });
        }

        const quantityInput = serviceItem.querySelector('.service-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.calculateServiceTotal(serviceItem));
        }

        const priceInput = serviceItem.querySelector('.service-price');
        if (priceInput) {
            priceInput.addEventListener('input', () => this.calculateServiceTotal(serviceItem));
        }
    }

    calculateServiceTotal(serviceItem) {
        const q = parseFloat(serviceItem.querySelector('.service-quantity')?.value) || 0;
        const p = parseFloat(serviceItem.querySelector('.service-price')?.value) || 0;
        const total = q * p;
        const totalInput = serviceItem.querySelector('.service-total');
        if (totalInput) totalInput.value = total.toFixed(2);
        this.calculateTotals();
    }

    calculateTotals() {
        const services = this.getServicesData();
        const sousTotal = services.reduce((sum, service) => sum + (service.quantite * service.prixUnitaire), 0);
        const tva = parseFloat(document.getElementById('tva')?.value) || 20;
        const montantTva = sousTotal * (tva / 100);
        const totalGeneral = sousTotal + montantTva;

        const sousTotalInput = document.getElementById('sous-total');
        const montantTvaInput = document.getElementById('montant-tva');
        const totalGeneralInput = document.getElementById('total-general');

        if (sousTotalInput) sousTotalInput.value = sousTotal.toFixed(2);
        if (montantTvaInput) montantTvaInput.value = montantTva.toFixed(2);
        if (totalGeneralInput) totalGeneralInput.value = totalGeneral.toFixed(2);
    }

    getServicesData() {
        const serviceItems = document.querySelectorAll('.service-item');
        return Array.from(serviceItems).map(item => {
            const typeSelect = item.querySelector('.service-type');
            const descInput = item.querySelector('.service-description');
            const qtyInput = item.querySelector('.service-quantity');
            const priceInput = item.querySelector('.service-price');

            return {
                type: typeSelect?.value || '',
                description: descInput?.value || '',
                quantite: parseFloat(qtyInput?.value) || 0,
                prixUnitaire: parseFloat(priceInput?.value) || 0
            };
        }).filter(service => service.type && service.description && service.quantite > 0 && service.prixUnitaire >= 0);
    }

    // ===== UTILITAIRES =====

    showErrors(errors) {
        this.showNotification('Erreurs de validation:\n' + errors.join('\n'), 'error');
    }

    showNotification(message, type = 'info') {
        const n = document.createElement('div');
        n.className = `notification notification-${type}`;
        n.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            border-radius: 5px; color: white; font-weight: 600; z-index: 1000;
            max-width: 300px; word-wrap: break-word; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;`;
        const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
        n.style.backgroundColor = colors[type] || colors.info;
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => n.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }

    resetInvoiceForm() {
        const form = document.getElementById('invoice-form');
        if (form) form.reset();

        const invoiceIdInput = document.getElementById('invoice-id');
        const formTitle = document.getElementById('invoice-form-title');

        if (invoiceIdInput) invoiceIdInput.value = '';
        if (formTitle) formTitle.textContent = 'Créer une Facture';

        this.currentInvoiceEditId = null;

        // Réinitialiser les services
        const servicesList = document.getElementById('services-list');
        if (servicesList) {
            servicesList.innerHTML = `
                <div class="service-item">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Type de Service</label>
                            <select class="service-type">
                                <option value="Consultation">Consultation</option>
                                <option value="Hospitalisation">Hospitalisation</option>
                                <option value="Médicament">Médicament</option>
                                <option value="Examen">Examen</option>
                                <option value="Chirurgie">Chirurgie</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" class="service-description" placeholder="Description du service">
                        </div>
                        <div class="form-group">
                            <label>Quantité</label>
                            <input type="number" class="service-quantity" min="1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Prix Unitaire (€)</label>
                            <input type="number" class="service-price" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Total (€)</label>
                            <input type="text" class="service-total" readonly>
                        </div>
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button type="button" class="btn btn-danger remove-service">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>`;

            const firstService = servicesList.querySelector('.service-item');
            if (firstService) this.attachServiceListeners(firstService);
        }

        this.calculateTotals();
    }

    resetPaymentForm() {
        const form = document.getElementById('payment-form');
        if (form) form.reset();

        const paymentIdInput = document.getElementById('payment-id');
        const formTitle = document.getElementById('payment-form-title');

        if (paymentIdInput) paymentIdInput.value = '';
        if (formTitle) formTitle.textContent = 'Enregistrer un Paiement';

        this.currentPaymentEditId = null;
    }

    editInvoice(id) {
        const invoice = storage.findById('invoices', parseInt(id));
        if (!invoice) return this.showNotification('Facture non trouvée', 'error');

        const invoiceIdInput = document.getElementById('invoice-id');
        const patientSelect = document.getElementById('invoice-patient-id');
        const numeroInput = document.getElementById('numero-facture');
        const dateInput = document.getElementById('date-facture');
        const statutSelect = document.getElementById('statut-facture');
        const notesTextarea = document.getElementById('notes-facture');
        const formTitle = document.getElementById('invoice-form-title');

        if (invoiceIdInput) invoiceIdInput.value = invoice.id;
        if (patientSelect) patientSelect.value = invoice.patientId;
        if (numeroInput) numeroInput.value = invoice.numeroFacture;
        if (dateInput) dateInput.value = invoice.dateFacture;
        if (statutSelect) statutSelect.value = invoice.statut;
        if (notesTextarea) notesTextarea.value = invoice.notesFacture || '';
        if (formTitle) formTitle.textContent = 'Modifier une Facture';

        // Charger les services
        const servicesList = document.getElementById('services-list');
        if (servicesList && invoice.services) {
            servicesList.innerHTML = '';
            const services = invoice.services || [];
            services.forEach(service => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Type de Service</label>
                            <select class="service-type">
                                <option value="Consultation" ${service.type === 'Consultation' ? 'selected' : ''}>Consultation</option>
                                <option value="Hospitalisation" ${service.type === 'Hospitalisation' ? 'selected' : ''}>Hospitalisation</option>
                                <option value="Médicament" ${service.type === 'Médicament' ? 'selected' : ''}>Médicament</option>
                                <option value="Examen" ${service.type === 'Examen' ? 'selected' : ''}>Examen</option>
                                <option value="Chirurgie" ${service.type === 'Chirurgie' ? 'selected' : ''}>Chirurgie</option>
                                <option value="Autre" ${service.type === 'Autre' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" class="service-description" value="${this.escapeHtml(service.description || '')}">
                        </div>
                        <div class="form-group">
                            <label>Quantité</label>
                            <input type="number" class="service-quantity" min="1" value="${service.quantite || 1}">
                        </div>
                        <div class="form-group">
                            <label>Prix Unitaire (€)</label>
                            <input type="number" class="service-price" min="0" step="0.01" value="${service.prixUnitaire || 0}">
                        </div>
                        <div class="form-group">
                            <label>Total (€)</label>
                            <input type="text" class="service-total" readonly value="${((service.quantite || 1) * (service.prixUnitaire || 0)).toFixed(2)}">
                        </div>
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button type="button" class="btn btn-danger remove-service">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
                servicesList.appendChild(serviceItem);
                this.attachServiceListeners(serviceItem);
            });
        }

        const tvaInput = document.getElementById('tva');
        if (tvaInput) tvaInput.value = invoice.tva || 20;

        this.calculateTotals();
        this.currentInvoiceEditId = invoice.id;

        const formContainer = document.querySelector('.form-container');
        if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    editPayment(id) {
        const payment = storage.findById('payments', parseInt(id));
        if (!payment) return this.showNotification('Paiement non trouvé', 'error');

        const paymentIdInput = document.getElementById('payment-id');
        const invoiceSelect = document.getElementById('payment-invoice-id');
        const dateInput = document.getElementById('date-paiement');
        const montantInput = document.getElementById('montant-paiement');
        const modeSelect = document.getElementById('mode-paiement');
        const referenceInput = document.getElementById('reference-paiement');
        const notesTextarea = document.getElementById('notes-paiement');
        const formTitle = document.getElementById('payment-form-title');

        if (paymentIdInput) paymentIdInput.value = payment.id;
        if (invoiceSelect) invoiceSelect.value = payment.invoiceId;
        if (dateInput) dateInput.value = payment.datePaiement;
        if (montantInput) montantInput.value = payment.montantPaiement;
        if (modeSelect) modeSelect.value = payment.modePaiement;
        if (referenceInput) referenceInput.value = payment.referencePaiement || '';
        if (notesTextarea) notesTextarea.value = payment.notesPaiement || '';
        if (formTitle) formTitle.textContent = 'Modifier un Paiement';

        this.currentPaymentEditId = payment.id;

        const formContainer = document.querySelector('.form-container');
        if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    handleInvoiceSearch(searchTerm) {
        if (!searchTerm.trim()) return this.loadInvoices();
        const term = searchTerm.toLowerCase();
        const invoices = storage.get('invoices') || [];
        const results = invoices.filter(inv => {
            const p = storage.findById('patients', inv.patientId);
            const name = p ? `${p.prenom} ${p.nom}`.toLowerCase() : '';
            return name.includes(term) ||
                inv.numeroFacture.toLowerCase().includes(term) ||
                inv.dateFacture.includes(term);
        });
        this.displayInvoices(results);
    }

    handleStatusFilter(status) {
        if (!status) return this.loadInvoices();
        const invoices = storage.get('invoices') || [];
        this.displayInvoices(invoices.filter(inv => inv.statut === status));
    }

    handlePaymentSearch(searchTerm) {
        if (!searchTerm.trim()) return this.loadPayments();
        const term = searchTerm.toLowerCase();
        const payments = storage.get('payments') || [];
        const results = payments.filter(p => {
            const inv = storage.findById('invoices', p.invoiceId);
            const num = inv ? inv.numeroFacture.toLowerCase() : '';
            return num.includes(term) ||
                p.modePaiement.toLowerCase().includes(term) ||
                (p.referencePaiement || '').toLowerCase().includes(term) || // FIX
                p.datePaiement.includes(term);
        });
        this.displayPayments(results);
    }

    // ===== IMPRESSION =====

    printInvoice() {
        // Récupérer les données du formulaire actuel
        const patientId = document.getElementById('invoice-patient-id')?.value;
        const patient = storage.findById('patients', parseInt(patientId));

        if (!patient) {
            this.showNotification('Veuillez sélectionner un patient avant d\'imprimer', 'warning');
            return;
        }

        const services = this.getServicesData();
        if (!services || services.length === 0) {
            this.showNotification('Veuillez ajouter au moins un service avant d\'imprimer', 'warning');
            return;
        }

        const invoiceData = {
            numeroFacture: document.getElementById('numero-facture')?.value || 'FACTURE-' + Date.now(),
            dateFacture: document.getElementById('date-facture')?.value || new Date().toLocaleDateString('fr-FR'),
            patient: patient,
            services: services,
            sousTotal: parseFloat(document.getElementById('sous-total')?.value) || 0,
            tva: parseFloat(document.getElementById('tva')?.value) || 20,
            montantTva: parseFloat(document.getElementById('montant-tva')?.value) || 0,
            totalGeneral: parseFloat(document.getElementById('total-general')?.value) || 0,
            notesFacture: document.getElementById('notes-facture')?.value || ''
        };

        // Créer le contenu HTML pour l'impression
        const printContent = this.generatePrintContent(invoiceData);

        // Ouvrir une nouvelle fenêtre et imprimer
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Attendre que le contenu soit chargé puis imprimer
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }

    generatePrintContent(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Facture - ${data.numeroFacture}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .patient-info, .invoice-details { width: 45%; }
                .services-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .services-table th, .services-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .services-table th { background-color: #f5f5f5; }
                .total-section { text-align: right; margin-top: 20px; }
                .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; }
                @media print { body { margin: 10px; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Système Hospitalier</h1>
                <h2>FACTURE</h2>
            </div>
            
            <div class="invoice-info">
                <div class="patient-info">
                    <h3>Patient</h3>
                    <p><strong>${data.patient.prenom} ${data.patient.nom}</strong></p>
                    <p>Âge: ${data.patient.age}</p>
                    <p>Téléphone: ${data.patient.telephone}</p>
                    <p>Adresse: ${data.patient.adresse}</p>
                </div>
                
                <div class="invoice-details">
                    <h3>Détails Facture</h3>
                    <p><strong>Numéro:</strong> ${data.numeroFacture}</p>
                    <p><strong>Date:</strong> ${data.dateFacture}</p>
                    <p><strong>TVA:</strong> ${data.tva}%</p>
                </div>
            </div>
            
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Type de Service</th>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Prix Unitaire</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.services.map(service => `
                        <tr>
                            <td>${service.type}</td>
                            <td>${service.description}</td>
                            <td>${service.quantite}</td>
                            <td>${service.prixUnitaire.toFixed(2)}€</td>
                            <td>${(service.quantite * service.prixUnitaire).toFixed(2)}€</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total-section">
                <p><strong>Sous-total:</strong> ${data.sousTotal.toFixed(2)}€</p>
                <p><strong>TVA (${data.tva}%):</strong> ${data.montantTva.toFixed(2)}€</p>
                <p><strong>Total Général:</strong> ${data.totalGeneral.toFixed(2)}€</p>
            </div>
            
            ${data.notesFacture ? `
            <div class="notes">
                <h3>Notes</h3>
                <p>${data.notesFacture}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 50px; text-align: center;">
                <p>Merci pour votre confiance</p>
            </div>
        </body>
        </html>`;
    }

    // ===== VIDAGE DES DONNÉES =====

    clearAllData() {
        if (!confirm('⚠️ ATTENTION!\n\nCette action va supprimer TOUTES les données du système:\n\n• Patients\n• Médecins\n• Rendez-vous\n• Médicaments\n• Prescriptions\n• Chambres\n• Admissions\n• Factures\n• Paiements\n\nCette action est IRRÉVERSIBLE!\n\nÊtes-vous absolument sûr de vouloir continuer?')) {
            return;
        }

        if (!confirm('Dernière confirmation:\n\nToutes les données seront définitivement perdues.\n\nCliquez sur OK pour confirmer la suppression totale.')) {
            return;
        }

        try {
            const success = storage.clear();
            if (success) {
                this.showNotification('🗑️ Toutes les données ont été supprimées avec succès!', 'success');

                // Recharger les données actuelles
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                this.showNotification('❌ Erreur lors de la suppression des données', 'error');
            }
        } catch (error) {
            this.showNotification('❌ Erreur critique lors du vidage des données', 'error');
            console.error('Clear data error:', error);
        }
    }
}

// Animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Init
let billingManager;
document.addEventListener('DOMContentLoaded', () => {
    billingManager = new BillingManager();

    // Attacher les listeners pour tous les services existants
    const existingServices = document.querySelectorAll('.service-item');
    existingServices.forEach(service => {
        if (billingManager) {
            billingManager.attachServiceListeners(service);
        }
    });

    // Export pour utilisation globale après l'initialisation
    window.billingManager = billingManager;
});
