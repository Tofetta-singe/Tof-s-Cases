# Tof's Cases

Plateforme fullstack inspirée CS avec ouverture de caisses, inventaire, trade-up contracts et case battles temps réel.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express + Socket.io
- Auth: Discord OAuth2
- DB: MongoDB Atlas via Mongoose

## Démarrage

1. Installer les dépendances:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

2. Copier les variables d'environnement:

```bash
copy server\\.env.example server\\.env
copy client\\.env.example client\\.env
```

3. Lancer en développement:

```bash
npm run dev:server
npm run dev:client
```

## Notes

- `skins.json` à la racine sert de source unique pour les skins et les crates.
- La logique de tirage, battle et victoire est calculée côté serveur.
- Si `MONGO_URI` est absent, le projet bascule sur une persistance mémoire utile pour le prototypage local.
