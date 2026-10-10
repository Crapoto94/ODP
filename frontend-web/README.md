# frontend-web — dépôt des demandes de tournage

Site public (à héberger en **DMZ**) permettant aux sociétés de production de déposer leur demande d'autorisation de tournage.
Page volontairement « blanche » (sans en-tête ni pied de page) : elle est intégrée en **iframe** dans le site de la ville.

Il ne contient aucune donnée métier : il appelle l'API de VibeODP (réseau interne) avec une clé, via des routes serveur
(`/api/config`, `/api/demandes`) — la clé n'est jamais envoyée au navigateur.

## Configuration

Copier `.env.example` en `.env` :

| Variable | Rôle |
|---|---|
| `BACK_URL` | URL interne de VibeODP, joignable depuis la DMZ (ex. `http://vibeodp.ivry.local:3000`) |
| `TOURNAGE_API_KEY` | Clé affichée dans VibeODP › Paramètres › Gestion des tournages › Accès du site public |
| `FRAME_ANCESTORS` | Origines autorisées à intégrer la page en iframe (en-tête CSP `frame-ancestors`) |

Flux réseau à ouvrir : DMZ → VibeODP (TCP 3000), uniquement vers `/api/public/tournages/*`.

## Lancer

```bash
npm install
npm run dev          # http://localhost:3100
npm run build && npm start
```

Docker : `docker build -t vibeodp-frontend-web . && docker run -p 3100:3100 --env-file .env vibeodp-frontend-web`

## Intégration dans le site de la ville

```html
<iframe id="tournage" src="https://tournage.exemple.fr/" style="width:100%;border:0;min-height:800px" title="Demande de tournage"></iframe>
<script>
  // Ajuste la hauteur de l'iframe (évite l'ascenseur interne)
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'vibeodp-height') document.getElementById('tournage').style.height = e.data.height + 'px';
    if (e.data && e.data.type === 'vibeodp-scroll-top') document.getElementById('tournage').scrollIntoView({ behavior: 'smooth' });
  });
</script>
```

## Règles appliquées (et rejouées côté back)

- Dates de tournage bloquantes : pas avant `date du jour + délai d'instruction` (jours ouvrés lundi-vendredi, hors jours fériés, ou calendaires — paramétrable).
- Périodes d'absence : une demande reçue pendant une période ne peut donner lieu à un tournage avant la date de reprise.
- Attestation d'assurance et plan de localisation obligatoires ; attestation de l'école + contact pour les projets étudiants.
- Information drone (Cerfa 15476*02), passerelle aux câbles (Ville de Paris) et Parc des Cormailles (Département 94).
