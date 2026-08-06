# Hammam YZA Gestion 🧖‍♂️

Logiciel de gestion complet pour établissement de Hammam, incluant la gestion des clients, des réservations, du stock et du personnel. Développé avec React, TypeScript et Firebase.

## 🚀 Fonctionnalités
- 👥 **Gestion Clientèle** : Suivi des visites et fidélité.
- 📅 **Réservations** : Planning des sessions et services.
- 🛒 **Point de Vente (POS)** : Interface de caisse tactile, gestion des sessions de caisse (ouverture/fermeture).
- 🏷️ **Catalogue** : Gestion des Services (durée, prix) et Produits (stock, alertes).
- 📊 **Rapports Z** : Clôture journalière et rapports financiers détaillés.
- 📦 **Stock** : Inventaire des produits et alertes de seuil critique.
- 👔 **Personnel** : Gestion des comptes et des rôles (Admin, Manager, Caissier).
- 💻 **Multi-plateforme** : Disponible sur Windows (Electron) et Android (Capacitor).

---

## ⚙️ Configuration (Google Firebase / Console)

Pour synchroniser vos données sur le Cloud et utiliser l'application sur plusieurs appareils, vous devez configurer un projet Firebase.

### Étape 1 : Créer le projet
1. Allez sur la [Console Firebase](https://console.firebase.google.com/).
2. Cliquez sur **Ajouter un projet** (ou *Add project*).
3. Entrez le nom du projet : **Qalbi Itmaan** et cliquez sur "Continuer".
4. Désactivez Google Analytics (ce n'est pas nécessaire) puis cliquez sur **"Créer le projet"**.
5. Attendez la fin de la création, puis cliquez sur "Continuer".

### Étape 2 : Activer l'Authentification
1. Dans le menu de gauche, cliquez sur **Authentication**.
2. Cliquez sur le bouton **Commencer** (*Get Started*).
3. Dans l'onglet **"Sign-in method"**, choisissez **"Adresse e-mail/Mot de passe"**.
4. Cochez uniquement le premier interrupteur **"Activer"** (Email/Password). *Ne cochez pas le lien sans mot de passe*.
5. Cliquez sur **Enregistrer**.

### Étape 3 : Créer la base de données (Firestore)
1. Toujours dans le menu de gauche, cliquez sur **Base de données Firestore** (*Firestore Database*).
2. Cliquez sur **"Créer une base de données"**.
3. Choisissez le **"Mode de production"** (Production mode) et cliquez sur Suivant.
4. Laissez la région par défaut (ex: `eur3`) et cliquez sur **Activer** (*Enable*).
5. Une fois créée, allez dans l'onglet **"Règles"** (*Rules*) en haut de la page.
6. Supprimez tout le texte et remplacez-le par ce code exact pour sécuriser vos données :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
7. Cliquez sur **Publier**.

### Étape 4 : Récupérer la configuration de l'application
1. Cliquez sur la **roue crantée (Paramètres ⚙️)** en haut à gauche (à côté de "Vue d'ensemble du projet"), puis sur **Paramètres du projet** (*Project settings*).
2. Descendez jusqu'à la section **"Vos applications"**.
3. Cliquez sur l'icône web **`</>`**.
4. Donnez un pseudo (ex: **"Qalbi Itmaan Web"**). Ne cochez pas Firebase Hosting.
5. Cliquez sur **"Enregistrer l'application"**.
6. Copiez **uniquement le contenu entre les accolades** de l'objet `firebaseConfig`.
*Exemple :*
```json
{
  "apiKey": "AIzaSyB...",
  "authDomain": "qalbi-itmaan-XXXX.firebaseapp.com",
  "projectId": "qalbi-itmaan-XXXX",
  "storageBucket": "qalbi-itmaan-XXXX.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}
```

### Étape 5 : Lier la base de données à l'application
L'application dispose d'un **Assistant de Configuration** (`/setup`) intégré.

1. Lancez l'application (Android ou Windows).
2. Si vous êtes bloqué sur la page de connexion, cliquez sur l'icône corbeille **"Réinitialiser l'application"** tout en bas de la page. Tapez **RESET** pour confirmer.
3. L'application redémarrera sur l'écran bleu de **"Configuration Initial"**.
4. Choisissez "Cloud Firebase".
5. Collez le bloc de code JSON que vous venez de copier.
6. Choisissez un email et un mot de passe pour le compte **Administrateur**.
7. Cliquez sur **"Initialiser la configuration"**. L'application est maintenant liée et sécurisée !

---

## 📥 Installation & Initialisation

Si vous venez de récupérer le code source (sans les dossiers `node_modules`, `android` ou `electron`), voici comment restaurer l'environnement :

### 1. Installer les dépendances
```bash
npm install
```

### 2. Dossier Android (Généré) 📱
Le dossier `android/` est un dossier généré par Capacitor. S'il est absent, voici la commande pour le créer :
```bash
# 1. Installer la dépendance android (si ce n'est pas déjà fait)
npm install @capacitor/android

# 2. Créer le dossier android
npx cap add android

# 3. Synchroniser le code web vers le dossier android
npx cap sync
```

### 3. Dossier Electron (Code Source) 🖥️
⚠️ **Attention** : Contrairement à Android, le dossier `electron/` (contenant `main.js`, `preload.js`) **n'est pas généré automatiquement**. Il fait partie du code source de l'application que nous avons écrit manuellement.

**Si le dossier `electron/` est manquant**, vous devez récupérer ces fichiers depuis votre sauvegarde ou le dépôt source. Il n'existe pas de commande "magique" `npx create-electron` pour restaurer notre configuration spécifique.

Cependant, assurez-vous d'avoir les dépendances installées :
```bash
npm install electron electron-builder wait-on concurrently --save-dev
```

---

## 🛠️ Build & Installation

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (pour la version Android)

### Installation des dépendances
```bash
npm install
```

### 🖥️ Version Electron (Windows)
Pour créer l'installeur `.exe` pour Windows :
```bash
npm run desktop:dist
```
Le fichier d'installation sera généré dans le dossier `release/`.

> **Note**: Pour changer l'icône de l'application, remplacez le fichier `public/icon.png` et lancez `npm run generate:icon` avant le build.

### 📱 Version Android (Méthode Manuelle PowerShell)

Si les commandes `npm run mobile:apk:...` échouent à cause des variables d'environnement (JAVA_HOME, ANDROID_HOME), utilisez cette méthode qui configure tout correctement pour la session actuelle.

#### 1. Synchroniser le projet
Assurez-vous que le dossier `android` est à jour avec votre code :
```powershell
npm run build
npx cap sync android
```

#### 2. Générer l'APK (Debug ou Release)
Ouvrez un terminal **PowerShell** à la racine du projet et collez l'un des blocs suivants en entier :

**Pour la version DEBUG (Test) :**
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"; $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"; cd android; .\gradlew.bat assembleDebug
```
📂 Fichier généré : `android/app/build/outputs/apk/debug/app-debug.apk`

**Pour la version RELEASE (Production) :**
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"; $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"; cd android; .\gradlew.bat assembleRelease
```
📂 Fichier généré : `android/app/build/outputs/apk/release/app-release-unsigned.apk` (ou signé si configuré)

> **Note :** Ces commandes configurent temporairement `JAVA_HOME` vers le JDK intégré à Android Studio et `ANDROID_HOME` vers l'emplacement par défaut du SDK Android, ce qui évite les erreurs de configuration courantes.

#### Ouvrir dans Android Studio (Alternative)
Si vous préférez utiliser l'interface graphique :
```bash
npx cap open android
```

---

## 👨‍💻 Développement
- Lancer en mode Web : `npm run dev`
- Lancer en mode Desktop (Dev) : `npm run desktop:dev`

---
© 2026 Tika Tech - Hammam YZA Gestion