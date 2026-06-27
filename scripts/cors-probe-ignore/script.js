eda.sys_MessageBox.showConfirmationMessage(
  'Build a simple LED + resistor circuit with VCC and GND?',
  'Build Circuit',
  'OK',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }
    try {
      eda.sys_ToastMessage.showMessage('Fetching parts...', 2);

      const devices = await eda.lib_Device.getByLcscIds(['C21190', 'C84256']);
      const resistor = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C21190'
      );
      const led = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C84256'
      );

      if (!resistor) throw new Error('Resistor (C21190) not found in library.');
      if (!led)      throw new Error('LED (C84256) not found in library.');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      const X = 300;

      // VCC flag at top
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 700, 0, false);

      // Wire: VCC down to top of resistor
      await eda.sch_PrimitiveWire.create([X, 700, X, 620]);

      // Resistor R1 centred at Y=600 (pins at 620 top, 580 bottom), rotated 90°
      await eda.sch_PrimitiveComponent.create(resistor, X, 600, '', 90, false, true, true);

      // Wire: bottom of resistor down to top of LED
      await eda.sch_PrimitiveWire.create([X, 580, X, 520]);

      // LED D1 centred at Y=500 (pins at 520 top, 480 bottom), rotated 90°
      await eda.sch_PrimitiveComponent.create(led, X, 500, '', 90, false, true, true);

      // Wire: bottom of LED down to GND
      await eda.sch_PrimitiveWire.create([X, 480, X, 400]);

      // GND flag at bottom
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 400, 0, false);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('Circuit built successfully!', 3);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);