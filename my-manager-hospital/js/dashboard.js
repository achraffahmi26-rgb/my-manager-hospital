/**
 * Module Dashboard - Statistiques et aperçu du système
 */

class DashboardManager {
    constructor() {
        this.initializeDashboard();
    }

    initializeDashboard() {
        this.updateStatistics();
        this.loadRecentAppointments();
        this.loadRecentPatients();
        this.setupAutoRefresh();
    }

    updateStatistics() {
        const stats = storage.getStatistics();

        document.getElementById('total-patients').textContent = stats.patients || 0;
        document.getElementById('total-doctors').textContent = stats.doctors || 0;
        document.getElementById('today-appointments').textContent = this.getTodayAppointments();
        document.getElementById('available-rooms').textContent = this.getAvailableRooms();
        document.getElementById('low-stock').textContent = this.getLowStockMedicaments();
        document.getElementById('total-revenue').textContent = this.getTotalRevenue() + '€';
    }

    getTodayAppointments() {
        const appointments = storage.get('appointments') || [];
        const today = new Date().toISOString().split('T')[0];
        return appointments.filter(apt => apt.date === today).length;
    }

    getAvailableRooms() {
        const rooms = storage.get('rooms') || [];
        return rooms.filter(room => room.statut === 'Disponible').length;
    }

    getLowStockMedicaments() {
        const medicaments = storage.get('medicaments') || [];
        return medicaments.filter(med => med.stockActuel <= med.stockMinimum).length;
    }

    getTotalRevenue() {
        const invoices = storage.get('invoices') || [];
        return invoices.reduce((total, invoice) => total + (invoice.totalGeneral || 0), 0).toFixed(2);
    }

    loadRecentAppointments() {
        const appointments = storage.get('appointments') || [];
        const recent = appointments.slice(-5).reverse();
        const container = document.getElementById('recent-appointments');

        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun rendez-vous récent</p>';
            return;
        }

        container.innerHTML = recent.map(apt => {
            const patient = storage.findById('patients', apt.patientId);
            const doctor = storage.findById('doctors', apt.doctorId);

            return `
                <div class="recent-item">
                    <div class="recent-item-title">
                        ${patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}
                    </div>
                    <div class="recent-item-info">
                        ${doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : 'Médecin inconnu'} - 
                        ${new Date(apt.date).toLocaleDateString('fr-FR')} ${apt.heure}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadRecentPatients() {
        const patients = storage.get('patients') || [];
        const recent = patients.slice(-5).reverse();
        const container = document.getElementById('recent-patients');

        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-center">Aucun patient récent</p>';
            return;
        }

        container.innerHTML = recent.map(patient => `
            <div class="recent-item">
                <div class="recent-item-title">${patient.prenom} ${patient.nom}</div>
                <div class="recent-item-info">
                    ${patient.age} ans - ${patient.telephone}
                </div>
            </div>
        `).join('');
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.updateStatistics();
        }, 30000); // Rafraîchir toutes les 30 secondes
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
