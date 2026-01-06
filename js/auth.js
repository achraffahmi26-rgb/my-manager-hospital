/**
 * Module d'authentification pour le Système Hospitalier
 * Gestion login/logout avec sessionStorage
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'hospital_user_session';
        this.initializeAuth();
    }

    initializeAuth() {
        // Vérifier si une session existe
        const sessionData = sessionStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                this.currentUser = JSON.parse(sessionData);
                // Si on est sur la page login et qu'une session existe, rediriger
                if (window.location.pathname.includes('login.html')) {
                    this.redirectToDashboard();
                }
            } catch (error) {
                this.clearSession();
            }
        }

        // Si on n'est pas sur login.html et qu'il n'y a pas de session, rediriger
        if (!window.location.pathname.includes('login.html') && !this.isLoggedIn()) {
            this.redirectToLogin();
        }

        // Initialiser les écouteurs si on est sur login.html
        if (window.location.pathname.includes('login.html')) {
            this.initializeLoginListeners();
        }

        // Ajouter le bouton logout si nécessaire
        this.addLogoutButton();
    }

    initializeLoginListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Gestion du "mot de passe oublié"
        const forgotPasswordLink = document.querySelector('.forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }

    handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Validation simple
        if (!this.validateLogin(email, password)) {
            return;
        }

        // Vérification des identifiants (pour démo)
        if (this.authenticateUser(email, password)) {
            const user = {
                id: 1,
                email: email,
                name: 'Administrateur',
                role: 'admin',
                loginTime: new Date().toISOString()
            };

            this.createSession(user, rememberMe);
            this.showNotification('Connexion réussie!', 'success');

            // Rediriger vers le dashboard
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1000);
        } else {
            this.showNotification('Email ou mot de passe incorrect', 'error');
        }
    }

    validateLogin(email, password) {
        const errors = [];

        if (!email) {
            errors.push('L\'email est requis');
        } else if (!this.isValidEmail(email)) {
            errors.push('L\'email n\'est pas valide');
        }

        if (!password) {
            errors.push('Le mot de passe est requis');
        } else if (password.length < 6) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }

        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    authenticateUser(email, password) {
        // Pour la démo: admin@hopital.fr / admin123
        const validCredentials = [
            { email: 'admin@hopital.fr', password: 'admin123', name: 'Administrateur' },
            { email: 'medecin@hopital.fr', password: 'medecin123', name: 'Médecin' },
            { email: 'infirmier@hopital.fr', password: 'infirmier123', name: 'Infirmier' }
        ];

        return validCredentials.some(cred =>
            cred.email === email && cred.password === password
        );
    }

    createSession(user, rememberMe) {
        this.currentUser = user;

        // Stocker dans sessionStorage
        sessionStorage.setItem(this.sessionKey, JSON.stringify(user));

        // Optionnellement stocker dans localStorage si "se souvenir de moi"
        if (rememberMe) {
            localStorage.setItem('hospital_remember_user', JSON.stringify({
                email: user.email,
                name: user.name
            }));
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    logout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            this.clearSession();
            this.showNotification('Déconnexion réussie', 'info');
            setTimeout(() => {
                this.redirectToLogin();
            }, 500);
        }
    }

    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem('hospital_remember_user');
        this.currentUser = null;
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    redirectToDashboard() {
        window.location.href = 'index.html';
    }

    handleForgotPassword() {
        const email = prompt('Entrez votre email pour réinitialiser votre mot de passe:');
        if (email && this.isValidEmail(email)) {
            this.showNotification(`Un email de réinitialisation a été envoyé à ${email}`, 'info');
        } else if (email) {
            this.showNotification('Email invalide', 'error');
        }
    }

    addLogoutButton() {
        if (!this.isLoggedIn()) return;

        const header = document.querySelector('.header');
        if (header) {
            // Créer le conteneur utilisateur en haut à droite
            if (!document.querySelector('.user-header-info')) {
                const userContainer = document.createElement('div');
                userContainer.className = 'user-header-info';
                userContainer.innerHTML = `
                    <span class="user-name">
                        <i class="fas fa-user-circle"></i>
                        ${this.currentUser.name}
                    </span>
                    <button id="logout-btn" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        Déconnexion
                    </button>
                `;

                // Ajouter le conteneur en haut à droite du header
                header.appendChild(userContainer);

                // Attacher l'événement logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => this.logout());
                }
            }
        }
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

    showErrors(errors) {
        this.showNotification('Erreurs de validation:\n' + errors.join('\n'), 'error');
    }
}

// Ajouter les styles CSS pour les éléments d'authentification
const authStyles = document.createElement('style');
authStyles.textContent = `
    .user-header-info {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 100;
    }
    
    .user-name {
        color: #667eea;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        background: rgba(255, 255, 255, 0.9);
        padding: 8px 12px;
        border-radius: 20px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .logout-btn {
        background: #dc3545 !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 20px !important;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
    }
    
    .logout-btn:hover {
        background: #c82333 !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
    }
    
    .header {
        position: relative !important;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @media (max-width: 768px) {
        .user-header-info {
            position: relative;
            top: auto;
            right: auto;
            justify-content: center;
            margin-top: 10px;
            padding: 0 20px;
        }
        
        .user-name {
            font-size: 0.8rem;
            padding: 6px 10px;
        }
        
        .logout-btn {
            font-size: 0.75rem !important;
            padding: 6px 12px !important;
        }
    }
`;

// Initialiser le gestionnaire d'authentification
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    if (!authStyles.parentNode) {
        document.head.appendChild(authStyles);
    }
    authManager = new AuthManager();
    // Export pour utilisation globale après l'initialisation
    window.authManager = authManager;
});
