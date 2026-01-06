/**
 * Module Dashboard - Statistiques et aperçu du système avec graphiques Chart.js
 */

class DashboardManager {
    constructor() {
        this.charts = {};
        this.initializeDashboard();
    }

    initializeDashboard() {
        this.updateStatistics();
        this.loadRecentAppointments();
        this.loadRecentPatients();
        this.initializeCharts();
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

        // Mettre à jour les graphiques après la mise à jour des statistiques
        this.updateCharts();
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

    initializeCharts() {
        this.createPatientsStatusChart();
        this.createRevenueChart();
        this.createServicesChart();
        this.createRoomsOccupancyChart();
    }

    createPatientsStatusChart() {
        const ctx = document.getElementById('patients-status-chart');
        if (!ctx) return;

        const patients = storage.get('patients') || [];
        const statusData = this.getPatientsStatusData(patients);

        this.charts.patientsStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Actifs', 'Récemment sortis', 'En attente'],
                datasets: [{
                    data: statusData.values,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        const revenueData = this.getRevenueData();

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenus (€)',
                    data: revenueData.values,
                    backgroundColor: '#667eea',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '€';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createServicesChart() {
        const ctx = document.getElementById('services-chart');
        if (!ctx) return;

        const servicesData = this.getServicesData();

        this.charts.services = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: servicesData.labels,
                datasets: [{
                    data: servicesData.values,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createRoomsOccupancyChart() {
        const ctx = document.getElementById('rooms-occupancy-chart');
        if (!ctx) return;

        const roomsData = this.getRoomsOccupancyData();

        this.charts.roomsOccupancy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Occupées', 'Disponibles', 'Maintenance'],
                datasets: [{
                    label: 'Chambres',
                    data: roomsData.values,
                    backgroundColor: [
                        '#dc3545',
                        '#28a745',
                        '#ffc107'
                    ],
                    borderColor: [
                        '#dc3545',
                        '#28a745',
                        '#ffc107'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    getPatientsStatusData(patients) {
        // Simuler des données de statut pour la démo
        const total = patients.length || 15;
        return {
            labels: ['Actifs', 'Récemment sortis', 'En attente'],
            values: [
                Math.floor(total * 0.7),
                Math.floor(total * 0.2),
                Math.floor(total * 0.1)
            ]
        };
    }

    getRevenueData() {
        const invoices = storage.get('invoices') || [];
        const monthlyData = {};

        // Générer des données mensuelles pour les 6 derniers mois
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
        months.forEach(month => {
            monthlyData[month] = Math.floor(Math.random() * 10000) + 5000;
        });

        return {
            labels: months,
            values: months.map(month => monthlyData[month])
        };
    }

    getServicesData() {
        const invoices = storage.get('invoices') || [];
        const servicesCount = {};

        // Compter les types de services
        invoices.forEach(invoice => {
            if (invoice.services) {
                invoice.services.forEach(service => {
                    servicesCount[service.type] = (servicesCount[service.type] || 0) + 1;
                });
            }
        });

        // Si pas de données, générer des données de démo
        if (Object.keys(servicesCount).length === 0) {
            servicesCount['Consultation'] = 45;
            servicesCount['Hospitalisation'] = 23;
            servicesCount['Chirurgie'] = 12;
            servicesCount['Examen'] = 34;
            servicesCount['Médicament'] = 28;
        }

        return {
            labels: Object.keys(servicesCount),
            values: Object.values(servicesCount)
        };
    }

    getRoomsOccupancyData() {
        const rooms = storage.get('rooms') || [];

        // Si pas de données, générer des données de démo
        if (rooms.length === 0) {
            return {
                labels: ['Occupées', 'Disponibles', 'Maintenance'],
                values: [12, 8, 3]
            };
        }

        const occupied = rooms.filter(room => room.statut === 'Occupée').length;
        const available = rooms.filter(room => room.statut === 'Disponible').length;
        const maintenance = rooms.filter(room => room.statut === 'Maintenance').length;

        return {
            labels: ['Occupées', 'Disponibles', 'Maintenance'],
            values: [occupied, available, maintenance]
        };
    }

    updateCharts() {
        // Mettre à jour les graphiques avec les nouvelles données
        if (this.charts.patientsStatus) {
            const patients = storage.get('patients') || [];
            const statusData = this.getPatientsStatusData(patients);
            this.charts.patientsStatus.data.datasets[0].data = statusData.values;
            this.charts.patientsStatus.update();
        }

        if (this.charts.roomsOccupancy) {
            const roomsData = this.getRoomsOccupancyData();
            this.charts.roomsOccupancy.data.datasets[0].data = roomsData.values;
            this.charts.roomsOccupancy.update();
        }
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.updateStatistics();
        }, 30000); // Rafraîchir toutes les 30 secondes
    }
}

// Ajouter les styles CSS pour les graphiques
const chartStyles = document.createElement('style');
chartStyles.textContent = `
    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin: 30px 0;
    }

    .chart-container {
        background: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
    }

    .chart-container:hover {
        transform: translateY(-2px);
    }

    .chart-container h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 1.1rem;
        font-weight: 600;
        text-align: center;
    }

    .chart-container canvas {
        max-height: 250px;
    }

    @media (max-width: 768px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }
        
        .chart-container {
            padding: 15px;
        }
    }
`;

document.addEventListener('DOMContentLoaded', () => {
    if (!chartStyles.parentNode) {
        document.head.appendChild(chartStyles);
    }
    new DashboardManager();
});
