// B1 · Étendre sans modifier : ajouter le canal « sms-groupe » à la fabrique de notifications
// (un SMS envoyé à toutes les apicultrices d'une coopérative). factory.js ne doit PAS être modifié.
import { Notification, registerChannel } from '../creationnels/factory.js';

// B1.1 : nouvelle classe concrète, ajoutée À CÔTÉ de la fabrique (extension, pas modification)
export class SmsGroupeNotification extends Notification {
  send(msg) {
    return `[SMS-GROUPE] ${msg}`;
  }
}

export function installerCanalGroupe() {
  // B1.2 : on passe par le point d'extension prévu par la fabrique (registre) → OCP respecté
  registerChannel('sms-groupe', SmsGroupeNotification);
}
