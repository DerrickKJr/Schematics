// 3V LED Circuit - EasyEDA Pro Standalone Script
// Canvas coords confirmed from status bar (inches, Y up from bottom)

eda.sys_MessageBox.showConfirmationMessage(
  '3V LED Circuit\n\nVCC = 3V | R1 = 100Ω | D1 = LED\n\nPlace on Schematic 1 › P1?',
  '3V LED Circuit Generator',
  'Place Circuit',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      // All coords in EasyEDA canvas units (inches × 100)
      // Confirmed positions:
      //   VCC flag:  (200, 700)
      //   R1 pins:   top (200, 620), bottom (200, 580)
      //   LED pins:  top (200, 520), bottom (200, 480)
      //   GND flag:  (200, 400)
      const X = 200;

      eda.sys_ToastMessage.showMessage('Fetching components...', 2);
      const devices  = await eda.lib_Device.getByLcscIds(['C21190', 'C84256']);
      const resistor = devices.find(d => (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C21190');
      const led      = devices.find(d => (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C84256');

      if (!resistor) throw new Error('Resistor (C21190) not found');
      if (!led)      throw new Error('LED (C84256) not found');

      eda.sys_ToastMessage.showMessage('Placing VCC...', 2);
      await eda.sch_PrimitiveComponent.createNetFlag('Power',  'VCC', X, 700, 0, false);

      eda.sys_ToastMessage.showMessage('Placing R1...', 2);
      await eda.sch_PrimitiveComponent.create(resistor, X, 600, '', 90, false, true, true);

      eda.sys_ToastMessage.showMessage('Placing D1...', 2);
      await eda.sch_PrimitiveComponent.create(led, X, 500, '', 270, false, true, true);

      eda.sys_ToastMessage.showMessage('Placing GND...', 2);
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 400, 0, false);

      // Wires connecting pin-to-pin exactly
      eda.sys_ToastMessage.showMessage('Drawing wires...', 2);
      await eda.sch_PrimitiveWire.create([X, 700, X, 620]); // VCC → R1 top pin
      await eda.sch_PrimitiveWire.create([X, 580, X, 520]); // R1 bottom pin → LED top pin
      await eda.sch_PrimitiveWire.create([X, 480, X, 400]); // LED bottom pin → GND

      await eda.sch_Document.save();
      eda.sys_ToastMessage.showMessage('✅ LED circuit placed!', 3);

    } catch(e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n\n' + e.stack,
        'Script Error'
      );
    }
  }
);