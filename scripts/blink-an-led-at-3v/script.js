eda.sys_MessageBox.showConfirmationMessage(
  'Update blink-an-led-at-3v: Change R1 from 100Ω (C21190) to 10kΩ (C25804)?',
  'Modify Schematic',
  'OK',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts...', 2);

      const devices = await eda.lib_Device.getByLcscIds(['C25804', 'C84256']);

      const resistor = devices.find(d =>
        (d.supplierId === 'C25804') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C25804')
      );
      const led = devices.find(d =>
        (d.supplierId === 'C84256') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C84256')
      );

      if (!resistor) throw new Error('Could not find 10kΩ resistor (C25804)');
      if (!led) throw new Error('Could not find LED (C84256)');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      // Layout: vertical chain at X=300
      // VCC at Y=700, wire down to R1 at Y=600, wire to LED at Y=500, wire to GND at Y=400
      const X = 300;

      // Place VCC power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 700, 0, false);

      // Wire from VCC down to top of R1
      await eda.sch_PrimitiveWire.create([X, 700, X, 620]);

      // Place 10kΩ resistor R1 (vertical, rotation 90)
      await eda.sch_PrimitiveComponent.create(resistor, X, 600, '', 90, false, true, true);

      // Wire from bottom of R1 to top of LED
      await eda.sch_PrimitiveWire.create([X, 580, X, 520]);

      // Place LED D1 (vertical, rotation 90)
      await eda.sch_PrimitiveComponent.create(led, X, 500, '', 90, false, true, true);

      // Wire from bottom of LED to GND
      await eda.sch_PrimitiveWire.create([X, 480, X, 400]);

      // Place GND power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 400, 0, false);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('Done! R1 updated to 10kΩ (C25804). LED will be dimmer.', 4);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);