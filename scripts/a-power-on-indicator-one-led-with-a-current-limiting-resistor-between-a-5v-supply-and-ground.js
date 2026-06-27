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
      eda.sys_ToastMessage.showMessage('Fetching parts from library...', 3);

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

      eda.sys_ToastMessage.showMessage('Parts found. Placing schematic...', 3);

      // ── Layout (vertical chain, X = 300) ──────────────────────────────────
      //
      //  VCC flag      Y = 750
      //  wire          750 → 700
      //  J1            Y = 680  (pins at 700, 660)
      //  wire          660 → 620
      //  R1            Y = 600  (pins at 620, 580)
      //  wire          580 → 520
      //  LED1          Y = 500  (pins at 520, 480)
      //  wire          480 → 420
      //  GND flag      Y = 420
      //
      const X = 300;

      // VCC power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 750, 0, false);
      eda.sys_ToastMessage.showMessage('VCC flag placed.', 1);

      // Wire: VCC flag → J1 top pin
      await eda.sch_PrimitiveWire.create([X, 750, X, 700]);

      // J1 – 2-pin header (rotation 90 = vertical, pin1 top)
      await eda.sch_PrimitiveComponent.create(j1Part, X, 680, '', 90, false, true, true);
      eda.sys_ToastMessage.showMessage('J1 placed.', 1);

      // Wire: J1 bottom pin → R1 top pin
      await eda.sch_PrimitiveWire.create([X, 660, X, 620]);

      // R1 – 150 Ω resistor (rotation 90 = vertical)
      await eda.sch_PrimitiveComponent.create(r1Part, X, 600, '', 90, false, true, true);
      eda.sys_ToastMessage.showMessage('R1 placed.', 1);

      // Wire: R1 bottom pin → LED1 anode
      await eda.sch_PrimitiveWire.create([X, 580, X, 520]);

      // LED1 – red LED (rotation 90 = vertical, anode top)
      await eda.sch_PrimitiveComponent.create(ledPart, X, 500, '', 90, false, true, true);
      eda.sys_ToastMessage.showMessage('LED1 placed.', 1);

      // Wire: LED1 cathode → GND flag
      await eda.sch_PrimitiveWire.create([X, 480, X, 420]);

      // GND power flag
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 420, 0, false);
      eda.sys_ToastMessage.showMessage('GND flag placed.', 1);

      // Save
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