import * as acrobat from '@adobe/pdfservices-node-sdk';

/**
 * Extract Text and Table Information and styling information for text data from PDF.
 */
export const extractTextWithStyles = () => {
  // Initial setup, create credentials instance.
  const credentials = acrobat.Credentials.servicePrincipalCredentialsBuilder()
    .withClientId('79bfba12abc3418cb052c4d2b42e38d5')
    .withClientSecret('p8e-Kp2EBvUFAihMmhyfWbpTkPdgUSfaq6dH')
    .build();

  // Create an ExecutionContext using credentials
  const options = new acrobat.ExtractPDF.options.ExtractPdfOptions.Builder()
    .addElementsToExtract(acrobat.ExtractPDF.options.ExtractElementType.TEXT)
    .getStylingInfo(true)
    .build();

  // Create a new operation instance.
  const extractPDFOperation = acrobat.ExtractPDF.Operation.createNew(),
    input = acrobat.FileRef.createFromLocalFile(
      'origin/纳兰词（上卷）.pdf',
      acrobat.ExtractPDF.SupportedSourceFormat.pdf,
    );

  // Set operation input from a source file.
  extractPDFOperation.setInput(input);

  // Set options
  extractPDFOperation.setOptions(options);

  // Create client config instance with the specified region.
  const clientConfig = acrobat.ClientConfig.clientConfigBuilder()
    .withConnectTimeout(10000)
    .withReadTimeout(60000)
    .build();

  //Generating a file name
  let outputFilePath = '.handling/acrobat/纳兰词（上卷）.json';

  extractPDFOperation
    .execute(acrobat.ExecutionContext.create(credentials, clientConfig))
    .then((result) => result.saveAsFile(outputFilePath))
    .catch((err) => {
      if (
        err instanceof acrobat.Error.ServiceApiError ||
        err instanceof acrobat.Error.ServiceUsageError
      ) {
        console.log('Exception encountered while executing operation', err);
      } else {
        console.log('Exception encountered while executing operation', err);
      }
    });
};
