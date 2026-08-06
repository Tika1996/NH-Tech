# 📖 Manuel d'Utilisation - Hammam YZA Gestion

> **Version** : 1.0  
> **Dernière mise à jour** : Février 2026  
> **Développé par** : Tika Tech

---

## 📑 Table des Matières

1. [Introduction](#introduction)
2. [Configuration Initiale](#configuration-initiale)
3. [Connexion à l'Application](#connexion-à-lapplication)
4. [Point de Vente (POS)](#point-de-vente-pos)
5. [Gestion des Clients](#gestion-des-clients)
6. [Catalogue (Services & Produits)](#catalogue-services--produits)
7. [Gestion du Personnel](#gestion-du-personnel)
8. [Rapports et Tableau de Bord](#rapports-et-tableau-de-bord)
9. [Paramètres](#paramètres)
10. [Mode Hors Ligne](#mode-hors-ligne)
11. [FAQ & Dépannage](#faq--dépannage)

---

## Introduction

**Hammam YZA Gestion** est un logiciel de gestion complet conçu pour les établissements de Hammam. Il vous permet de :

- 🛒 **Gérer les ventes** via un Point de Vente (POS) tactile
- 👥 **Suivre vos clients** et leur fidélité
- 📦 **Gérer votre catalogue** de services et produits
- 👔 **Administrer votre personnel** et leurs rôles
- 📊 **Analyser vos performances** avec des rapports détaillés
- 🔄 **Travailler hors ligne** avec synchronisation automatique

### Rôles Utilisateurs

| Rôle | Accès |
|------|-------|
| **Admin** | Accès complet à toutes les fonctionnalités |
| **Manager** | Accès au POS, clients, catalogue, personnel, rapports |
| **Caissier** | Accès au POS et gestion des clients |
| **Staff** | Accès limité au POS |

---

## Configuration Initiale

### Premier Lancement

Au premier lancement de l'application, un **Assistant de Configuration** s'affiche automatiquement.

#### Option 1 : Mode Cloud (Firebase) - Recommandé

1. Choisissez **"Cloud Firebase"**
2. Entrez les informations de votre projet Firebase :
   - **API Key** : Clé API de votre projet
   - **Project ID** : Identifiant du projet
   - **Auth Domain** : Domaine d'authentification
   - **Storage Bucket** : Bucket de stockage
   - **Messaging Sender ID** : ID de messagerie
   - **App ID** : Identifiant de l'application
3. Cliquez sur **"Valider et Démarrer"**

> [!TIP]
> Ces informations se trouvent dans la **Console Firebase** > Paramètres du projet > Configuration.

#### Option 2 : Mode Local (Hors Ligne)

1. Choisissez **"Mode Local"**
2. Créez un compte administrateur :
   - Nom complet
   - Email
   - Mot de passe
3. L'application fonctionnera entièrement en local

### Création du Premier Compte Admin

Si vous utilisez Firebase, le premier utilisateur doit être créé depuis la Console Firebase :

1. Allez dans **Firebase Console** > **Authentication** > **Users**
2. Cliquez sur **"Ajouter un utilisateur"**
3. Entrez l'email et le mot de passe
4. Dans **Firestore Database**, créez un document dans la collection `staff` avec :
   ```json
   {
     "authUid": "[UID de l'utilisateur créé]",
     "email": "admin@exemple.com",
     "name": "Administrateur",
     "role": "admin",
     "isActive": true
   }
   ```

---

## Connexion à l'Application

### Écran de Connexion

1. Entrez votre **email**
2. Entrez votre **mot de passe**
3. Cliquez sur **"Se connecter"**

### Mot de Passe Oublié

1. Cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre adresse email
3. Consultez votre boîte mail pour le lien de réinitialisation

> [!NOTE]
> La réinitialisation par email nécessite le mode Cloud (Firebase).

---

## Point de Vente (POS)

Le POS est l'interface principale pour enregistrer les ventes.

### Ouverture de Caisse

Avant de commencer une session de vente :

1. Cliquez sur **"Ouvrir la caisse"**
2. Entrez le **montant de départ** (fond de caisse)
3. Confirmez l'ouverture

### Effectuer une Vente

#### Étape 1 : Sélectionner les articles

1. **Recherchez** un service ou produit via la barre de recherche
2. **Filtrez par catégorie** : Hammam, Massage, Soins, Packs, Produits
3. **Cliquez** sur un article pour l'ajouter au panier

#### Étape 2 : Modifier le panier

- **Quantité** : Utilisez les boutons `+` et `-`
- **Supprimer** : Cliquez sur l'icône 🗑️
- **Réduction** : Cliquez sur l'icône `%` pour appliquer une remise

#### Étape 3 : Sélectionner un client (optionnel)

1. Cliquez sur **"Sélectionner client"**
2. Recherchez ou créez un nouveau client
3. Les points de fidélité seront automatiquement comptabilisés

#### Étape 4 : Encaisser

1. Cliquez sur **"Espèces"** pour un paiement en liquide
2. Confirmez le montant reçu
3. Le reçu s'affiche automatiquement

### Système de Box (Casiers)

Pour les clients qui restent plusieurs heures :

1. Cliquez sur **"Ajouter au Box"**
2. Sélectionnez un numéro de box disponible
3. Le client peut consommer plusieurs services
4. À la fin, récupérez le box et encaissez tout

#### Récupérer un Box

1. Cliquez sur le box occupé dans la grille
2. Consultez le récapitulatif des consommations
3. Cliquez sur **"Encaisser"**

### Fermeture de Caisse

1. Cliquez sur **"Fermer la caisse"**
2. Entrez le **montant compté** dans le tiroir
3. Vérifiez l'écart éventuel
4. Ajoutez des **notes** si nécessaire
5. Confirmez la fermeture

> [!IMPORTANT]
> La fermeture de caisse génère un rapport Z qui sera archivé.

### Passation de Caisse (Handover)

Le système permet de laisser un fond de caisse pour la prochaine session (ex: caissier du matin vers caissier du soir).

1.  Lors de la **Fermeture de Caisse** :
    - Remplissez le champ **"Fond laissé pour le prochain"** avec le montant que vous laissez dans le tiroir.
    - Ce montant sera automatiquement proposé comme "Fond de caisse" pour la prochaine ouverture.

2.  Lors de la **Prochaine Ouverture** :
    - Le système affichera **"Dernier fond laissé : X DZD"**.
    - Vérifiez que le montant physique correspond et confirmez l'ouverture.

3.  **Rapports de Sessions** :
    - Dans l'onglet "Rapports" > "Sessions de Caisse", retrouvez l'historique complet :
        - Montant d'ouverture
        - Montant de fermeture
        - Montant Attendu (Ouverture + Ventes Espèces)
        - Écart (Différence)
        - Fond laissé

---

## Gestion des Clients

### Accéder à la Liste des Clients

1. Cliquez sur **"Clients"** dans le menu latéral

### Ajouter un Client

1. Cliquez sur **"+ Nouveau client"**
2. Remplissez les informations :
   - **Nom** (obligatoire)
   - **Téléphone**
   - **Email**
   - **Langue préférée** (Français/Arabe)
   - **Notes**
3. Cliquez sur **"Enregistrer"**

### Modifier un Client

1. Cliquez sur la ligne du client
2. Modifiez les informations
3. Cliquez sur **"Sauvegarder"**

### Programme de Fidélité

Le système de fidélité fonctionne automatiquement :

- Chaque visite ajoute **1 point**
- Après **X visites** (configurable), le client reçoit un service gratuit
- Le badge 🎁 apparaît dans le POS quand un client est éligible

---

## Catalogue (Services & Produits)

### Services

#### Accéder aux Services

1. Cliquez sur **"Services"** dans le menu latéral

#### Ajouter un Service

1. Cliquez sur **"+ Nouveau service"**
2. Remplissez :
   - **Nom** (Français et Arabe)
   - **Catégorie** (Hammam, Massage, Soins, etc.)
   - **Prix** (en DZD)
   - **Durée** (en minutes)
   - **Type de commission** (Fixe ou Pourcentage)
   - **Valeur commission**
3. Cliquez sur **"Créer"**

### Produits

#### Accéder aux Produits

1. Cliquez sur **"Produits"** dans le menu latéral

#### Ajouter un Produit

1. Cliquez sur **"+ Nouveau produit"**
2. Remplissez :
   - **Nom** (Français et Arabe)
   - **Catégorie**
   - **SKU** (code interne)
   - **Code-barres** (optionnel)
   - **Prix de vente** (en DZD)
   - **Prix d'achat** (pour calcul marge)
   - **Stock actuel**
   - **Stock minimum** (seuil d'alerte)
   - **Unité** (unité, ml, g, etc.)
3. Cliquez sur **"Créer"**

> [!WARNING]
> Quand le stock atteint le seuil minimum, une alerte s'affiche sur le tableau de bord.

---

## Gestion du Personnel

> [!NOTE]
> Cette section est accessible uniquement aux **Admins** et **Managers**.

### Accéder à la Liste du Personnel

1. Cliquez sur **"Personnel"** dans le menu latéral

### Ajouter un Employé

1. Cliquez sur **"+ Nouvel employé"**
2. Remplissez :
   - **Nom complet**
   - **Email** (servira d'identifiant)
   - **Mot de passe temporaire**
   - **Téléphone**
   - **Rôle** (Admin, Manager, Caissier, Staff)
   - **Taux de commission** (%)
   - **Code PIN** (optionnel, pour accès rapide)
3. Cliquez sur **"Créer le compte"**

### Modifier les Droits

1. Cliquez sur l'employé dans la liste
2. Modifiez le **rôle**
3. Activez/Désactivez le compte avec le switch **"Actif"**
4. Sauvegardez

### Supprimer un Employé

> [!CAUTION]
> La suppression est irréversible. Préférez **désactiver** le compte.

1. Cliquez sur l'icône 🗑️
2. Confirmez la suppression

---

## Rapports et Tableau de Bord

### Tableau de Bord

Le tableau de bord affiche en temps réel :

- **Chiffre d'affaires du jour**
- **Nombre de clients**
- **Services les plus populaires**
- **Produits les plus vendus**
- **Alertes de stock**
- **Transactions récentes**

### Rapports Détaillés

> [!NOTE]
> Accessible aux **Admins** et **Managers** uniquement.

1. Cliquez sur **"Rapports"** dans le menu
2. Sélectionnez la période (Aujourd'hui, Semaine, Mois, Personnalisé)
3. Consultez :
   - **Ventes par catégorie**
   - **Ventes par employé**
   - **Évolution du CA**
   - **Rapports Z archivés**

### Exporter un Rapport

1. Cliquez sur **"Exporter PDF"**
2. Le fichier sera téléchargé automatiquement

---

## Paramètres

> [!NOTE]
> Accessible aux **Admins** uniquement.

### Accéder aux Paramètres

1. Cliquez sur **"Paramètres"** dans le menu latéral

### Options Disponibles

#### Général
- **Langue de l'interface** : Français ou Arabe
- **Thème** : Clair ou Sombre

#### Programme de Fidélité
- **Activer/Désactiver** le programme
- **Nombre de visites requises** pour le service gratuit
- **Service offert** à sélectionner

#### Informations de l'Établissement
- Nom de l'établissement
- Adresse
- Téléphone
- Logo (affiché sur les reçus)

---

## Mode Hors Ligne

L'application fonctionne même sans connexion internet.

### Fonctionnement

1. **Quand vous êtes hors ligne** :
   - Toutes les opérations sont enregistrées localement
   - Un indicateur 🔴 "Hors ligne" apparaît

2. **Quand la connexion revient** :
   - La synchronisation démarre automatiquement
   - L'indicateur passe à 🟢 "En ligne"
   - Toutes les données sont envoyées vers Firebase

> [!TIP]
> Vous n'avez rien à faire manuellement, la synchronisation est 100% automatique.

---

## FAQ & Dépannage

### Questions Fréquentes

**Q : L'application affiche un écran blanc au démarrage ?**  
R : Patientez quelques secondes. Si le problème persiste, fermez et rouvrez l'application.

**Q : Je ne peux pas me connecter ?**  
R : Vérifiez votre connexion internet et que votre compte est bien **actif**.

**Q : Les données ne se synchronisent pas ?**  
R : Vérifiez que la configuration Firebase est correcte dans les paramètres.

**Q : Comment changer mon mot de passe ?**  
R : Utilisez la fonction "Mot de passe oublié" depuis l'écran de connexion.

**Q : Un produit n'apparaît pas dans le POS ?**  
R : Vérifiez qu'il est bien marqué comme **"Actif"** dans le catalogue.

### Contact Support

Pour toute assistance technique :
- 📧 Email : Namane.Mohamed96@gmail.com
- 📱 Téléphone : +213 656 14 11 96

---

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `F1` | Recherche rapide |
| `F2` | Nouveau client |
| `Échap` | Fermer le modal actuel |
| `Ctrl + P` | Imprimer le reçu |

---

© 2026 Tika Tech - Tous droits réservés