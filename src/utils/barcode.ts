import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Toast } from '@capacitor/toast';

export function scanBC(callback: (a: any) => void) {
  CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.ALL,
    web: {
      showCameraSelection: true,
      scannerFPS: 60
    }
  }).catch((e) =>{
    Toast.show({
      text: 'Failed to scan barcode'
    });
  })
  .then((r) => {
    if (r?.ScanResult) {
        callback(r.ScanResult);
    }
  })
}