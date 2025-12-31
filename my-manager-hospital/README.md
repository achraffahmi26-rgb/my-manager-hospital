# Système de Gestion Hospitalière Informatique

Un système complet de gestion hospitalière développé en HTML5, CSS3 et JavaScript vanilla avec LocalStorage comme base de données locale.

## 🎯 Objectifs

- Digitaliser la gestion d'un hôpital
- Automatiser la gestion des patients, médecins, rendez-vous, prescriptions, chambres et facturation
- Fournir une interface professionnelle et intuitive
- Garantir la persistance des données avec LocalStorage
- Respecter les bonnes pratiques de développement

## 🧩 Modules Implémentés

### 👥 Patients
- **CRUD complet**: Ajouter, modifier, supprimer, afficher
- **Recherche avancée**: Par nom, prénom, téléphone, email, adresse
- **Données complètes**: ID, Nom, Prénom, Âge, Sexe, Téléphone, Adresse, Historique médical
- **Export CSV**: Pour l'analyse externe

### 👨‍⚕️ Médecins & Personnel
- **Gestion complète**: CRUD pour médecins et staff
- **Spécialités**: Cardiologie, Pédiatrie, Gynécologie, Neurologie, etc.
- **Services**: Urgences, Chirurgie, Maternité, etc.
- **Horaires**: Gestion des heures de travail
- **Statistiques**: Par spécialité

### 📅 Rendez-vous
- **CRUD complet**: Gestion des rendez-vous
- **Liaison**: Patient ↔ Médecin
- **Gestion des conflits**: Vérification automatique des disponibilités
- **Filtrage**: Par date et statut
- **Statuts**: Programmé, Confirmé, En cours, Terminé, Annulé

### 💊 Pharmacie & Prescriptions
- **Médicaments**: Gestion du stock avec alertes de rupture
- **Prescriptions**: Lien patient-médecin-médicament
- **Mise à jour automatique**: Stock ajusté lors des prescriptions
- **Alertes**: Stock faible et rupture
- **Familles**: Antibiotiques, Antalgiques, Anti-inflammatoires, etc.

### 🏥 Chambres & Lits
- **Gestion des chambres**: Par type, service, capacité
- **Admissions**: Gestion complète des entrées/sorties
- **Occupation**: Suivi en temps réel des lits
- **Types**: Standard, VIP, Urgence, Réanimation, etc.
- **Visualisation**: Graphique d'occupation

### 💰 Facturation
- **Factures**: Création avec calculs automatiques
- **Services multiples**: Consultation, hospitalisation, médicaments, etc.
- **TVA**: Calcul automatique
- **Paiements**: Suivi des règlements
- **Statuts**: Non payée, Partiellement payée, Payée

### 📊 Dashboard
- **Statistiques en temps réel**: Patients, médecins, rendez-vous du jour
- **Alertes**: Médicaments en rupture, chambres disponibles
- **Revenus**: Total des facturations
- **Activité récente**: Derniers rendez-vous et patients

## 🏗️ Architecture du Projet

```
hospital-management/
│
├── index.html          # Dashboard principal
├── patients.html        # Gestion des patients
├── doctors.html         # Gestion des médecins
├── appointments.html    # Gestion des rendez-vous
├── pharmacy.html        # Pharmacie et prescriptions
├── rooms.html          # Chambres et admissions
├── billing.html        # Facturation et paiements
│
├── css/
│   └── style.css        # Styles globaux
│
├── js/
│   ├── storage.js      # Gestion LocalStorage
│   ├── patients.js     # Module patients
│   ├── doctors.js      # Module médecins
│   ├── appointments.js # Module rendez-vous
│   ├── pharmacy.js     # Module pharmacie
│   ├── rooms.js        # Module chambres
│   ├── billing.js      # Module facturation
│   └── dashboard.js    # Dashboard
│
└── assets/             # Images et ressources
```

## 💾 Base de Données

