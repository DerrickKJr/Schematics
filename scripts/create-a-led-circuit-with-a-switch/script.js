eda.sys_MessageBox.showConfirmationMessage(
  'Build LED circuit with switch schematic?',
  'LED Circuit with Switch',
  'Build',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts from library...', 3);

      // Fetch all required parts
      const devices = await eda.lib_Device.getByLcscIds(['C65114', 'C318884', 'C17557', 'C84256']);

      const j1Part = devices.find(d =>
        (d.supplierId === 'C65114') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C65114')
      );
      const sw1Part = devices.find(d =>
        (d.supplierId === 'C318884') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C318884')
      );
      const r1Part = devices.find(d =>
        (d.supplierId === 'C17557') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C17557')
      );
      const led1Part = devices.find(d =>
        (d.supplierId === 'C84256') || (d.otherProperty && d.otherProperty['Supplier Part'] === 'C84256')
      );

      if (!j1Part)   throw new Error('Could not find J1 (C65114) in library.');
      if (!sw1Part)  throw new Error('Could not find SW1 (C318884) in library.');
      if (!r1Part)   throw new Error('Could not find R1 (C17557) in library.');
      if (!led1Part) throw new Error('Could not find LED1 (C84256) in library.');

      eda.sys_ToastMessage.showMessage('Placing components...', 3);

      // Layout plan (all coordinates in 1/100 inch units):
      // Chain runs vertically at X=400
      // VCC flag        Y=750
      // J1 connector    Y=680  (2-pin, pins at ~700 and ~660)
      // wire            700 -> 660 (internal to J1, handled by component)
      // SW1 switch      Y=580  (pins at ~600 and ~560)
      // R1 resistor     Y=480  (pins at ~500 and ~460)
      // LED1            Y=380  (pins at ~400 and ~360)
      // GND flag        Y=300

      // We'll place everything in a vertical chain at X=400
      // Using rotation=90 for vertical orientation where applicable

      const X = 400;

      // Place VCC power flag at top
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 750, 0, false);

      // Place J1 (2-pin power connector) - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(j1Part, X, 670, '', 90, false, true, true);

      // Place SW1 (SPST switch) - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(sw1Part, X, 560, '', 90, false, true, true);

      // Place R1 (resistor) - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(r1Part, X, 460, '', 90, false, true, true);

      // Place LED1 - vertical, rotation 90
      await eda.sch_PrimitiveComponent.create(led1Part, X, 360, '', 90, false, true, true);

      // Place GND power flag at bottom
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 290, 0, false);

      eda.sys_ToastMessage.showMessage('Drawing wires...', 3);

      // Wire: VCC flag (Y=750) down to J1 top pin (~Y=730)
      await eda.sch_PrimitiveWire.create([X, 750, X, 730]);

      // Wire: J1 bottom pin (~Y=650) down to SW1 top pin (~Y=580)
      await eda.sch_PrimitiveWire.create([X, 650, X, 600]);

      // Wire: SW1 bottom pin (~Y=540) down to R1 top pin (~Y=500)
      await eda.sch_PrimitiveWire.create([X, 520, X, 500]);

      // Wire: R1 bottom pin (~Y=440) down to LED1 anode (~Y=400)
      await eda.sch_PrimitiveWire.create([X, 440, X, 400]);

      // Wire: LED1 cathode (~Y=320) down to GND flag (Y=290)
      await eda.sch_PrimitiveWire.create([X, 320, X, 290]);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('LED circuit schematic built successfully!', 4);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error building schematic:\n' + e.message + '\n\n' + e.stack,
        'Script Error'
      );
    }
  }
);