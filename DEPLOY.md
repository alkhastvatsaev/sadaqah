# Déploiement sur Vercel & Configuration Stripe

Suivez ces étapes pour mettre votre application en ligne et récolter de vrais dons.

## 1. Préparation de Stripe

1. Connectez-vous à votre [Tableau de bord Stripe](https://dashboard.stripe.com).
2. Allez dans **Développeurs > Clés API**.
3. Récupérez votre **Clé secrète** (`sk_test_...` ou `sk_live_...`).
4. Récupérez votre **Clé publiable** (`pk_test_...` ou `pk_live_...`).
5. **Important :** Pour Apple Pay et Google Pay, allez dans **Paiements > Méthodes de paiement** et activez-les. Ajoutez également le domaine de votre mosquée (ou celui de Vercel une fois déployé) dans la section "Apple Pay".

## 2. Déploiement sur Vercel

L'application est déjà prête pour Vercel.

### Option A : Via Git (Recommandé)

1. Créez un nouveau dépôt sur GitHub/GitLab/Bitbucket.
2. Poussez votre code :
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```
3. Allez sur [Vercel](https://vercel.com/new).
4. Importez votre dépôt.
5. Dans la section **Environment Variables**, ajoutez :
   - `STRIPE_SECRET_KEY` : Votre clé secrète Stripe.
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : Votre clé publiable Stripe.
   - `NEXT_PUBLIC_BASE_URL` : L'URL Vercel fournie (ex: `https://votre-app.vercel.app`).
6. Cliquez sur **Deploy**.

### Option B : Via Vercel CLI

Si vous avez le CLI Vercel installé :

```bash
npx vercel
```

Pensez à ajouter les variables d'environnement dans le tableau de bord Vercel après le déploiement.

## 3. Test final

Une fois déployé, testez un don de 1€ pour vérifier que la redirection Stripe fonctionne bien et que Apple/Google Pay apparaissent correctement.
