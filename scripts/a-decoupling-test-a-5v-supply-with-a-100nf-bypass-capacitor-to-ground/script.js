eda.sys_MessageBox.showConfirmationMessage(
  'Place Decoupling Test Circuit (J1 + C1)?',
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

      const devices = await eda.lib_Device.getByLcscIds(['C2337', 'C307331']);

      const j1Part = devices.find(d =>
        (d.supplierId === 'C2337') ||
        (d.otherProperty && d.otherProperty['Supplier Part'] === 'C2337')
      );
      const c1Part = devices.find(d =>
        (d.supplierId === 'C307331') ||
        (d.otherProperty && d.otherProperty['Supplier Part'] === 'C307331')
      );

      if (!j1Part) throw new Error('Could not find J1 (C2337) in library.');
      if (!c1Part) throw new Error('Could not find C1 (C307331) in library.');

      eda.sys_ToastMessage.showMessage('Placing components...', 2);

      // Layout (all coordinates in units of 0.01 inch):
      //
      //   VCC flag  Y=700
      //   |  wire   700->640
      //   J1        Y=600  (pins at ~640 and ~560)
      //   |  wire   560->480
      //   VCC net node / power flag VCC  Y=480
      //   |  wire   480->400
      //   C1        Y=380  (pins at ~400 and ~360)
      //   |  wire   360->280
      //   GND flag  Y=280
      //
      // X center = 300

      const X = 300;

      // --- VCC power flag at top ---
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 700, 0, false);

      // --- Place J1 (2-pin connector), vertical ---
      // Pin 1 (VCC) at top, Pin 2 (GND) at bottom
      await eda.sch_PrimitiveComponent.create(j1Part, X, 600, '', 90, false, true, true);

      // Wire: VCC flag -> J1 pin 1
      await eda.sch_PrimitiveWire.create([X, 700, X, 640]);

      // Wire: J1 pin 2 -> mid node
      await eda.sch_PrimitiveWire.create([X, 560, X, 480]);

      // --- VCC power flag at mid node (connects J1 pin2 to C1 pin1 via VCC net) ---
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'VCC', X, 480, 0, false);

      // Wire: mid VCC node -> C1 pin 1
      await eda.sch_PrimitiveWire.create([X, 480, X, 420]);

      // --- Place C1 (100nF capacitor), vertical ---
      await eda.sch_PrimitiveComponent.create(c1Part, X, 380, '', 90, false, true, true);

      // Wire: C1 pin 2 -> GND flag
      await eda.sch_PrimitiveWire.create([X, 340, X, 280]);

      // --- GND power flag at bottom ---
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 280, 0, false);

      // --- Save ---
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage('Decoupling circuit placed and saved!', 3);

    } catch(e) {
      eda.sys_MessageBox.showInformationMessage(
        'Error: ' + e.message + '\n' + e.stack,
        'Script Error'
      );
    }
  }
);