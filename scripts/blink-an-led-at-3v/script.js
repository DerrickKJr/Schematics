eda.sys_MessageBox.showConfirmationMessage(
  'Revert R1 from 10kΩ (C25804) to 100Ω (C21190) in the blink-an-led-at-3v schematic?',
  'Confirm Schematic Update',
  'OK',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts from library...', 2);

      const devices = await eda.lib_Device.getByLcscIds(['C21190', 'C84256']);

      const resistor = devices.find(d =>
        (d.supplierId === 'C21190') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C21190')
      );
      const led = devices.find(d =>
        (d.supplierId === 'C84256') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C84256')
      );

      if (!resistor) throw new Error('Could not find resistor C21190 in library.');
      if (!led) throw new Error('Could not find LED C84256 in library.');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      // Layout: VCC at top, then R1 (100Ω), then LED, then GND
      // X center = 400, Y positions (inches * 100):
      // VCC  Y=700
      // R1   Y=600  (pins at 620 and 580)
      // D1   Y=500  (pins at 520 and 480)
      // GND  Y=400

      const X = 400;

      // Place VCC power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 700, 0, false);

      // Place R1 (100Ω, C21190) — vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(resistor, X, 600, '', 90, false, true, true);

      // Place LED (C84256) — vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(led, X, 500, '', 90, false, true, true);

      // Place GND power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 400, 0, false);

      eda.sys_ToastMessage.showMessage('Drawing wires...', 2);

      // Wire: VCC (700) -> top of R1 (620)
      await eda.sch_PrimitiveWire.create([X, 700, X, 620]);

      // Wire: bottom of R1 (580) -> top of LED (520)
      await eda.sch_PrimitiveWire.create([X, 580, X, 520]);

      // Wire: bottom of LED (480) -> GND (400)
      await eda.sch_PrimitiveWire.create([X, 480, X, 400]);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('Done! R1 reverted to 100Ω (C21190). Schematic saved.', 4);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);