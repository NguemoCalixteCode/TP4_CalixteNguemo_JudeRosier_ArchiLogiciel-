// B2 · L'ordre des décorateurs a-t-il un effet ? Lancer : node seance4-patterns/tp-data-cyber/ordre-decorateurs.js
// Les deux compositions utilisent exactement les mêmes classes, empilées dans un ordre différent.
import { FakeHttpClient, LoggingClient, CachingClient, RetryClient } from '../structuraux/decorator.js';

async function scenario(nom, fabriquer) {
  const base = new FakeHttpClient();
  const client = fabriquer(base);
  console.log(`\n${nom}`);
  await client.get('/api/ruches');
  await client.get('/api/ruches');
  await client.get('/api/instable');
  console.log(`  → appels réels sur le client de base : ${base.calls}`);
}

// Composition A : le cache est à l'extérieur
await scenario('A · Cache( Retry( Log( base ) ) )', base => new CachingClient(new RetryClient(new LoggingClient(base))));

// Composition B : la journalisation est à l'extérieur
await scenario('B · Log( Cache( Retry( base ) ) )', base => new LoggingClient(new CachingClient(new RetryClient(base))));

// Composition C : ordre retenu pour la passerelle QueenBee, avec deux niveaux de journalisation
//   - Log intérieur (contre la base) : trace CHAQUE émission radio réelle, y compris les échecs ;
//   - Retry autour : réessaie uniquement ce qui est vraiment parti sur la liaison instable ;
//   - Cache autour : une donnée déjà obtenue ne coûte plus aucun temps d'émission radio ;
//   - Log extérieur : latence perçue par l'appelant (0 ms sur un HIT, cumul des tentatives sinon).
await scenario('C · Log( Cache( Retry( Log( base ) ) ) )', base => new LoggingClient(new CachingClient(new RetryClient(new LoggingClient(base)))));

// Réponses aux questions B2 : voir PATTERNS.md (partie B2).