Le système utilise **LocalStorage** comme base de données locale avec :
- **Persistance**: Données conservées après rechargement
- **Structure JSON**: Format standardisé
- **Compteurs automatiques**: Génération d'IDs uniques
- **Données de démonstration**: Initialisation avec exemples

## 🎨 Interface Utilisateur

- **Design moderne**: Interface responsive et professionnelle
- **Navigation intuitive**: Menu principal cohérent
- **Formulaires validés**: Contrôles en temps réel
- **Notifications**: Feedback utilisateur immédiat
- **Animations**: Transitions fluides et professionnelles
- **Responsive**: Adaptation mobile/tablette

## 🔧 Technologies Utilisées

- **HTML5**: Sémantique et accessibilité
- **CSS3**: Flexbox, Grid, animations
- **JavaScript ES6+**: Modules, classes, arrow functions
- **LocalStorage**: Persistance des données
- **Font Awesome**: Icônes professionnelles

## 📋 Fonctionnalités Clés

### ✅ Validation des Données
- Champs obligatoires
- Formats spécifiques (email, téléphone)
- Contrôles de cohérence
- Messages d'erreur clairs

### 🔍 Recherche et Filtrage
- Recherche en temps réel
- Filtres multiples
- Tri par colonnes
- Export des résultats

### 📈 Statistiques et Rapports
- Tableaux de bord dynamiques
- Calculs automatiques
- Visualisation des tendances
- Export CSV

### 🔒 Sécurité des Données
- Échappement HTML
- Validation côté client
- Stockage local sécurisé
- Pas de données sensibles externes

## 🚀 Installation et Utilisation

1. **Cloner le projet**:
   ```bash
   git clone [repository-url]
   cd hospital-management
   ```

2. **Ouvrir l'application**:
   - Ouvrir `index.html` dans un navigateur web moderne
   - Ou utiliser un serveur local pour meilleur fonctionnement

3. **Navigation**:
   - Utiliser le menu principal pour accéder aux modules
   - Le dashboard affiche un aperçu général

## 🎓 Pédagogie et Apprentissage

Ce projet est conçu pour être un **exemple académique complet** démontrant :
- **Architecture modulaire**: Séparation des responsabilités
- **Gestion des données**: CRUD complet avec LocalStorage
- **Interface utilisateur**: Design responsive et moderne
- **Bonnes pratiques**: Code commenté et maintenable
- **Résolution de problèmes**: Gestion des conflits, validation

## 🔄 Maintenance et Évolutions

### Améliorations Possibles
- **Base de données externe**: Firebase, Supabase
- **Authentification**: Gestion des rôles utilisateurs
- **API REST**: Communication avec d'autres systèmes
- **Rapports avancés**: PDF, graphiques complexes
- **Notifications push**: Rappels de rendez-vous

### Tests Recommandés
- **Tests unitaires**: Chaque module JavaScript
- **Tests d'intégration**: Flux complets
- **Tests UI**: Comportement utilisateur
- **Tests de performance**: Volume de données

## 📝 Documentation Technique

### Modules JavaScript
Chaque module suit la structure :
```javascript
class ModuleManager {
    constructor() {
        this.initializeEventListeners();
        this.loadData();
    }
    
    // CRUD methods
    add() { /* ... */ }
    update() { /* ... */ }
    delete() { /* ... */ }
    
    // UI methods
    display() { /* ... */ }
    validate() { /* ... */ }
}
```

### Gestion des Données
Le `StorageManager` centralise :
- Opérations CRUD génériques
- Gestion des compteurs d'ID
- Import/Export des données
- Statistiques des collections

## 🤝 Contribution

Ce projet est un **modèle éducatif**. Pour contribuer :
1. Fork le projet
2. Créer une branche de fonctionnalité
3. Implémenter avec tests
4. Documenter les changements
5. Proposer une pull request

## 📄 Licence

Ce projet est destiné à un usage **éducatif et académique**.

---

**Développé avec ❤️ pour l'enseignement des technologies web modernes**
