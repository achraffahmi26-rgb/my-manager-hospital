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
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
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
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.prenom} ${patient.nom}`;
                patientSelect.appendChild(option);
            });
        }

        // Remplir le sélecteur de factures pour les paiements
        const invoiceSelect = document.getElementById('payment-invoice-id');
        if (invoiceSelect) {
            invoiceSelect.innerHTML = '<option value="">Sélectionner une facture</option>';
            invoices.filter(inv => inv.statut !== 'Payée').forEach(invoice => {
                const option = document.createElement('option');
                option.value = invoice.id;
                option.textContent = `Facture ${invoice.numero} - ${invoice.totalGeneral.toFixed(2)}€`;
                invoiceSelect.appendChild(option);
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
        const sousTotal = services.reduce((sum, service) => sum + (service.quantite * service.prixUnitaire), 0);
        const tva = parseFloat(document.getElementById('tva').value) || 20;
        const montantTva = sousTotal * (tva / 100);
        const totalGeneral = sousTotal + montantTva;

        return {
            patientId: parseInt(document.getElementById('invoice-patient-id').value),
            numeroFacture: document.getElementById('numero-facture').value.trim(),
            dateFacture: document.getElementById('date-facture').value,
            statut: document.getElementById('statut-facture').value,
            services: services,
            sousTotal: sousTotal,
            tva: tva,
            montantTva: montantTva,
            totalGeneral: totalGeneral,
            notesFacture: document.getElementById('notes-facture').value.trim()
        };
    }

    validateInvoiceFormData(data) {
        const errors = [];
        if (!data.patientId) errors.push('Le patient est obligatoire');
        if (!data.numeroFacture) errors.push('Le numéro de facture est obligatoire');
        if (!data.dateFacture) errors.push('La date de facture est obligatoire');
        if (!data.services || data.services.length === 0) errors.push('Au moins un service est obligatoire');

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
        } catch (error) {
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
        } catch (error) {
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    deleteInvoice(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture?')) return;

        try {
            const success = storage.delete('invoices', parseInt(id));
            if (success) {
                this.showNotification('Facture supprimée avec succès!', 'success');
                this.loadInvoices();
                this.loadPatients();
            }
        } catch (error) {
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
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune facture enregistrée</td></tr>';
            return;
        }

        invoices.sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture));
        invoices.forEach(invoice => {
            tbody.appendChild(this.createInvoiceRow(invoice));
        });
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
            </td>
        `;
        return row;
    }

    getInvoiceStatusClass(status) {
        const classes = {
            'Non payée': 'danger',
            'Partiellement payée': 'warning',
            'Payée': 'success',
            'Annulée': 'secondary'
        };
        return classes[status] || 'secondary';
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
            invoiceId: parseInt(document.getElementById('payment-invoice-id').value),
            datePaiement: document.getElementById('date-paiement').value,
            montantPaiement: parseFloat(document.getElementById('montant-paiement').value),
            modePaiement: document.getElementById('mode-paiement').value,
            referencePaiement: document.getElementById('reference-paiement').value.trim(),
            notesPaiement: document.getElementById('notes-paiement').value.trim()
        };
    }

    validatePaymentFormData(data) {
        const errors = [];
        if (!data.invoiceId) errors.push('La facture est obligatoire');
        if (!data.datePaiement) errors.push('La date de paiement est obligatoire');
        if (!data.montantPaiement || data.montantPaiement <= 0) errors.push('Le montant doit être positif');
        if (!data.modePaiement) errors.push('Le mode de paiement est obligatoire');

        if (errors.length > 0) {
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
        } catch (error) {
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
        } catch (error) {
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    deletePayment(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')) return;

        try {
            const payment = storage.findById('payments', parseInt(id));
            const success = storage.delete('payments', parseInt(id));
            if (success) {
                if (payment) {
                    this.updateInvoiceStatus(payment.invoiceId);
                }
                this.showNotification('Paiement supprimé avec succès!', 'success');
                this.loadPayments();
                this.loadInvoices();
                this.loadPatients();
            }
        } catch (error) {
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    updateInvoiceStatus(invoiceId) {
        const invoice = storage.findById('invoices', invoiceId);
        const payments = storage.get('payments').filter(p => p.invoiceId === invoiceId);

        if (invoice) {
            const totalPaid = payments.reduce((sum, p) => sum + p.montantPaiement, 0);
            let newStatus = 'Non payée';

            if (totalPaid >= invoice.totalGeneral) {
                newStatus = 'Payée';
            } else if (totalPaid > 0) {
                newStatus = 'Partiellement payée';
            }

            storage.update('invoices', invoiceId, { statut: newStatus });
        }
    }

    loadPayments() {
        const payments = storage.get('payments') || [];
        this.displayPayments(payments);
    }

    displayPayments(payments) {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucun paiement enregistré</td></tr>';
            return;
        }

        payments.sort((a, b) => new Date(b.datePaiement) - new Date(a.datePaiement));
        payments.forEach(payment => {
            tbody.appendChild(this.createPaymentRow(payment));
        });
    }

    createPaymentRow(payment) {
        const invoice = storage.findById('invoices', payment.invoiceId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${invoice ? `Facture ${invoice.numero}` : 'Facture inconnue'}</td>
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
            </td>
        `;
        return row;
    }

    // ===== SERVICES =====

    addServiceItem() {
        const servicesList = document.getElementById('services-list');
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
            </div>
        `;

        servicesList.appendChild(serviceItem);
        this.attachServiceListeners(serviceItem);
    }

    attachServiceListeners(serviceItem) {
        const removeBtn = serviceItem.querySelector('.remove-service');
        removeBtn.addEventListener('click', () => {
            serviceItem.remove();
            this.calculateTotals();
        });

        const inputs = serviceItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.calculateServiceTotal(serviceItem));
        });
    }

    calculateServiceTotal(serviceItem) {
        const quantity = parseFloat(serviceItem.querySelector('.service-quantity').value) || 0;
        const price = parseFloat(serviceItem.querySelector('.service-price').value) || 0;
        const total = quantity * price;
        serviceItem.querySelector('.service-total').value = total.toFixed(2);
        this.calculateTotals();
    }

    calculateTotals() {
        const services = this.getServicesData();
        const sousTotal = services.reduce((sum, service) => sum + (service.quantite * service.prixUnitaire), 0);
        const tva = parseFloat(document.getElementById('tva').value) || 20;
        const montantTva = sousTotal * (tva / 100);
        const totalGeneral = sousTotal + montantTva;

        document.getElementById('sous-total').value = sousTotal.toFixed(2);
        document.getElementById('montant-tva').value = montantTva.toFixed(2);
        document.getElementById('total-general').value = totalGeneral.toFixed(2);
    }

    getServicesData() {
        const serviceItems = document.querySelectorAll('.service-item');
        return Array.from(serviceItems).map(item => ({
            type: item.querySelector('.service-type').value,
            description: item.querySelector('.service-description').value,
            quantite: parseFloat(item.querySelector('.service-quantity').value) || 0,
            prixUnitaire: parseFloat(item.querySelector('.service-price').value) || 0
        }));
    }

    // ===== UTILITAIRES =====

    showErrors(errors) {
        this.showNotification('Erreurs de validation:\n' + errors.join('\n'), 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            border-radius: 5px; color: white; font-weight: 600; z-index: 1000;
            max-width: 300px; word-wrap: break-word; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;

        const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    resetInvoiceForm() {
        document.getElementById('invoice-form')?.reset();
        document.getElementById('invoice-id').value = '';
        document.getElementById('invoice-form-title').textContent = 'Créer une Facture';
        this.currentInvoiceEditId = null;

        // Réinitialiser les services
        const servicesList = document.getElementById('services-list');
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
            </div>
        `;

        this.attachServiceListeners(document.querySelector('.service-item'));
        this.calculateTotals();
    }

    resetPaymentForm() {
        document.getElementById('payment-form')?.reset();
        document.getElementById('payment-id').value = '';
        document.getElementById('payment-form-title').textContent = 'Enregistrer un Paiement';
        this.currentPaymentEditId = null;
    }

    editInvoice(id) {
        const invoice = storage.findById('invoices', parseInt(id));
        if (!invoice) {
            this.showNotification('Facture non trouvée', 'error');
            return;
        }

        document.getElementById('invoice-id').value = invoice.id;
        document.getElementById('invoice-patient-id').value = invoice.patientId;
        document.getElementById('numero-facture').value = invoice.numeroFacture;
        document.getElementById('date-facture').value = invoice.dateFacture;
        document.getElementById('statut-facture').value = invoice.statut;
        document.getElementById('notes-facture').value = invoice.notesFacture || '';

        // Charger les services
        const servicesList = document.getElementById('services-list');
        servicesList.innerHTML = '';
        invoice.services.forEach(service => {
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
                        <input type="text" class="service-description" value="${service.description}">
                    </div>
                    <div class="form-group">
                        <label>Quantité</label>
                        <input type="number" class="service-quantity" min="1" value="${service.quantite}">
                    </div>
                    <div class="form-group">
                        <label>Prix Unitaire (€)</label>
                        <input type="number" class="service-price" min="0" step="0.01" value="${service.prixUnitaire}">
                    </div>
                    <div class="form-group">
                        <label>Total (€)</label>
                        <input type="text" class="service-total" readonly value="${(service.quantite * service.prixUnitaire).toFixed(2)}">
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button type="button" class="btn btn-danger remove-service">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            servicesList.appendChild(serviceItem);
            this.attachServiceListeners(serviceItem);
        });

        document.getElementById('tva').value = invoice.tva;
        this.calculateTotals();

        document.getElementById('invoice-form-title').textContent = 'Modifier une Facture';
        this.currentInvoiceEditId = invoice.id;

        document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    editPayment(id) {
        const payment = storage.findById('payments', parseInt(id));
        if (!payment) {
            this.showNotification('Paiement non trouvé', 'error');
            return;
        }

        document.getElementById('payment-id').value = payment.id;
        document.getElementById('payment-invoice-id').value = payment.invoiceId;
        document.getElementById('date-paiement').value = payment.datePaiement;
        document.getElementById('montant-paiement').value = payment.montantPaiement;
        document.getElementById('mode-paiement').value = payment.modePaiement;
        document.getElementById('reference-paiement').value = payment.referencePaiement || '';
        document.getElementById('notes-paiement').value = payment.notesPaiement || '';

        document.getElementById('payment-form-title').textContent = 'Modifier un Paiement';
        this.currentPaymentEditId = payment.id;

        document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    handleInvoiceSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadInvoices();
            return;
        }

        const invoices = storage.get('invoices') || [];
        const results = invoices.filter(invoice => {
            const patient = storage.findById('patients', invoice.patientId);
            const patientName = patient ? `${patient.prenom} ${patient.nom}`.toLowerCase() : '';
            const term = searchTerm.toLowerCase();

            return patientName.includes(term) ||
                invoice.numeroFacture.toLowerCase().includes(term) ||
                invoice.dateFacture.includes(term);
        });

        this.displayInvoices(results);
    }

    handleStatusFilter(status) {
        if (!status) {
            this.loadInvoices();
            return;
        }

        const invoices = storage.get('invoices') || [];
        const filtered = invoices.filter(invoice => invoice.statut === status);
        this.displayInvoices(filtered);
    }

    handlePaymentSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadPayments();
            return;
        }

        const payments = storage.get('payments') || [];
        const results = payments.filter(payment => {
            const invoice = storage.findById('invoices', payment.invoiceId);
            const invoiceNumber = invoice ? invoice.numeroFacture.toLowerCase() : '';
            const term = searchTerm.toLowerCase();

            return invoiceNumber.includes(term) ||
                payment.modePaiement.toLowerCase().includes(term) ||
                payment.referencePaiement.toLowerCase().includes(term) ||
                payment.datePaiement.includes(term);
        });

        this.displayPayments(results);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialisation
let billingManager;
document.addEventListener('DOMContentLoaded', () => {
    billingManager = new BillingManager();

    // Attacher les listeners pour le premier service
    const firstService = document.querySelector('.service-item');
    if (firstService) {
        billingManager.attachServiceListeners(firstService);
    }
});

window.billingManager = billingManager;
