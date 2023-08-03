import type { Credentials as AcroCredentials } from 'adobe__pdfservices-node-sdk/auth/credentials';
import { ServiceAccountCredentialsBuilder } from 'adobe__pdfservices-node-sdk/auth/service-account-credentials-builder';
export * from 'adobe__pdfservices-node-sdk/pdfservices-sdk';

declare class ServicePrincipalCredentialsBuilder extends ServiceAccountCredentialsBuilder {}

export class Credentials extends AcroCredentials {
  static servicePrincipalCredentialsBuilder(): ServicePrincipalCredentialsBuilder;
}
