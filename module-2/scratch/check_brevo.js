import * as Brevo from '@getbrevo/brevo';
console.log('Brevo Keys:', Object.keys(Brevo));
if (Brevo.TransactionalEmailsApi) {
    console.log('TransactionalEmailsApi exists');
} else if (Brevo.default && Brevo.default.TransactionalEmailsApi) {
    console.log('TransactionalEmailsApi exists in default');
} else {
    console.log('TransactionalEmailsApi NOT found');
}
