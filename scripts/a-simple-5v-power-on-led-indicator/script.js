eda.sys_MessageBox.showConfirmationMessage(
  'Place 5V Power-On LED Indicator schematic?',
  'Confirm',
  'OK',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts...', 2);

      // Fetch parts from library
      const devices = await eda.lib_Device.getByLcscIds(['C65114', 'C17557', 'C84256']);

      const j1Part = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C65114'
      );
      const r1Part = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C17557'
      );
      const ledPart = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C84256'
      );

      if (!j1Part) throw new Error('Could not find J1 connector (C65114)');
      if (!r1Part) throw new Error('Could not find R1 resistor (C17557)');
      if (!ledPart) throw new Error('Could not find LED1 (C84256)');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      // Layout (vertical chain):
      // VCC flag   Y=700
      // wire       700 -> 650
      // J1         Y=630  (pins at ~650 and ~610)
      // wire       610 -> 560
      // R1         Y=540  (pins at ~560 and ~520)
      // wire       520 -> 470
      // LED1       Y=450  (pins at ~470 and ~430)
      // wire       430 -> 380
      // GND flag   Y=380

      const X = 300;

      // Place VCC power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 700, 0, false);

      // Place J1 (2-pin connector) - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(j1Part, X, 630, '', 90, false, true, true);

      // Place R1 (220 ohm resistor) - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(r1Part, X, 540, '', 90, false, true, true);

      // Place LED1 - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(ledPart, X, 450, '', 90, false, true, true);

      // Place GND power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 380, 0, false);

      eda.sys_ToastMessage.showMessage('Drawing wires...', 2);

      // Wire: VCC flag -> J1 top pin
      await eda.sch_PrimitiveWire.create([X, 700, X, 660]);

      // Wire: J1 bottom pin -> R1 top pin
      await eda.sch_PrimitiveWire.create([X, 610, X, 560]);

      // Wire: R1 bottom pin -> LED1 anode (top pin)
      await eda.sch_PrimitiveWire.create([X, 520, X, 470]);

      // Wire: LED1 cathode (bottom pin) -> GND flag
      await eda.sch_PrimitiveWire.create([X, 430, X, 380]);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('5V Power-On LED Indicator schematic complete!', 4);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);