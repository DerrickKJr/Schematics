eda.sys_MessageBox.showConfirmationMessage(
  'Place Power-On Indicator schematic (J1, R1, LED1)?',
  'Power-On Indicator',
  'OK',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts from library...', 2);

      const devices = await eda.lib_Device.getByLcscIds(['C2337', 'C58608', 'C84256']);

      const j1Part = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C2337'
      );
      const r1Part = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C58608'
      );
      const ledPart = devices.find(d =>
        (d.supplierId || d.otherProperty?.['Supplier Part']) === 'C84256'
      );

      if (!j1Part) throw new Error('Could not find J1 (C2337) in library.');
      if (!r1Part) throw new Error('Could not find R1 (C58608) in library.');
      if (!ledPart) throw new Error('Could not find LED1 (C84256) in library.');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      // Layout (vertical chain at X=300):
      // VCC flag   Y=750
      // wire       750 -> 700
      // J1         Y=680  (2-pin header, vertical, pins at ~700 and ~660)
      // wire       660 -> 600
      // R1         Y=580  (pins at 600 and 560)
      // wire       560 -> 500
      // LED1       Y=480  (pins at 500 and 460)
      // wire       460 -> 400
      // GND flag   Y=400

      const X = 300;

      // Place VCC power flag at top
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 750, 0, false);

      // Place J1 (2-pin header) — vertical, centred at Y=680
      await eda.sch_PrimitiveComponent.create(j1Part, X, 680, '', 90, false, true, true);

      // Place R1 (150 ohm resistor) — vertical, centred at Y=580
      await eda.sch_PrimitiveComponent.create(r1Part, X, 580, '', 90, false, true, true);

      // Place LED1 — vertical, centred at Y=480
      await eda.sch_PrimitiveComponent.create(ledPart, X, 480, '', 90, false, true, true);

      // Place GND power flag at bottom
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 400, 0, false);

      eda.sys_ToastMessage.showMessage('Drawing wires...', 2);

      // Wire: VCC flag (Y=750) down to J1 top pin (Y=700)
      await eda.sch_PrimitiveWire.create([X, 750, X, 700]);

      // Wire: J1 bottom pin (Y=660) down to R1 top pin (Y=600)
      await eda.sch_PrimitiveWire.create([X, 660, X, 600]);

      // Wire: R1 bottom pin (Y=560) down to LED1 anode (Y=500)
      await eda.sch_PrimitiveWire.create([X, 560, X, 500]);

      // Wire: LED1 cathode (Y=460) down to GND flag (Y=400)
      await eda.sch_PrimitiveWire.create([X, 460, X, 400]);

      eda.sys_ToastMessage.showMessage('Saving schematic...', 2);
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('Power-On Indicator schematic complete!', 4);

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);